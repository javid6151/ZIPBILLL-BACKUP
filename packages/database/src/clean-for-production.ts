import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Production Database Sanitization...');
  console.log('Preserving Platform Super Admin and System Subscription Plans.\n');

  // 1. Order and Billing Data
  console.log('1. Deleting order items, modifiers, kitchen tickets, invoices, payments, orders...');
  await prisma.orderItemModifier.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.kitchenTicketItem.deleteMany({});
  await prisma.kitchenTicket.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.order.deleteMany({});

  // 2. Menu and Catalog Data
  console.log('2. Deleting menu variants, modifiers, items, categories, kitchen stations...');
  await prisma.itemModifierGroup.deleteMany({});
  await prisma.modifier.deleteMany({});
  await prisma.modifierGroup.deleteMany({});
  await prisma.menuVariant.deleteMany({});
  await prisma.menuItem.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.kitchenStation.deleteMany({});

  // 3. Tables & Sections
  console.log('3. Deleting tables and table sections...');
  await prisma.table.deleteMany({});
  await prisma.tableSection.deleteMany({});

  // 4. Inventory, Suppliers, Expenses, Customers
  console.log('4. Deleting inventory, suppliers, expenses, customers...');
  await prisma.inventoryTransaction.deleteMany({});
  await prisma.recipeBom.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.customer.deleteMany({});

  // 5. Devices, Sessions, Logs, Sync
  console.log('5. Deleting devices, sessions, sync operations, audit logs...');
  await prisma.device.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.syncOperation.deleteMany({});
  await prisma.auditLog.deleteMany({});

  // 6. Tenant Members, Roles, Modules, Settings, Subscriptions
  console.log('6. Deleting restaurant members, custom roles, modules, settings, subscriptions...');
  await prisma.restaurantMember.deleteMany({});
  await prisma.restaurantSetting.deleteMany({});
  await prisma.tenantModule.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.subscription.deleteMany({});

  // 7. Business Profiles & Registration Requests
  console.log('7. Deleting business profiles and registration requests...');
  await prisma.businessProfile.deleteMany({});
  await prisma.registrationRequest.deleteMany({});

  // 8. Delete all non-SUPER_ADMIN users
  console.log('8. Removing all test users, keeping Super Admin (tarunuttupulusu@gmail.com)...');
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      roleType: { not: 'SUPER_ADMIN' },
    },
  });
  console.log(`   Deleted ${deletedUsers.count} test user(s).`);

  // Ensure super admin exists and is active with updated credentials
  const superAdmin = await prisma.user.findFirst({
    where: { email: 'tarunuttupulusu@gmail.com' },
  });
  if (!superAdmin) {
    console.log('   Creating clean Platform Super Admin...');
    await prisma.user.upsert({
      where: { email: 'tarunuttupulusu@gmail.com' },
      update: {
        passwordHash: 'tarun2314638',
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
  } else {
    await prisma.user.update({
      where: { email: 'tarunuttupulusu@gmail.com' },
      data: {
        passwordHash: 'tarun2314638',
        isActive: true,
      },
    });
    console.log(`   Super Admin verified: ${superAdmin.email} (${superAdmin.fullName})`);
  }

  // 9. Delete all Tenants
  console.log('9. Deleting all test tenants...');
  const deletedTenants = await prisma.tenant.deleteMany({});
  console.log(`   Deleted ${deletedTenants.count} tenant(s).`);

  // 10. Verify Subscription Plans
  console.log('10. Verifying system subscription plans...');
  const plansCount = await prisma.subscriptionPlan.count();
  if (plansCount === 0) {
    console.log('   Seeding default subscription plans...');
    const defaultPlans = [
      {
        id: 'plan-starter',
        name: 'STARTER',
        description: 'Ideal for small cafes, bakeries, and quick counters',
        monthlyPrice: 1999,
        yearlyPrice: 19990,
        maxTables: 10,
        maxStaff: 5,
        maxDevices: 2,
        featuresJson: ['pos.quick_counter', 'billing.tax_invoice', 'menu.catalog'],
      },
      {
        id: 'plan-pro',
        name: 'PRO',
        description: 'Full-service dine-in restaurants, cloud kitchens, and bistros',
        monthlyPrice: 4999,
        yearlyPrice: 49990,
        maxTables: 30,
        maxStaff: 15,
        maxDevices: 6,
        featuresJson: ['pos.dine_in', 'operations.tables', 'operations.kitchen_kds', 'billing.tax_invoice', 'inventory.stock', 'qr.ordering'],
      },
      {
        id: 'plan-enterprise',
        name: 'ENTERPRISE',
        description: 'Multi-outlet restaurant chains and high-volume dining',
        monthlyPrice: 9999,
        yearlyPrice: 99990,
        maxTables: 100,
        maxStaff: 50,
        maxDevices: 20,
        featuresJson: ['*'],
      },
    ];
    for (const p of defaultPlans) {
      await prisma.subscriptionPlan.create({ data: p });
    }
  }

  console.log('\n✅ Database successfully sanitized for production deployment!');
}

main()
  .catch((e) => {
    console.error('❌ Error cleaning database:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
