import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@platform/database';
import { DevicePlatform } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    const devices = await prisma.device.findMany({
      where: { tenantId, isRevoked: false },
      orderBy: { lastActiveAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ success: true, devices });
  } catch (error: any) {
    console.error('Error fetching devices:', error);
    return NextResponse.json({ error: 'Failed to fetch devices', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, userId, deviceName, platform, appVersion } = body;

    if (!tenantId || !deviceName) {
      return NextResponse.json({ error: 'tenantId and deviceName are required' }, { status: 400 });
    }

    // Map platform string to valid DevicePlatform enum
    let validPlatform: DevicePlatform = DevicePlatform.WEB;
    if (platform && Object.values(DevicePlatform).includes(platform)) {
      validPlatform = platform as DevicePlatform;
    }

    // Upsert or register device
    const existing = await prisma.device.findFirst({
      where: {
        tenantId,
        deviceName,
        isRevoked: false,
      },
    });

    let device;
    if (existing) {
      device = await prisma.device.update({
        where: { id: existing.id },
        data: {
          lastActiveAt: new Date(),
          lastSyncAt: new Date(),
          platform: validPlatform,
          appVersion: appVersion || '2.0.0',
        },
      });
    } else {
      device = await prisma.device.create({
        data: {
          tenantId,
          userId: userId || null,
          deviceName,
          platform: validPlatform,
          appVersion: appVersion || '2.0.0',
          lastActiveAt: new Date(),
          lastSyncAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, device });
  } catch (error: any) {
    console.error('Error registering device:', error);
    return NextResponse.json({ error: 'Failed to register device', details: error.message }, { status: 500 });
  }
}
