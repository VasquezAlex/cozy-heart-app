import { NextResponse } from "next/server";
import prisma from "@/database/index";
import { Prisma } from "@prisma/client";
import { authenticate, deny } from "@/lib/helpers/api-auth";

// GET /api/v1/moderation/bans - List bans (protected)
export async function GET(req: Request) {
  try {
    const auth = authenticate(req);
    
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const status = searchParams.get('status'); // 'active', 'expired', 'all'
    
    const where: Prisma.BanWhereInput = {};
    
    if (status === 'active') {
      where.RevokedAt = null;
      where.OR = [
        { ExpiresAt: null },
        { ExpiresAt: { gt: new Date() } }
      ];
    } else if (status === 'expired') {
      where.OR = [
        { RevokedAt: { not: null } },
        { ExpiresAt: { lte: new Date() } }
      ];
    }

    const bans = await prisma.ban.findMany({
      where,
      orderBy: { CreatedAt: 'desc' },
      take: limit
    });
    
    return NextResponse.json({ 
      success: true, 
      requestId: auth.requestId, 
      count: bans.length,
      bans 
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return deny(message);
  }
}

// POST /api/v1/moderation/bans - Ban user + cascade (protected)
export async function POST(req: Request) {
  let auth;
  
  try {
    auth = authenticate(req);
    const body = await req.json();
    const { UserID, Reason, BannedBy, ExpiresAt, Cascade = true } = body;

    if (!UserID) {
      return NextResponse.json({ error: 'UserID required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { UserID },
      include: {
        MetaDatas: {
          orderBy: { LastSeenAt: 'desc' },
          take: 1,
          include: { 
            IPAddress: true, 
            DeviceFingerprint: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already banned
    const existing = await prisma.ban.findFirst({
      where: {
        TargetType: 'USER',
        TargetID: UserID,
        RevokedAt: null,
        OR: [
          { ExpiresAt: null },
          { ExpiresAt: { gt: new Date() } }
        ]
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'User already banned' }, { status: 409 });
    }

    const latestMeta = user.MetaDatas[0];
    const now = new Date();
    const bannedAlts = new Set<string>();
    const createdBans = [];

    // 1. Ban main user
    const mainBan = await prisma.ban.create({
      data: {
        TargetType: 'USER',
        TargetID: UserID,
        UserID: user.id,
        Reason: Reason || 'No reason provided',
        BannedBy: BannedBy || 'system',
        CreatedAt: now,
        ExpiresAt: ExpiresAt ? new Date(ExpiresAt) : null,
        Details: {
          previousTrustLevel: user.TrustLevel,
          ipAtTimeOfBan: latestMeta?.IPAddress?.IPHash,
          deviceAtTimeOfBan: latestMeta?.DeviceFingerprint?.Fingerprint
        }
      }
    });
    createdBans.push(mainBan);

    // 2. Cascade: Ban IP + Device + Alts
    if (Cascade && latestMeta) {
      // Ban IP
      if (latestMeta.IPAddress) {
        const IPBan = await prisma.ban.create({
          data: {
            TargetType: 'IP',
            TargetID: latestMeta.IPAddress.IPHash,
            Reason: `Cascade from user ${UserID}: ${Reason || 'No reason'}`,
            BannedBy: BannedBy || 'system',
            CreatedAt: now,
            ExpiresAt: ExpiresAt ? new Date(ExpiresAt) : null,
            Details: { sourceUserId: UserID }
          }
        });
        createdBans.push(IPBan);

        // Find and ban alts by IP
        const altsByIP = await prisma.metaData.findMany({
          where: {
            IPID: latestMeta.IPID,
            UserID: { not: user.id },
            IsBlocked: false
          },
          include: { User: true },
          distinct: ['UserID']
        });

        for (const alt of altsByIP) {
          if (!bannedAlts.has(alt.UserID) && alt.User.UserID) {
            bannedAlts.add(alt.UserID);
            
            const altBan = await prisma.ban.create({
              data: {
                TargetType: 'USER',
                TargetID: alt.User.UserID,
                UserID: alt.UserID,
                Reason: `Alt account (shared IP with ${UserID}): ${Reason || 'No reason'}`,
                BannedBy: BannedBy || 'system',
                CreatedAt: now,
                ExpiresAt: ExpiresAt ? new Date(ExpiresAt) : null,
                Details: { isAlt: true, linkedTo: UserID, method: 'IP_MATCH' }
              }
            });
            createdBans.push(altBan);

            await prisma.user.update({
              where: { id: alt.UserID },
              data: { TrustLevel: 'BANNED' }
            });
          }
        }
      }

      // Ban Device
      if (latestMeta.DeviceFingerprint) {
        const deviceBan = await prisma.ban.create({
          data: {
            TargetType: 'DEVICE',
            TargetID: latestMeta.DeviceFingerprint.Fingerprint,
            Reason: `Cascade from user ${UserID}: ${Reason || 'No reason'}`,
            BannedBy: BannedBy || 'system',
            CreatedAt: now,
            ExpiresAt: ExpiresAt ? new Date(ExpiresAt) : null,
            Details: { sourceUserId: UserID }
          }
        });
        createdBans.push(deviceBan);

        // Find alts by Device
        const altsByDevice = await prisma.metaData.findMany({
          where: {
            DeviceID: latestMeta.DeviceID,
            UserID: { 
              not: user.id,
              notIn: Array.from(bannedAlts)
            },
            IsBlocked: false
          },
          include: { User: true },
          distinct: ['UserID']
        });

        for (const alt of altsByDevice) {
          if (!bannedAlts.has(alt.UserID) && alt.User.UserID) {
            bannedAlts.add(alt.UserID);
            
            const altBan = await prisma.ban.create({
              data: {
                TargetType: 'USER',
                TargetID: alt.User.UserID,
                UserID: alt.UserID,
                Reason: `Alt account (shared device with ${UserID}): ${Reason || 'No reason'}`,
                BannedBy: BannedBy || 'system',
                CreatedAt: now,
                ExpiresAt: ExpiresAt ? new Date(ExpiresAt) : null,
                Details: { isAlt: true, linkedTo: UserID, method: 'DEVICE_MATCH' }
              }
            });
            createdBans.push(altBan);

            await prisma.user.update({
              where: { id: alt.UserID },
              data: { TrustLevel: 'BANNED' }
            });
          }
        }
      }
    }

    // Update main user
    await prisma.user.update({
      where: { UserID },
      data: { TrustLevel: 'BANNED' }
    });

    return NextResponse.json({
      success: true,
      requestId: auth.requestId,
      message: `User ${UserID} banned successfully`,
      bansCreated: createdBans.length,
      details: {
        mainBanId: mainBan.ID,
        altsBanned: bannedAlts.size,
        ipBanned: !!latestMeta?.IPAddress && Cascade,
        deviceBanned: !!latestMeta?.DeviceFingerprint && Cascade
      }
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (['IP not allowed', 'Too many requests', 'Request too old', 'Wrong API key', 'Invalid signature'].includes(message)) {
      return deny(message, auth?.requestId);
    }
    console.error(`[Ban Error][${auth?.requestId}]`, err);
    return NextResponse.json({ error: 'Internal error', requestId: auth?.requestId }, { status: 500 });
  }
}