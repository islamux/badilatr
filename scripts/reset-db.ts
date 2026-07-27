import { prisma } from '../src/server/db/client';
import { run } from './run';

async function main() {
  await prisma.perfumeNote.deleteMany();
  await prisma.perfume.deleteMany();
  await prisma.note.deleteMany();
  await prisma.brand.deleteMany();

  console.log('✓ Reset complete: perfume_notes, perfumes, notes, brands cleared.');
  console.log('  reviews & alternatives cleared via perfumes on-delete cascade.');
}

void run('Reset', main);
