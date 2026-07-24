import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

import { getDb } from "../src/server/db/client";
import { brands } from "../src/server/db/schema";

async function main() {
  const db = getDb();

  // 1. Connection + required extensions.
  const ext = await db.execute(
    sql`SELECT extname FROM pg_extension WHERE extname IN ('vector', 'pg_trgm')`
  );
  const extNames = (
    ext.rows as { extname: string }[]
  ).map((r) => r.extname);
  if (!extNames.includes("vector") || !extNames.includes("pg_trgm")) {
    throw new Error(
      `Required extensions missing. Found: ${extNames.join(", ") || "none"}`
    );
  }
  console.log("✓ Extensions present:", extNames.join(", "));

  // 2. Writable round-trip (insert → read → delete) on a trivial row.
  const slug = "__health_check__";
  const [created] = await db
    .insert(brands)
    .values({ name: "Health Check", slug, type: "arabic" })
    .onConflictDoNothing({ target: brands.slug })
    .returning({ id: brands.id });

  if (created) {
    await db.delete(brands).where(eq(brands.slug, slug));
    console.log("✓ Write round-trip OK");
  } else {
    console.log("• Health row already existed — cleaned up");
    await db.delete(brands).where(eq(brands.slug, slug));
  }

  console.log("✓ Database healthy.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("✗ DB health failed:", err);
    process.exit(1);
  });
