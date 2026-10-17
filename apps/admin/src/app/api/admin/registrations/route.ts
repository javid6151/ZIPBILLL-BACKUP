import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@platform/database';

export async function GET() {
  try {
    const requests = await prisma.registrationRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: {
          include: {
            businessProfile: true,
            settings: true,
            tableSections: {
              orderBy: { sortOrder: 'asc' },
            },
            tables: {
              select: { id: true, tableNumber: true, tableName: true, status: true },
            },
            users: {
              select: { id: true, fullName: true, email: true, phone: true, roleType: true, isActive: true },
            },
            modules: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      requests: requests.map((r) => {
        const settingsMap = new Map((r.tenant?.settings || []).map((s: any) => [s.key, s.valueJson]));
        const staffConfig = (settingsMap.get('staff_config') as any[]) || [];
        const billingConfig = (settingsMap.get('billing_config') as any) || null;
        const printerConfig = (settingsMap.get('printer_config') as any) || null;
        const servicesConfig = (settingsMap.get('services_config') as any[]) || [];
        const tableSections = (r.tenant?.tableSections || []).map((s: any) => s.name);
        const usersList = (r.tenant?.users || []).filter((u: any) => u.roleType !== 'SUPER_ADMIN');
        const staffEmployees = usersList.filter((u: any) => u.roleType !== 'OWNER');

        return {
          id: r.id,
          tenantId: r.tenantId,
          restaurantName: r.tenant?.name || r.tenant?.businessProfile?.businessName || 'Unknown Restaurant',
          ownerName: r.applicantName || 'Applicant',
          applicantName: r.applicantName,
          email: r.applicantEmail || '',
          applicantEmail: r.applicantEmail,
          phone: r.applicantPhone || '',
          applicantPhone: r.applicantPhone,
          businessType: r.businessType || 'RESTAURANT',
          intendedModules: r.intendedModules || null,
          requestedModules: r.intendedModules || null,
          status: r.status || 'PENDING',
          rejectionReason: r.rejectionReason,
          requestedPlan: 'PRO',
          tableCountEst: r.tableCountEst || null,
          city: r.tenant?.businessProfile?.city || 'Bengaluru',
          state: r.tenant?.businessProfile?.state || 'Karnataka',
          address: r.tenant?.businessProfile?.address || '',
          country: r.tenant?.businessProfile?.country || 'IN',
          postalCode: r.tenant?.businessProfile?.postalCode || '',
          currency: r.tenant?.businessProfile?.currencyCode || 'INR',
          timezone: r.tenant?.businessProfile?.timezone || 'Asia/Kolkata',
          services: servicesConfig.length > 0 ? servicesConfig : ['Dine In', 'Takeaway', 'Delivery', 'Online Ordering', 'Counter Ordering'],
          hasTables: (r.tableCountEst != null && r.tableCountEst > 0) || (r.tenant?.tables?.length ?? 0) > 0,
          tableCount: r.tableCountEst || r.tenant?.tables?.length || 0,
          tableSections: tableSections.length > 0 ? tableSections : ['Main Dining', 'AC Hall', 'Outdoor Terrace'],
          hasEmployees: staffConfig.length > 0 || staffEmployees.length > 0,
          staffList: staffConfig.length > 0
            ? staffConfig
            : staffEmployees.map((u: any) => ({
                name: u.fullName,
                role: u.roleType,
                phone: u.phone,
                email: u.email,
              })),
          billingConfig: billingConfig || {
            taxRate: 5,
            serviceCharge: 0,
            roundOff: true,
            invoicePrefix: 'INV-2026-',
            paymentMethods: ['Cash', 'UPI', 'Credit/Debit Card', 'Food Vouchers'],
          },
          printerConfig: printerConfig || {
            printerType: 'THERMAL_80MM',
            kotPrinter: true,
            networkIp: '192.168.1.100',
          },
          createdAt: r.createdAt.toISOString(),
        };
      }),
    });
  } catch (error: any) {
    console.error('Fetch registration requests error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registration requests.', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { requestId, action, rejectionReason } = await req.json();

    if (!requestId || !action) {
      return NextResponse.json({ error: 'Request ID and action are required.' }, { status: 400 });
    }

    const reg = await prisma.registrationRequest.findUnique({
      where: { id: requestId },
      include: { tenant: true },
    });

    if (!reg) {
      return NextResponse.json({ error: 'Registration request not found.' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      const adminUser = await prisma.user.findFirst({
        where: { roleType: 'SUPER_ADMIN' },
      });
      const validUserId = adminUser?.id || (await prisma.user.findFirst({ where: { tenantId: reg.tenantId } }))?.id;

      await prisma.$transaction(async (tx) => {
        // Update request status
        await tx.registrationRequest.update({
          where: { id: requestId },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
            reviewedBy: 'Super Admin',
          },
        });

        // Update tenant status
        await tx.tenant.update({
          where: { id: reg.tenantId },
          data: { status: 'APPROVED' },
        });

        // Ensure business profile marks onboardingCompleted = true
        await tx.businessProfile.updateMany({
          where: { tenantId: reg.tenantId },
          data: { onboardingCompleted: true },
        });

        // Ensure requested modules are enabled
        if (Array.isArray(reg.intendedModules) && reg.intendedModules.length > 0) {
          for (const mod of reg.intendedModules as string[]) {
            const moduleToken = String(mod).toLowerCase();
            await tx.tenantModule.upsert({
              where: {
                tenantId_moduleToken: {
                  tenantId: reg.tenantId,
                  moduleToken,
                },
              },
              update: { isEnabled: true },
              create: {
                tenantId: reg.tenantId,
                moduleToken,
                isEnabled: true,
              },
            });
          }
        }

        // Provision seating tables if not already generated
        const existingTablesCount = await tx.table.count({
          where: { tenantId: reg.tenantId },
        });

        if (existingTablesCount === 0 && reg.tableCountEst && reg.tableCountEst > 0) {
          const defaultSection = await tx.tableSection.create({
            data: {
              tenantId: reg.tenantId,
              name: 'Main Dining',
              sortOrder: 1,
            },
          });

          const tablesData = [];
          for (let i = 1; i <= reg.tableCountEst; i++) {
            tablesData.push({
              tenantId: reg.tenantId,
              sectionId: defaultSection.id,
              tableNumber: `T${i}`,
              tableName: `Table ${i}`,
              capacity: i % 3 === 0 ? 6 : i % 2 === 0 ? 4 : 2,
              status: 'AVAILABLE' as const,
              sortOrder: i,
            });
          }
          await tx.table.createMany({ data: tablesData });
        }

        // Seed default starter subscription if none
        const starterPlan = await tx.subscriptionPlan.findFirst({
          where: { name: 'STARTER' },
        });

        if (starterPlan) {
          const existingSub = await tx.subscription.findFirst({
            where: { tenantId: reg.tenantId },
          });

          if (!existingSub) {
            await tx.subscription.create({
              data: {
                tenantId: reg.tenantId,
                planId: starterPlan.id,
                billingCycle: 'MONTHLY',
                status: 'ACTIVE',
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            });
          }
        }

        // Record audit log
        if (validUserId) {
          await tx.auditLog.create({
            data: {
              tenantId: reg.tenantId,
              userId: validUserId,
              userName: 'Platform Super Admin',
              action: 'APPROVE_RESTAURANT',
              entityType: 'TENANT',
              entityId: reg.tenantId,
              metadataJson: {
                requestId,
                restaurantName: reg.tenant.name,
                approvedBy: 'Super Admin',
              },
            },
          });
        }
      });

      return NextResponse.json({
        success: true,
        message: `Restaurant "${reg.tenant.name}" has been approved. The owner can now complete onboarding.`,
      });
    } else if (action === 'REJECT') {
      await prisma.$transaction(async (tx) => {
        await tx.registrationRequest.update({
          where: { id: requestId },
          data: {
            status: 'REJECTED',
            rejectionReason: rejectionReason || 'Application criteria not met.',
            reviewedAt: new Date(),
            reviewedBy: 'Super Admin',
          },
        });

        await tx.tenant.update({
          where: { id: reg.tenantId },
          data: { status: 'REJECTED' },
        });

        const adminUser = await prisma.user.findFirst({
          where: { roleType: 'SUPER_ADMIN' },
        });
        const validUserId = adminUser?.id || (await prisma.user.findFirst({ where: { tenantId: reg.tenantId } }))?.id;

        if (validUserId) {
          await tx.auditLog.create({
            data: {
              tenantId: reg.tenantId,
              userId: validUserId,
              userName: 'Platform Super Admin',
              action: 'REJECT_RESTAURANT',
              entityType: 'TENANT',
              entityId: reg.tenantId,
              metadataJson: {
                requestId,
                reason: rejectionReason,
              },
            },
          });
        }
      });

      return NextResponse.json({
        success: true,
        message: `Registration request for "${reg.tenant.name}" has been rejected.`,
      });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error: any) {
    console.error('Registration action error:', error);
    return NextResponse.json(
      { error: 'Failed to update registration status.', details: error.message },
      { status: 500 }
    );
  }
}
