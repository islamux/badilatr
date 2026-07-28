import { prisma } from '../src/server/db/client';
import { run } from './run';

async function main() {
  const exts =
    await prisma.$queryRaw`SELECT extname::text FROM pg_extension WHERE extname IN ('vector', 'pg_trgm')`;
  const names = (exts as { extname: string }[]).map((r) => r.extname);
  if (!names.includes('vector') || !names.includes('pg_trgm')) {
    throw new Error(`Required extensions missing. Found: ${names.join(', ') || 'none'}`);
  }
  console.log('✓ Extensions present:', names.join(', '));

  const slug = '__health_check__';
  await prisma.brand.upsert({
    where: { slug },
    create: { name: 'Health Check', slug, type: 'arabic' },
    update: {},
  });
  await prisma.brand.delete({ where: { slug } });
  console.log('✓ Write round-trip OK');

  console.log('✓ Database healthy.');
}

void run('DB health', main);
