import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@platform/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const email = searchParams.get('email');

    if (!tenantId && !email) {
      return NextResponse.json(
        { error: 'tenantId or email is required.' },
        { status: 400 }
      );
    }

    let tenant = null;
    let registration = null;

    if (tenantId) {
      tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { businessProfile: true },
      });
      registration = await prisma.registrationRequest.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });
    } else if (email) {
      registration = await prisma.registrationRequest.findFirst({
        where: { applicantEmail: email },
        orderBy: { createdAt: 'desc' },
        include: { tenant: { include: { businessProfile: true } } },
      });
      if (registration?.tenant) {
        tenant = registration.tenant;
      }
    }

    if (!tenant && !registration) {
      return NextResponse.json(
        { error: 'No matching tenant or registration found.' },
        { status: 404 }
      );
    }

    const isApproved = tenant?.status === 'APPROVED' || registration?.status === 'APPROVED';
    const currentStatus = isApproved ? 'APPROVED' : (registration?.status || tenant?.status || 'PENDING');

    return NextResponse.json({
      success: true,
      status: currentStatus,
      tenantId: tenant?.id || registration?.tenantId,
      restaurantName: tenant?.name || tenant?.businessProfile?.businessName || 'Your Restaurant',
      slug: tenant?.slug || '',
      email: registration?.applicantEmail || tenant?.businessProfile?.email,
      businessType: tenant?.businessType || registration?.businessType || 'RESTAURANT',
      applicantPhone: registration?.applicantPhone || tenant?.businessProfile?.phone || '',
      applicantEmail: registration?.applicantEmail || tenant?.businessProfile?.email || '',
      applicantName: registration?.applicantName || '',
      rejectionReason: registration?.rejectionReason || null,
      onboardingCompleted: isApproved ? true : (tenant?.businessProfile?.onboardingCompleted || false),
      city: tenant?.businessProfile?.city || '',
      state: tenant?.businessProfile?.state || 'Karnataka',
      address: tenant?.businessProfile?.address || '',
      tableCountEst: registration?.tableCountEst ?? null,
      intendedModules: registration?.intendedModules || [],
      submittedAt: registration?.createdAt || tenant?.createdAt,
      reviewedAt: registration?.reviewedAt || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
