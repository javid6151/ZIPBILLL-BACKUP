import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@platform/database';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        businessProfile: true,
        subscriptions: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      tenants: tenants.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        businessType: t.businessType,
        status: t.status,
        plan: t.subscriptions[0]?.planId || 'Free Tier',
        phone: t.businessProfile?.phone || '',
        email: t.businessProfile?.email || '',
        city: t.businessProfile?.city || '',
        state: t.businessProfile?.state || '',
        createdAt: t.createdAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, name, businessType } = body;

    if (!id) {
      return NextResponse.json({ error: 'Tenant ID is required.' }, { status: 400 });
    }

    const [updated] = await Promise.all([
      prisma.tenant.update({
        where: { id },
        data: {
          ...(status ? { status } : {}),
          ...(name ? { name } : {}),
          ...(businessType ? { businessType } : {}),
        },
        include: {
          businessProfile: true,
        },
      }),
      status === 'APPROVED'
        ? prisma.businessProfile.updateMany({
            where: { tenantId: id },
            data: { onboardingCompleted: true },
          })
        : Promise.resolve(null),
      status
        ? prisma.registrationRequest.updateMany({
            where: { tenantId: id },
            data: {
              status: status === 'APPROVED' ? 'APPROVED' : status === 'SUSPENDED' ? 'REJECTED' : status,
              reviewedAt: new Date(),
              reviewedBy: 'Super Admin',
            },
          })
        : Promise.resolve(null),
    ]);

    return NextResponse.json({
      success: true,
      tenant: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
