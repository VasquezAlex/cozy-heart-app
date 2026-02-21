import { NextResponse } from "next/server";
import prisma from "@/database/index";
import { authenticate, deny } from "@/lib/api-helpers/authorization";

// GET /api/bans - List bans (protected)
export async function GET(req: Request) {
  try {
    const auth = authenticate(req);
    const bans = await prisma.ban.findMany({
      orderBy: { CreatedAt: 'desc' },
      take: 100
    });
    
    return NextResponse.json({ success: true, requestId: auth.requestId, bans });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return deny(message);
  }
}

// POST /api/bans - Ban user + alts (protected)
export async function POST(req: Request) {
  let auth;
  
  try {
    auth = authenticate(req);
    const body = await req.json();
    const { UserID, Reason, BannedBy, ExpiresAt } = body;

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

    // 1. Ban main user
    await prisma.ban.create({
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

    // 2. Ban IP + find alts
    if (latestMeta?.IPAddress) {
      await prisma.ban.create({
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
        if (!bannedAlts.has(alt.UserID)) {
          bannedAlts.add(alt.UserID);
          
          if (!alt.User.UserID) {
            continue;
          }
          
          await prisma.ban.create({
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

          await prisma.user.update({
            where: { id: alt.UserID },
            data: { TrustLevel: 'BANNED' }
          });
        }
      }
    }

    // 3. Ban Device + find alts
    if (latestMeta?.DeviceFingerprint) {
      await prisma.ban.create({
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

      // Find alts by Device (skip already banned)
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
        bannedAlts.add(alt.UserID);
        
        if (!alt.User.UserID) {
          continue;
        }
        
        await prisma.ban.create({
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

        await prisma.user.update({
          where: { id: alt.UserID },
          data: { TrustLevel: 'BANNED' }
        });
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
      message: `User ${UserID} banned.`,
      altsBanned: bannedAlts.size,
      cascaded: {
        ipBanned: !!latestMeta?.IPAddress,
        deviceBanned: !!latestMeta?.DeviceFingerprint,
        altsBanned: bannedAlts.size
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