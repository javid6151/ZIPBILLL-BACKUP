import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@platform/database';
import { seedTenantStarterData } from '@/lib/seed-starter';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const slug = searchParams.get('slug');
    const email = searchParams.get('email');

    // 1. Fetch Tenant & Business Profile with cascading fallback
    let tenant = null;

    if (tenantId) {
      tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          businessProfile: true,
          modules: true,
        },
      });
    }

    if (!tenant && slug) {
      tenant = await prisma.tenant.findUnique({
        where: { slug },
        include: {
          businessProfile: true,
          modules: true,
        },
      });
    }

    if (!tenant && email) {
      const user = await prisma.user.findFirst({
        where: { email },
        include: {
          tenant: {
            include: {
              businessProfile: true,
              modules: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (user?.tenant) {
        tenant = user.tenant;
      }
    }

    // Fallback: If still no tenant found, find the latest approved tenant in PostgreSQL
    if (!tenant) {
      tenant = await prisma.tenant.findFirst({
        where: { status: 'APPROVED' },
        include: {
          businessProfile: true,
          modules: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!tenant) {
      return NextResponse.json(
        { error: 'No active restaurant tenant found for this session or URL.' },
        { status: 404 }
      );
    }

    const activeTenantId = tenant.id;

    // Fetch user's available restaurants for quick multi-tenant switcher
    let availableTenants: Array<{ id: string; name: string; slug: string; businessType: string }> = [];
    if (email) {
      const userRecords = await prisma.user.findMany({
        where: { email },
        include: { tenant: true },
      });
      availableTenants = userRecords
        .filter((u) => Boolean(u.tenant))
        .map((u) => ({
          id: u.tenant!.id,
          name: u.tenant!.name,
          slug: u.tenant!.slug,
          businessType: u.tenant!.businessType,
        }));
    }
    if (availableTenants.length === 0) {
      availableTenants = [
        {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          businessType: tenant.businessType,
        },
      ];
    }

    // 2. Fetch Tables (Auto-seed starter tables & menu if empty)
    let tables = await prisma.table.findMany({
      where: { tenantId: activeTenantId },
      orderBy: { sortOrder: 'asc' },
    });

    let categories = await prisma.category.findMany({
      where: { tenantId: activeTenantId },
      include: {
        menuItems: {
          where: { isAvailable: true },
          include: {
            variants: true,
          },
          orderBy: [{ sortOrder: 'asc' }, { basePrice: 'asc' }],
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Do not auto-seed dummy items. New accounts start cleanly at 0 items.

    // 4. Fetch All Menu Items Flat (Ordered by Course Rank, Sort Order, Price)
    const menuItems = await prisma.menuItem.findMany({
      where: { tenantId: activeTenantId },
      include: {
        category: true,
        variants: true,
      },
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { sortOrder: 'asc' },
        { basePrice: 'asc' },
      ],
    });

    // 5. Fetch Orders
    const orders = await prisma.order.findMany({
      where: { tenantId: activeTenantId },
      include: {
        items: true,
        table: true,
        invoice: {
          include: {
            payments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // 6. Fetch Customers
    const customers = await prisma.customer.findMany({
      where: { tenantId: activeTenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // 7. Fetch Expenses
    const expenses = await prisma.expense.findMany({
      where: { tenantId: activeTenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // 8. Fetch Inventory Items
    const inventory = await prisma.inventoryItem.findMany({
      where: { tenantId: activeTenantId },
      orderBy: { name: 'asc' },
      take: 50,
    });

    // 9. Fetch Staff Members
    const staff = await prisma.user.findMany({
      where: { tenantId: activeTenantId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        roleType: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    // 10. Fetch Restaurant Settings (services, staff_config, billing_config, printer_config)
    const settings = await prisma.restaurantSetting.findMany({
      where: { tenantId: activeTenantId },
    });

    // 11. Fetch Registered POS Hardware Devices
    const devices = await prisma.device.findMany({
      where: { tenantId: activeTenantId, isRevoked: false },
      orderBy: { lastActiveAt: 'desc' },
      take: 20,
    });

    // 12. Compute Real Live Statistics from Database Orders
    const totalOrdersCount = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'COMPLETED' || o.status === 'BILLED');
    const totalRevenuePaise = completedOrders.reduce((acc, o) => acc + (o.grandTotal || 0), 0);
    const activeOrdersCount = orders.filter(
      (o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED'
    ).length;
    const occupiedTablesCount = tables.filter((t) => t.status === 'OCCUPIED' || t.status === 'BILLING').length;

    const stats = {
      totalRevenue: totalRevenuePaise / 100,
      totalOrders: totalOrdersCount,
      activeOrders: activeOrdersCount,
      occupiedTables: occupiedTablesCount,
      totalTables: tables.length,
      totalMenuItems: menuItems.length,
      totalCustomers: customers.length,
      totalStaff: staff.length,
    };

    return NextResponse.json({
      success: true,
      tenantId: activeTenantId,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        businessType: tenant.businessType,
        status: tenant.status,
      },
      availableTenants,
      profile: tenant.businessProfile,
      tables,
      categories,
      menuItems,
      orders,
      customers,
      expenses,
      inventory,
      staff,
      settings,
      devices,
      stats,
      modules: tenant.modules
        ? tenant.modules.filter((m: any) => m.isEnabled).map((m: any) => m.moduleToken)
        : [],
    });
  } catch (error: any) {
    console.error('Tenant data fetching error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dynamic tenant data.', details: error.message },
      { status: 500 }
    );
  }
}
