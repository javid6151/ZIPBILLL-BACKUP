import { prisma } from '@platform/database';

export async function seedTenantStarterData(
  tenantId: string,
  businessType: string = 'RESTAURANT',
  customTableCount?: number
) {
  try {
    const targetCount = customTableCount && customTableCount > 0 ? customTableCount : 8;
    // 1. Dining Tables
    const existingTableCount = await prisma.table.count({ where: { tenantId } });

    if (existingTableCount === 0 || (customTableCount && customTableCount !== existingTableCount)) {
      if (existingTableCount > 0 && customTableCount) {
        // Safely clear previous empty tables when re-configuring
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

      for (let i = 1; i <= targetCount; i++) {
        const sec = sections[(i - 1) % sections.length];
        const capacity = i === targetCount && targetCount >= 6 ? 8 : i % 3 === 0 ? 6 : i % 2 === 0 ? 4 : 2;
        const status = i === 2 ? 'OCCUPIED' : i === 6 && targetCount > 6 ? 'RESERVED' : 'AVAILABLE';
        const tableName = i === targetCount && targetCount >= 8 ? `VIP Suite ${i}` : `Table ${i}`;

        await prisma.table.create({
          data: {
            tenantId,
            sectionId: sec.id,
            tableNumber: `${i}`,
            tableName,
            capacity,
            status: status as any,
            sortOrder: i,
          },
        });
      }
    }

    // 2. Menu Categories & Items
    const existingCategoryCount = await prisma.category.count({ where: { tenantId } });
    if (existingCategoryCount === 0) {
      const starterCategories = [
        {
          name: 'Starters & Appetizers',
          sortOrder: 1,
          items: [
            { name: 'Paneer Tikka (6 pcs)', basePrice: 28000, foodType: 'VEG' as const, description: 'Charcoal grilled cottage cheese marinated in spiced yogurt' },
            { name: 'Crispy Corn Pepper Fry', basePrice: 22000, foodType: 'VEG' as const, description: 'Sweet corn tossed with bell peppers and crushed black pepper' },
            { name: 'Chicken Tikka Kebab (6 pcs)', basePrice: 34000, foodType: 'NON_VEG' as const, description: 'Tender chicken marinated in royal tandoori spices' },
            { name: 'Peri Peri Chicken Wings', basePrice: 32000, foodType: 'NON_VEG' as const, description: 'Crispy wings glazed with zesty peri-peri sauce' },
            { name: 'Veg Spring Rolls', basePrice: 21000, foodType: 'VEG' as const, description: 'Crunchy golden rolls stuffed with seasoned wok veggies' },
            { name: 'Garlic Butter Prawns', basePrice: 42000, foodType: 'NON_VEG' as const, description: 'Pan-seared prawns in rich garlic herb butter' },
          ],
        },
        {
          name: 'Main Course & Curries',
          sortOrder: 2,
          items: [
            { name: 'Butter Chicken', basePrice: 38000, foodType: 'NON_VEG' as const, description: 'Smoked chicken morsels in silky tomato cashew gravy' },
            { name: 'Paneer Butter Masala', basePrice: 32000, foodType: 'VEG' as const, description: 'Fresh cottage cheese cubes in aromatic makhani gravy' },
            { name: 'Dal Makhani (Slow Cooked)', basePrice: 26000, foodType: 'VEG' as const, description: 'Black lentils slow cooked overnight with butter and cream' },
            { name: 'Hyderabadi Chicken Dum Biryani', basePrice: 36000, foodType: 'NON_VEG' as const, description: 'Fragrant basmati rice layered with spiced chicken and saffron' },
            { name: 'Nizami Veg Dum Biryani', basePrice: 29000, foodType: 'VEG' as const, description: 'Basmati rice infused with garden fresh vegetables and whole spices' },
            { name: 'Mutton Rogan Josh', basePrice: 46000, foodType: 'NON_VEG' as const, description: 'Kashmiri style tender mutton braised in aromatic red gravy' },
            { name: 'Butter Garlic Naan', basePrice: 6500, foodType: 'VEG' as const, description: 'Clay oven baked bread brushed with roasted garlic butter' },
            { name: 'Tandoori Roti with Butter', basePrice: 3500, foodType: 'VEG' as const, description: 'Whole wheat tandoori flatbread' },
            { name: 'Jeera Basmati Rice', basePrice: 18000, foodType: 'VEG' as const, description: 'Aromatic basmati rice tempered with cumin seeds and ghee' },
          ],
        },
        {
          name: 'Beverages & Coolers',
          sortOrder: 3,
          items: [
            { name: 'Masala Chai', basePrice: 5000, foodType: 'BEVERAGE' as const, description: 'Strong Assam tea brewed with ginger and cardamom' },
            { name: 'Filter Coffee', basePrice: 7000, foodType: 'BEVERAGE' as const, description: 'Traditional South Indian chicory filter brew' },
            { name: 'Fresh Mint Lime Soda', basePrice: 11000, foodType: 'BEVERAGE' as const, description: 'Refreshing sparkling limeade with bruised fresh mint' },
            { name: 'Sweet Mango Lassi', basePrice: 14000, foodType: 'BEVERAGE' as const, description: 'Creamy yogurt cooler with Alphonso mango puree' },
            { name: 'Cold Coffee with Ice Cream', basePrice: 16000, foodType: 'BEVERAGE' as const, description: 'Blended espresso shake topped with vanilla bean ice cream' },
            { name: 'Virgin Mojito Cooler', basePrice: 15000, foodType: 'BEVERAGE' as const, description: 'Muddled mint, lime wedges, simple syrup and crushed ice' },
          ],
        },
        {
          name: 'Desserts & Sweets',
          sortOrder: 4,
          items: [
            { name: 'Gulab Jamun with Rabdi', basePrice: 16000, foodType: 'VEG' as const, description: 'Warm milk dumplings soaked in cardamom syrup with condensed milk' },
            { name: 'Sizzling Brownie with Vanilla', basePrice: 24000, foodType: 'VEG' as const, description: 'Fudgy hot brownie served on a cast iron sizzler with hot chocolate fudge' },
            { name: 'Kesar Pista Kulfi', basePrice: 14000, foodType: 'VEG' as const, description: 'Traditional dense Indian ice cream with saffron and roasted pistachios' },
            { name: 'Rasmalai (2 pcs)', basePrice: 15000, foodType: 'VEG' as const, description: 'Soft paneer discs steeped in cardamom flavored clotted milk' },
          ],
        },
      ];

      for (const cat of starterCategories) {
        const createdCat = await prisma.category.create({
          data: {
            tenantId,
            name: cat.name,
            sortOrder: cat.sortOrder,
            isActive: true,
          },
        });

        for (let i = 0; i < cat.items.length; i++) {
          const item = cat.items[i];
          await prisma.menuItem.create({
            data: {
              tenantId,
              categoryId: createdCat.id,
              name: item.name,
              description: item.description,
              basePrice: item.basePrice,
              taxRatePercent: 5,
              foodType: item.foodType,
              isAvailable: true,
              sortOrder: i + 1,
            },
          });
        }
      }
    }

    // 3. Stock & Raw Materials Inventory
    const existingInventoryCount = await prisma.inventoryItem.count({ where: { tenantId } });
    if (existingInventoryCount === 0) {
      const defaultInventory = [
        { name: 'Basmati Rice (Aged)', unit: 'kg', currentStock: 50, minAlertStock: 10, costPerUnit: 9000 },
        { name: 'Fresh Paneer', unit: 'kg', currentStock: 15, minAlertStock: 4, costPerUnit: 26000 },
        { name: 'Chicken Breast / Curry Cut', unit: 'kg', currentStock: 25, minAlertStock: 6, costPerUnit: 22000 },
        { name: 'Whole Dairy Milk', unit: 'L', currentStock: 30, minAlertStock: 8, costPerUnit: 6500 },
        { name: 'Pure Refined Cooking Oil', unit: 'L', currentStock: 40, minAlertStock: 10, costPerUnit: 14000 },
        { name: 'Fresh Cooking Cream', unit: 'L', currentStock: 12, minAlertStock: 3, costPerUnit: 19000 },
        { name: 'Chef Special Garam Masala', unit: 'kg', currentStock: 8, minAlertStock: 2, costPerUnit: 55000 },
      ];

      for (const inv of defaultInventory) {
        await prisma.inventoryItem.create({
          data: {
            tenantId,
            name: inv.name,
            unit: inv.unit,
            currentStock: inv.currentStock,
            minAlertStock: inv.minAlertStock,
            costPerUnit: inv.costPerUnit,
          },
        });
      }
    }

  } catch (err: any) {
    console.error('Error auto-seeding starter data for tenant', tenantId, err.message);
  }
}
