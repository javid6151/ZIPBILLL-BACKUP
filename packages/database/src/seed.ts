import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed into Supabase...');

  // 1. Seed Subscription Plans
  console.log('Seeding subscription plans...');
  const plans = [
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

  for (const p of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: p.name },
      update: p,
      create: p,
    });
  }

  // 2. Seed Default Demo Tenant
  console.log('Seeding demo tenant...');
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'the-royal-biryani' },
    update: {},
    create: {
      id: 'tenant-spice-garden',
      name: 'The Royal Biryani & Cafe',
      slug: 'the-royal-biryani',
      businessType: 'RESTAURANT',
      status: 'APPROVED',
      businessProfile: {
        create: {
          businessName: 'The Royal Biryani & Cafe',
          phone: '+91 98765 43210',
          email: 'owner@spicegarden.com',
          address: '104 Brigade Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          country: 'IN',
          currencyCode: 'INR',
          currencySymbol: '₹',
          timezone: 'Asia/Kolkata',
          onboardingCompleted: true,
        },
      },
    },
  });

  // 3. Seed Platform Super Admin User
  console.log('Seeding super admin user...');
  await prisma.user.upsert({
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

  // 4. Seed Restaurant Users
  console.log('Seeding restaurant staff users (OWNER, WAITER, KITCHEN)...');
  const staffUsers = [
    {
      email: 'owner@spicegarden.com',
      fullName: 'Rajesh Sharma',
      roleType: 'OWNER' as const,
    },
    {
      email: 'waiter@spicegarden.com',
      fullName: 'Rohan Gupta',
      roleType: 'WAITER' as const,
    },
    {
      email: 'kitchen@spicegarden.com',
      fullName: 'Chef Anand',
      roleType: 'KITCHEN' as const,
    },
  ];

  for (const u of staffUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        tenantId: tenant.id,
        email: u.email,
        passwordHash: 'hashed_password_demo',
        fullName: u.fullName,
        roleType: u.roleType,
        isActive: true,
      },
    });
  }

  // 5. Seed Tables
  console.log('Seeding dining tables...');
  const tables = [
    { tableNumber: '1', tableName: 'Table 1', capacity: 4, status: 'AVAILABLE' as const },
    { tableNumber: '2', tableName: 'Table 2', capacity: 2, status: 'OCCUPIED' as const },
    { tableNumber: '3', tableName: 'Table 3', capacity: 6, status: 'BILLING' as const },
    { tableNumber: '4', tableName: 'Table 4', capacity: 4, status: 'AVAILABLE' as const },
    { tableNumber: '5', tableName: 'VIP 1', capacity: 8, status: 'RESERVED' as const },
    { tableNumber: '6', tableName: 'Terrace 1', capacity: 4, status: 'AVAILABLE' as const },
  ];

  for (const t of tables) {
    const existing = await prisma.table.findFirst({
      where: { tenantId: tenant.id, tableNumber: t.tableNumber },
    });
    if (!existing) {
      await prisma.table.create({
        data: {
          tenantId: tenant.id,
          ...t,
        },
      });
    }
  }

  // 6. Seed Menu Categories and Dishes
  console.log('Seeding menu dishes...');
  const category = await prisma.category.upsert({
    where: { id: 'cat-biryani-01' },
    update: {},
    create: {
      id: 'cat-biryani-01',
      tenantId: tenant.id,
      name: 'Biryani Specials',
      sortOrder: 1,
      isActive: true,
    },
  });

  const dishes = [
    { name: 'Hyderabadi Chicken Dum Biryani', basePrice: 32000, foodType: 'NON_VEG' as const },
    { name: 'Mutton Ghee Roast Biryani', basePrice: 42000, foodType: 'NON_VEG' as const },
    { name: 'Paneer Tikka Biryani', basePrice: 28000, foodType: 'VEG' as const },
    { name: 'Chicken Tikka Kebab (6 pcs)', basePrice: 29000, foodType: 'NON_VEG' as const },
  ];

  for (const d of dishes) {
    const existing = await prisma.menuItem.findFirst({
      where: { tenantId: tenant.id, name: d.name },
    });
    if (!existing) {
      await prisma.menuItem.create({
        data: {
          tenantId: tenant.id,
          categoryId: category.id,
          name: d.name,
          basePrice: d.basePrice,
          foodType: d.foodType,
          isAvailable: true,
        },
      });
    }
  }

  console.log('✅ Database seeded successfully into Supabase!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
