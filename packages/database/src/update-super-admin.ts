import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating Super Admin credentials in PostgreSQL...');

  // Upsert the new super admin
  const user = await prisma.user.upsert({
    where: { email: 'tarunuttupulusu@gmail.com' },
    update: {
      passwordHash: 'tarun2314638',
      fullName: 'Tarun (Super Admin)',
      roleType: 'SUPER_ADMIN',
      isActive: true,
    },
    create: {
      email: 'tarunuttupulusu@gmail.com',
      passwordHash: 'tarun2314638',
      fullName: 'Tarun (Super Admin)',
      roleType: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  // Remove old demo super admin if present
  await prisma.user.deleteMany({
    where: { email: 'admin@platform.pos' },
  });

  console.log('✅ Super Admin updated successfully:');
  console.log({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    roleType: user.roleType,
    isActive: user.isActive,
  });
}

main()
  .catch((e) => {
    console.error('❌ Error updating Super Admin:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
