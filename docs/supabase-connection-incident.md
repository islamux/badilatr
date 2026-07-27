# Supabase Connection Incident — Root Cause & Postmortem

**Date:** 2026-07-27
**Status:** Resolved
**Severity:** High (blocked all DB-dependent development)
**Project ref:** `peunlmhaipvfdxdtsubc` (Supabase, region `aws-0-ap-southeast-2`)

---

## TL;DR

The backend could not connect to Supabase. Prisma's error
`P1001: Can't reach database server` was **misleading on two levels**:

1. The database **was** reachable the entire time.
2. The real root cause was an **SSL-mode semantics mismatch** between Prisma's
   Rust engine and libpq — not a network, password, or Supabase problem.

The fix was a single connection-string change:
`sslmode=require` → `sslmode=no-verify`.

---

## Symptoms

| Command | Result |
| --- | --- |
| `pnpm db:health` | `P1001: Can't reach database server at aws-0-…pooler.supabase.com:5432` |
| `pnpm exec prisma db push` | Same `P1001` |
| `psql "…?sslmode=require" -c "SELECT 1"` | **Worked** (`1`) |
| Raw Node TCP + TLS probe | Connect + TLS 1.3 handshake **succeeded** |

`psql` connected fine; only Prisma failed. That gap was the key clue.

---

## Root Cause

### The actual bug: `sslmode=require` means different things to different clients

| Client | `sslmode=require` semantics |
| --- | --- |
| **libpq** (`psql`, `pg_dump`) | Encrypt the connection, **do not verify** the server certificate. |
| **Prisma Rust engine** & **node-`pg` v8** | Treat `require` as **`verify-full`** — encrypt **and** strictly verify the cert against the system CA trust store. |

Supabase Supavisor's TLS certificate chain is not in this machine's default
trust store (LMDE 7 / Debian 13, OpenSSL 3.5.6). So:

- **libpq** (`psql`) happily encrypted without verifying → connected.
- **Prisma's engine** tried to verify the cert, failed TLS verification,
  retried all 3 resolved pooler IPs, then surfaced the failure as a generic
  `P1001 "Can't reach database server"` — **not** as an SSL/certificate error.

### What it was NOT

| Suspect | Verdict | Evidence |
| --- | --- | --- |
| Network / firewall | ❌ Cleared | `nc -zv` to `:5432` and `:6543` succeeded; raw TCP + full TLS 1.3 handshake completed. |
| IPv6-only direct host | ❌ Cleared (separate known issue) | The direct host `db.…supabase.co` is IPv6-only and unreachable here, but `.env` correctly uses the IPv4 **pooler**. |
| Wrong password | ❌ Cleared | `psql` authenticated via SCRAM-SHA-256 and ran `SELECT 1` successfully. |
| Supabase service down | ❌ Cleared | REST API returned `401` (alive); pooler issued valid SCRAM challenges. |
| Prisma engine binary / OpenSSL 3.5 | ❌ Cleared | Engine loaded and linked `libssl.so.3` fine; the failure was TLS verification, not a binary-compat crash. |

> **Process note:** A hand-rolled Node SCRAM-SHA-256 probe was used during
> diagnosis and produced false `28P01 invalid_password` results for *every*
> password — including valid ones — due to a bug in the proof computation.
> This briefly misdirected the investigation toward "wrong password" and
> triggered unnecessary password resets. `psql`/libpq is the authoritative
> client and should have been the first diagnostic tool. Lesson logged.

---

## The Fix

One change in `.env`:

```diff
- DATABASE_URL=postgresql://postgres.peunlmhaipvfdxdtsubc:<PASSWORD>@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require
+ DATABASE_URL=postgresql://postgres.peunlmhaipvfdxdtsubc:<PASSWORD>@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=no-verify
```

`sslmode=no-verify` tells Prisma/node-`pg` to **encrypt the connection but skip
certificate verification** — matching the behavior libpq gives `psql`. The
connection is still TLS-encrypted (protection against passive eavesdropping);
it only drops CA-chain verification (no MITM protection). Acceptable for
development; see [Production hardening](#production-hardening) below.

### Why `no-verify` and not libpq's `require`?

node-`pg` v8 deprecated libpq-compatible SSL semantics. Its console warning
suggests either `sslmode=verify-full` (strict, what `require` now means) or
`sslmode=no-verify` (encrypt-without-verify). Prisma's Rust engine follows the
same interpretation. `no-verify` is the option that restores libpq-equivalent
behavior.

---

## Database Setup Performed (now working end-to-end)

Ordered sequence — extensions **must** precede `db push`/schema creation
because of the `perfumes.embedding vector(1536)` column.

1. **Enable extensions** (raw SQL — `pgvector` provides the `vector` type):
   ```bash
   psql "$DBURL" -f prisma/extensions.sql
   # CREATE EXTENSION IF NOT EXISTS vector;
   # CREATE EXTENSION IF NOT EXISTS pg_trgm;
   ```
2. **Create schema** — Prisma's `migrate diff` generated the DDL, executed via `psql`:
   ```bash
   pnpm exec prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > /tmp/schema.sql
   psql "$DBURL" -f /tmp/schema.sql
   ```
3. **Apply constraints + HNSW vector index** (raw SQL Prisma can't express):
   ```bash
   psql "$DBURL" -f prisma/constraints.sql
   ```
4. **Seed**:
   ```bash
   pnpm db:seed   # ✓ 7 brands, 78 notes, 10 perfumes, 126 note links
   ```
5. **Health check**:
   ```bash
   pnpm db:health # ✓ Extensions present · Write round-trip OK · Database healthy
   ```

### Final verified state

| Table | Rows |
| --- | --- |
| `brands` | 7 |
| `perfumes` | 10 |
| `notes` | 78 |
| `perfume_notes` | 126 |
| Extensions | `vector`, `pg_trgm` |

Gates: `pnpm typecheck` ✓ · `pnpm lint` ✓ · `pnpm test` 54/54 ✓

---

## Known Follow-ups

### `prisma db push` / `prisma db execute` are flaky from the CLI

The Prisma **migration engine** (used by `db push`, `migrate`) intermittently
hits the same `P1001` even with `sslmode=no-verify` in `.env` — it does not
reliably auto-load `.env` in this environment and its SSL handling is stricter
than the runtime query engine.

**Workaround used:** run raw SQL via `psql` for schema changes:
```bash
pnpm exec prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script | \
  psql "postgresql://postgres.peunlmhaipvfdxdtsubc:<PASSWORD>@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require"
```
(`psql`/libpq honors `sslmode=require` as encrypt-without-verify, so it works
without the `no-verify` dance.)

For idempotent re-runs, prefer `prisma migrate diff --from-schema-datasource`
(to diff against the live DB) rather than `--from-empty`.

### Orphaned engine packages

`node_modules/.pnpm` contains both `@prisma+engines@6.19.3` (in use) and
`7.9.0` / `7.1.1` (orphaned from an aborted upgrade). Harmless bloat; remove
with a clean `pnpm install --force` if desired.

### `.env` / `.env.example` drift

`.env` documents Supabase; `.env.example` still references Neon. Align
`.env.example` to the Supabase pooler template (with `sslmode=no-verify` and a
`<PASSWORD>` placeholder).

### Direct host is IPv6-only

`db.peunlmhaipvfdxdtsubc.supabase.co` resolves to **IPv6 only** and is
unreachable on IPv4-only networks (CI, this dev box). Always use the
**pooler** (`aws-0-ap-southeast-2.pooler.supabase.com`) for this project
unless an IPv4 add-on is purchased.

---

## Production Hardening

`sslmode=no-verify` is fine for dev, but for production you should restore
certificate verification:

1. Download Supabase's root certificate from
   Dashboard → Project → Connect → "Connection info" (or
   `https://supabase.com/docs/guides/database/connecting-to-postgres#connecting-with-ssl`).
2. Set `PGSSLROOTCERT=/path/to/prod-ca.crt` and use `sslmode=verify-ca` (or
   `verify-full` with `sslrootcert` in the URL).
3. For Vercel/CI, set the env var `PGSSLROOTCERT` to the cert contents and use
   `?sslmode=verify-ca&sslrootcert=$(echo $PGSSLROOTCERT)`.

This gives both encryption **and** MITM protection.

---

## Debugging Toolkit (for future connection issues)

When Prisma says "can't reach the database", run these in order — they take
under a minute and localize the failure precisely:

```bash
# 1. DNS
getent hosts aws-0-ap-southeast-2.pooler.supabase.com

# 2. TCP reachable?
nc -zv aws-0-ap-southeast-2.pooler.supabase.com 5432

# 3. Does the canonical client connect? (libpq = ground truth)
psql "postgresql://postgres.<ref>:<pw>@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require" -c "SELECT 1"
#   → works  : the DB + network + auth are ALL fine. The bug is in your ORM/driver SSL config.
#   → fails  : compare the exact error (28P01 = password, 08006 = conn, TLS err = cert)

# 4. Syscall-level trace of Prisma's engine (reveals where it really dies)
strace -f -e trace=connect,recvfrom -o /tmp/prisma.log \
  pnpm exec tsx -e "import{PrismaClient}from'@prisma/client';new PrismaClient().\$queryRaw\`SELECT 1\`"
grep -E "connect\(.*5432|ECONNREFUSED|ENETUNREACH" /tmp/prisma.log
#   3+ connect attempts to :5432 = engine is retrying all IPs = it's failing AFTER TCP, likely TLS/auth.
```

**Golden rule:** if `psql` connects and Prisma doesn't, the problem is in
Prisma's SSL/driver configuration — **not** Supabase, the network, or the
password. Check `sslmode` first.
