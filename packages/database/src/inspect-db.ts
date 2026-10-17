import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Database Table Counts ---');
  const [
    tenants,
    registrations,
    profiles,
    users,
    orders,
    tables,
    categories,
    menuItems,
    plans,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.registrationRequest.count(),
    prisma.businessProfile.count(),
    prisma.user.count(),
    prisma.order.count(),
    prisma.table.count(),
    prisma.category.count(),
    prisma.menuItem.count(),
    prisma.subscriptionPlan.count(),
  ]);

  console.log(`Tenants: ${tenants}`);
  console.log(`RegistrationRequests: ${registrations}`);
  console.log(`BusinessProfiles: ${profiles}`);
  console.log(`Users: ${users}`);
  console.log(`Orders: ${orders}`);
  console.log(`Tables: ${tables}`);
  console.log(`Categories: ${categories}`);
  console.log(`MenuItems: ${menuItems}`);
  console.log(`SubscriptionPlans: ${plans}`);

  const userList = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, roleType: true },
  });
  console.log('\n--- Existing Users ---');
  console.log(JSON.stringify(userList, null, 2));

  const tenantList = await prisma.tenant.findMany({
    select: { id: true, name: true, slug: true, status: true },
  });
  console.log('\n--- Existing Tenants ---');
  console.log(JSON.stringify(tenantList, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
