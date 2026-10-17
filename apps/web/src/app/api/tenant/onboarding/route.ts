import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@platform/database';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tenantId,
      businessType = 'RESTAURANT',
      businessName,
      phone,
      email,
      address,
      city,
      state,
      country = 'IN',
      currency = 'INR',
      timezone = 'Asia/Kolkata',
      logoUrl,
      services = [],
      modules = [],
      hasTables = false,
      tableCount = 0,
      tableSections = [],
      hasEmployees = false,
      employees = [],
      billingConfig = {
        taxRate: 5,
        serviceCharge: 0,
        roundOff: true,
        invoicePrefix: 'INV-',
      },
      printerConfig = {
        type: 'THERMAL',
        kotPrinter: false,
      },
      initialMenu = [],
    } = body;

    // Resolve tenant
    let targetTenantId = tenantId;
    if (!targetTenantId && email) {
      const reg = await prisma.registrationRequest.findFirst({
        where: { applicantEmail: email },
        orderBy: { createdAt: 'desc' },
      });
      if (reg) targetTenantId = reg.tenantId;
      else {
        const u = await prisma.user.findFirst({
          where: { email },
        });
        if (u?.tenantId) targetTenantId = u.tenantId;
      }
    }

    if (!targetTenantId) {
      return NextResponse.json({ error: 'tenantId or valid registered email is required to complete onboarding.' }, { status: 400 });
    }

    const tenantRecord = await prisma.tenant.findUnique({
      where: { id: targetTenantId },
    });

    if (!tenantRecord) {
      return NextResponse.json({ error: 'Tenant record not found in database.' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Tenant name, businessType, and set status to PENDING for admin review
      await tx.tenant.update({
        where: { id: targetTenantId },
        data: {
          name: businessName || tenantRecord.name,
          businessType: businessType as any,
          status: 'PENDING', // Awaiting Super Admin review and approval
        },
      });

      // 1b. Create or Update Registration Request for Admin Approval
      const existingReq = await tx.registrationRequest.findFirst({
        where: { tenantId: targetTenantId },
        orderBy: { createdAt: 'desc' },
      });

      if (existingReq) {
        await tx.registrationRequest.update({
          where: { id: existingReq.id },
          data: {
            applicantName: businessName || tenantRecord.name,
            applicantEmail: email || '',
            applicantPhone: phone || '',
            businessType: businessType as any,
            tableCountEst: hasTables ? Number(tableCount) : 0,
            intendedModules: modules,
            status: 'PENDING',
          },
        });
      } else {
        await tx.registrationRequest.create({
          data: {
            tenantId: targetTenantId,
            applicantName: businessName || tenantRecord.name,
            applicantEmail: email || '',
            applicantPhone: phone || '',
            businessType: businessType as any,
            tableCountEst: hasTables ? Number(tableCount) : 0,
            intendedModules: modules,
            status: 'PENDING',
          },
        });
      }

      // 2. Upsert BusinessProfile
      const profile = await tx.businessProfile.upsert({
        where: { tenantId: targetTenantId },
        update: {
          businessName: businessName || 'My Restaurant',
          phone: phone || '',
          email: email || '',
          address: address || '',
          city: city || 'Bengaluru',
          state: state || 'Karnataka',
          country: country || 'IN',
          currencyCode: currency || 'INR',
          currencySymbol: currency === 'USD' ? '$' : '₹',
          timezone: timezone || 'Asia/Kolkata',
          logoUrl: logoUrl || null,
          onboardingCompleted: true,
        },
        create: {
          tenantId: targetTenantId,
          businessName: businessName || 'My Restaurant',
          phone: phone || '',
          email: email || '',
          address: address || '',
          city: city || 'Bengaluru',
          state: state || 'Karnataka',
          country: country || 'IN',
          currencyCode: currency || 'INR',
          currencySymbol: currency === 'USD' ? '$' : '₹',
          timezone: timezone || 'Asia/Kolkata',
          logoUrl: logoUrl || null,
          onboardingCompleted: true,
        },
      });

      // 3. Sync Modules strictly according to wizard selection.  Prisma
      // interactive transactions use one connection, so run these writes in
      // order instead of concurrent Promise.all calls.
      if (Array.isArray(modules) && modules.length > 0) {
        // Disable modules that the user did not choose
        await tx.tenantModule.updateMany({
          where: {
            tenantId: targetTenantId,
          },
          data: { isEnabled: false },
        });

        // De-duplicate selections so a repeated client value cannot violate
        // the tenant/module unique constraint.
        const selectedModules = [...new Set(modules.map((mod) => String(mod).toLowerCase()))];
        for (const moduleToken of selectedModules) {
          await tx.tenantModule.upsert({
            where: {
              tenantId_moduleToken: {
                tenantId: targetTenantId,
                moduleToken,
              },
            },
            update: { isEnabled: true },
            create: {
              tenantId: targetTenantId,
              moduleToken,
              isEnabled: true,
            },
          });
        }
      }

      // 4. Configure Tables if enabled
      if (hasTables && tableCount > 0) {
        // Clean existing tables to avoid duplicate keys if re-onboarding
        await tx.table.deleteMany({ where: { tenantId: targetTenantId } });
        await tx.tableSection.deleteMany({ where: { tenantId: targetTenantId } });

        const sectionsToUse = (Array.isArray(tableSections) && tableSections.length > 0)
          ? tableSections
          : ['Main Dining', 'AC Hall', 'Outdoor Terrace'];

        // Create table sections
        const createdSections: any[] = [];
        for (let i = 0; i < sectionsToUse.length; i++) {
          const sName = sectionsToUse[i];
          const section = await tx.tableSection.create({
            data: {
              tenantId: targetTenantId,
              name: sName,
              sortOrder: i,
            },
          });
          createdSections.push(section);
        }

        // Create tables distributed across sections via batch createMany
        const tablesPerSection = Math.ceil(tableCount / (createdSections.length || 1));
        let tableIndex = 1;
        const tablesData: any[] = [];
        for (const sec of createdSections) {
          for (let j = 0; j < tablesPerSection && tableIndex <= tableCount; j++) {
            tablesData.push({
              tenantId: targetTenantId,
              sectionId: sec.id,
              tableNumber: `T${tableIndex}`,
              tableName: `Table ${tableIndex}`,
              capacity: tableIndex % 3 === 0 ? 6 : tableIndex % 2 === 0 ? 4 : 2,
              status: 'AVAILABLE' as const,
              sortOrder: tableIndex,
            });
            tableIndex++;
          }
        }
        if (tablesData.length > 0) {
          await tx.table.createMany({ data: tablesData });
        }
      }

      // 5. Store Staff Configuration & Create Employee Accounts
      if (hasEmployees && Array.isArray(employees) && employees.length > 0) {
        // Clear any prior non-owner staff accounts for this tenant so only real user-added staff exist
        await tx.user.deleteMany({
          where: {
            tenantId: targetTenantId,
            roleType: { not: 'OWNER' },
          },
        });

        for (const emp of employees) {
          if (!emp.name) continue;
          const empRole = (emp.role === 'KITCHEN' ? 'KITCHEN' : emp.role === 'OWNER' ? 'OWNER' : 'WAITER') as any;
          const slugName = emp.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const empEmail = emp.email || `${slugName || 'staff'}.${Math.floor(100 + Math.random() * 900)}@${tenantRecord.slug || 'zipbill'}.internal`;

          await tx.user.create({
            data: {
              tenantId: targetTenantId,
              email: empEmail,
              fullName: emp.name,
              phone: emp.phone || '+91 98000 00000',
              roleType: empRole,
              isActive: true,
            },
          });
        }

        await tx.restaurantSetting.upsert({
          where: {
            tenantId_key: {
              tenantId: targetTenantId,
              key: 'staff_config',
            },
          },
          update: { valueJson: employees },
          create: {
            tenantId: targetTenantId,
            key: 'staff_config',
            valueJson: employees,
          },
        });
      } else {
        // Solo Owner: Clean up any non-owner accounts so no fake Waiter or Kitchen users exist
        await tx.user.deleteMany({
          where: {
            tenantId: targetTenantId,
            roleType: { not: 'OWNER' },
          },
        });

        await tx.restaurantSetting.upsert({
          where: {
            tenantId_key: {
              tenantId: targetTenantId,
              key: 'staff_config',
            },
          },
          update: { valueJson: [] },
          create: {
            tenantId: targetTenantId,
            key: 'staff_config',
            valueJson: [],
          },
        });
      }

      // 6. Store Billing, Printer, & Services Settings.  Keep this sequential
      // for the same interactive-transaction connection guarantee.
      await tx.restaurantSetting.upsert({
          where: {
            tenantId_key: {
              tenantId: targetTenantId,
              key: 'billing_config',
            },
          },
          update: { valueJson: billingConfig },
          create: {
            tenantId: targetTenantId,
            key: 'billing_config',
            valueJson: billingConfig,
          },
      });
      await tx.restaurantSetting.upsert({
          where: {
            tenantId_key: {
              tenantId: targetTenantId,
              key: 'printer_config',
            },
          },
          update: { valueJson: printerConfig },
          create: {
            tenantId: targetTenantId,
            key: 'printer_config',
            valueJson: printerConfig,
          },
      });
      await tx.restaurantSetting.upsert({
          where: {
            tenantId_key: {
              tenantId: targetTenantId,
              key: 'services_config',
            },
          },
          update: { valueJson: services },
          create: {
            tenantId: targetTenantId,
            key: 'services_config',
            valueJson: services,
          },
      });

      // 7. Seed initial menu items if passed from AI import
      if (Array.isArray(initialMenu) && initialMenu.length > 0) {
        for (const catData of initialMenu) {
          const categoryName = catData.category || catData.name || 'General';
          let category = await tx.category.findFirst({
            where: { tenantId: targetTenantId, name: categoryName },
          });

          if (!category) {
            category = await tx.category.create({
              data: {
                tenantId: targetTenantId,
                name: categoryName,
              },
            });
          }

          if (Array.isArray(catData.items)) {
            for (const it of catData.items) {
              const itemPrice = Math.round(Number(it.price || 100) * 100);
              const foodType = it.foodType || (it.isVeg ? 'VEG' : 'NON_VEG');

              const existingItem = await tx.menuItem.findFirst({
                where: { tenantId: targetTenantId, categoryId: category.id, name: it.name },
              });

              if (!existingItem) {
                await tx.menuItem.create({
                  data: {
                    tenantId: targetTenantId,
                    categoryId: category.id,
                    name: it.name,
                    description: it.description || '',
                    basePrice: itemPrice,
                    foodType: foodType as any,
                    isAvailable: true,
                  },
                });
              }
            }
          }
        }
      }

      // 8. Audit Log
      const ownerUser = await tx.user.findFirst({
        where: { tenantId: targetTenantId },
      });

      if (ownerUser) {
        await tx.auditLog.create({
          data: {
            tenantId: targetTenantId,
            userId: ownerUser.id,
            userName: ownerUser.fullName,
            action: 'COMPLETE_ONBOARDING',
            entityType: 'TENANT',
            entityId: targetTenantId,
            metadataJson: {
              businessName,
              businessType,
              hasTables,
              tableCount,
              logoUrl,
            },
          },
        });
      }

      return { profile };
    }, {
      maxWait: 20000,
      timeout: 60000,
    });

    return NextResponse.json({
      success: true,
      status: 'PENDING',
      message: 'Onboarding configuration successfully saved and submitted for verification.',
      redirect: `/pending-approval?tenantId=${targetTenantId}&email=${encodeURIComponent(email || '')}`,
      profile: result.profile,
      tenantId: targetTenantId,
      slug: tenantRecord.slug,
      restaurantName: businessName || tenantRecord.name,
    });
  } catch (error: any) {
    console.error('Onboarding API error:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding.', details: error.message },
      { status: 500 }
    );
  }
}
