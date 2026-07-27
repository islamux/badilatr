import { prisma } from '../src/server/db/client';

export async function run(label: string, main: () => Promise<void>): Promise<never> {
  try {
    await main();
    await prisma.$disconnect();
    return process.exit(0);
  } catch (err) {
    console.error(`✗ ${label} failed:`, err);
    await prisma.$disconnect();
    return process.exit(1);
  }
}
