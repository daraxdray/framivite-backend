import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'daraxdray86@gmail.com';
  const adminPassword = 'Aa@12345';
  const adminName = 'Admin';

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const existing = await prisma.organizer.findUnique({
    where: { email: adminEmail.toLowerCase() },
  });

  if (existing) {
    const updated = await prisma.organizer.update({
      where: { id: existing.id },
      data: {
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log(`[SEED] Admin account updated: ${updated.email} (Role: ${updated.role})`);
  } else {
    const created = await prisma.organizer.create({
      data: {
        name: adminName,
        email: adminEmail.toLowerCase(),
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log(`[SEED] Admin account created: ${created.email} (Role: ${created.role})`);
  }
}

main()
  .catch((e) => {
    console.error('[SEED] Error seeding admin account:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
