import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@platform/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ success: true, modules: [] });
    }

    const targetTenantId = tenantId;

    const tenantModules = await prisma.tenantModule.findMany({
      where: { tenantId: targetTenantId },
    });

    return NextResponse.json({
      success: true,
      tenantId: targetTenantId,
      modules: tenantModules,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, moduleToken, isEnabled, modules } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required.' },
        { status: 400 }
      );
    }

    const targetTenantId = tenantId;

    // Sub-token map to ensure parent and child tokens stay synchronized in PostgreSQL
    const SUB_TOKENS_MAP: Record<string, string[]> = {
      pos: ['pos.dine_in', 'pos.quick_counter', 'pos.takeaway', 'pos.delivery'],
      tables: ['operations.tables'],
      kitchen: ['operations.kitchen_kds', 'operations.kot_printing'],
      qr: ['qr.table_ordering', 'qr.digital_menu', 'qr.table_pay'],
      billing: ['billing.thermal_receipts', 'billing.split_payment', 'billing.discounts', 'billing.tax_gst'],
      payments: ['payments.upi_qr'],
      inventory: ['inventory.raw_materials', 'inventory.recipes_bom'],
      customers: ['crm.customers', 'crm.loyalty'],
      staff: ['staff.shared_access', 'staff.device_mgmt'],
      expenses: ['finance.expenses'],
      printers: ['hardware.thermal_printers', 'operations.kot_printing'],
      reports: ['reports.sales_analytics', 'reports.staff_activity'],
      menu: ['catalog.modifiers_variants', 'ai_menu_import', 'ai.menu_import'],
      orders: [],
    };

    // Case 1: Batch sync of all enabled modules
    if (Array.isArray(modules)) {
      const normalizedModules = new Set(modules.map((m) => String(m).toLowerCase().trim()));

      // Disable all modules for this tenant
      await prisma.tenantModule.updateMany({
        where: { tenantId: targetTenantId },
        data: { isEnabled: false },
      });

      // Enable the selected modules
      for (const mod of normalizedModules) {
        await prisma.tenantModule.upsert({
          where: {
            tenantId_moduleToken: {
              tenantId: targetTenantId,
              moduleToken: mod,
            },
          },
          update: { isEnabled: true },
          create: {
            tenantId: targetTenantId,
            moduleToken: mod,
            isEnabled: true,
          },
        });
      }

      return NextResponse.json({ success: true, count: normalizedModules.size });
    }

    // Case 2: Single module toggle
    if (!moduleToken) {
      return NextResponse.json(
        { error: 'moduleToken or modules array is required.' },
        { status: 400 }
      );
    }

    const normalizedToken = String(moduleToken).toLowerCase().trim();
    const enabled = Boolean(isEnabled);

    // Tokens to update: the token itself + its uppercase version + related sub-tokens
    const tokensToUpdate = new Set<string>([normalizedToken]);
    const relatedSubs = SUB_TOKENS_MAP[normalizedToken] || [];
    for (const sub of relatedSubs) {
      tokensToUpdate.add(sub);
    }

    for (const token of tokensToUpdate) {
      await prisma.tenantModule.upsert({
        where: {
          tenantId_moduleToken: {
            tenantId: targetTenantId,
            moduleToken: token,
          },
        },
        update: { isEnabled: enabled },
        create: {
          tenantId: targetTenantId,
          moduleToken: token,
          isEnabled: enabled,
        },
      });

      // Also ensure uppercase record in DB is updated
      await prisma.tenantModule.updateMany({
        where: {
          tenantId: targetTenantId,
          moduleToken: token.toUpperCase(),
        },
        data: { isEnabled: enabled },
      });
    }

    return NextResponse.json({
      success: true,
      moduleToken: normalizedToken,
      isEnabled: enabled,
    });
  } catch (error: any) {
    console.error('Tenant module toggle error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
