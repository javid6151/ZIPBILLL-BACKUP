import { prisma } from '@platform/database';

/**
 * seedTenantStarterData:
 * Configures initial store structure for a tenant restaurant.
 * Per specification:
 * - New accounts start with ZERO (0) menu items, ZERO categories, and ZERO inventory.
 * - Only user-defined dining tables are generated if customTableCount is explicitly requested.
 * - All user data created by the restaurant owner will be stored directly in PostgreSQL.
 */
export async function seedTenantStarterData(
  tenantId: string,
  businessType: string = 'RESTAURANT',
  customTableCount?: number
) {
  try {
    // Only configure dining tables if explicitly requested by user (customTableCount > 0)
    if (customTableCount && customTableCount > 0) {
      const existingTableCount = await prisma.table.count({ where: { tenantId } });

      if (existingTableCount === 0 || customTableCount !== existingTableCount) {
        if (existingTableCount > 0) {
          try {
            await prisma.table.deleteMany({ where: { tenantId } });
          } catch {}
        }

        // Ensure dining floor sections
        let mainSec = await prisma.tableSection.findFirst({ where: { tenantId, name: 'Main Dining' } });
        if (!mainSec) {
          mainSec = await prisma.tableSection.create({ data: { tenantId, name: 'Main Dining', sortOrder: 1 } });
        }

        let acSec = await prisma.tableSection.findFirst({ where: { tenantId, name: 'AC Hall' } });
        if (!acSec) {
          acSec = await prisma.tableSection.create({ data: { tenantId, name: 'AC Hall', sortOrder: 2 } });
        }

        let terraceSec = await prisma.tableSection.findFirst({ where: { tenantId, name: 'Terrace Garden' } });
        if (!terraceSec) {
          terraceSec = await prisma.tableSection.create({ data: { tenantId, name: 'Terrace Garden', sortOrder: 3 } });
        }

        const sections = [mainSec, acSec, terraceSec];

        for (let i = 1; i <= customTableCount; i++) {
          const sec = sections[(i - 1) % sections.length];
          const capacity = i === customTableCount && customTableCount >= 6 ? 8 : i % 3 === 0 ? 6 : i % 2 === 0 ? 4 : 2;
          const tableName = i === customTableCount && customTableCount >= 8 ? `VIP Suite ${i}` : `Table ${i}`;

          await prisma.table.create({
            data: {
              tenantId,
              sectionId: sec.id,
              tableNumber: `${i}`,
              tableName,
              capacity,
              status: 'AVAILABLE',
              sortOrder: i,
            },
          });
        }
      }
    }
    // Note: No default/dummy menu items or inventory are injected.
    // The restaurant starts completely clean (0 items).
  } catch (err: any) {
    console.error('seedTenantStarterData warning for tenant', tenantId, err.message);
  }
}
