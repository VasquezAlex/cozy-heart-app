import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { Prisma } from "@prisma/client";
import { authenticate, deny } from "@/lib/security/request-auth";

export async function GET(req: Request) {
  try {
    const ctx = authenticate(req);

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const status = searchParams.get("status");

    const where: Prisma.BanWhereInput = {};

    if (status === "active") {
      where.RevokedAt = null;
      where.OR = [{ ExpiresAt: null }, { ExpiresAt: { gt: new Date() } }];
    } else if (status === "expired") {
      where.OR = [{ RevokedAt: { not: null } }, { ExpiresAt: { lte: new Date() } }];
    }

    const bans = await prisma.ban.findMany({
      where,
      orderBy: { CreatedAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      requestId: ctx.requestId,
      count: bans.length,
      bans,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return deny(message);
  }
}

export async function POST(req: Request) {
  let ctx;

  try {
    ctx = authenticate(req);
    const body = await req.json();
    const {
      UserID: userIdInput,
      TargetID: targetIdInput,
      Reason: reasonInput,
      BannedBy: bannedByInput,
      ExpiresAt: expiresAtInput,
      Cascade: cascadeInput,
      BanAlts: banAltsInput,
    } = body;

    const userId = userIdInput || targetIdInput;
    const cascade =
      typeof cascadeInput === "boolean"
        ? cascadeInput
        : typeof banAltsInput === "boolean"
          ? banAltsInput
          : true;

    if (!userId) {
      return NextResponse.json({ error: "UserID required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { UserID: userId },
      include: {
        MetaDatas: {
          orderBy: { LastSeenAt: "desc" },
          take: 1,
          include: {
            IPAddress: true,
            DeviceFingerprint: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existing = await prisma.ban.findFirst({
      where: {
        TargetType: "USER",
        TargetID: userId,
        RevokedAt: null,
        OR: [{ ExpiresAt: null }, { ExpiresAt: { gt: new Date() } }],
      },
    });

    if (existing) {
      return NextResponse.json({ error: "User already banned" }, { status: 409 });
    }

    const meta = user.MetaDatas[0];
    const now = new Date();
    const altIds = new Set<string>();
    const bans = [];

    const mainBan = await prisma.ban.create({
      data: {
        TargetType: "USER",
        TargetID: userId,
        UserID: user.id,
        Reason: reasonInput || "No reason provided",
        BannedBy: bannedByInput || "system",
        CreatedAt: now,
        ExpiresAt: expiresAtInput ? new Date(expiresAtInput) : null,
        Details: {
          previousTrustLevel: user.TrustLevel,
          ipAtTimeOfBan: meta?.IPAddress?.IPHash,
          deviceAtTimeOfBan: meta?.DeviceFingerprint?.Fingerprint,
        },
      },
    });
    bans.push(mainBan);

    if (cascade && meta) {
      if (meta.IPAddress) {
        const ipBan = await prisma.ban.create({
          data: {
            TargetType: "IP",
            TargetID: meta.IPAddress.IPHash,
            Reason: `Cascade from user ${userId}: ${reasonInput || "No reason"}`,
            BannedBy: bannedByInput || "system",
            CreatedAt: now,
            ExpiresAt: expiresAtInput ? new Date(expiresAtInput) : null,
            Details: { sourceUserId: userId },
          },
        });
        bans.push(ipBan);

        const altsByIP = await prisma.metaData.findMany({
          where: {
            IPID: meta.IPID,
            UserID: { not: user.id },
            IsBlocked: false,
          },
          include: { User: true },
          distinct: ["UserID"],
        });

        for (const alt of altsByIP) {
          if (!altIds.has(alt.UserID) && alt.User.UserID) {
            altIds.add(alt.UserID);

            const altBan = await prisma.ban.create({
              data: {
                TargetType: "USER",
                TargetID: alt.User.UserID,
                UserID: alt.UserID,
                Reason: `Alt account (shared IP with ${userId}): ${reasonInput || "No reason"}`,
                BannedBy: bannedByInput || "system",
                CreatedAt: now,
                ExpiresAt: expiresAtInput ? new Date(expiresAtInput) : null,
                Details: { isAlt: true, linkedTo: userId, method: "IP_MATCH" },
              },
            });
            bans.push(altBan);

            await prisma.user.update({
              where: { id: alt.UserID },
              data: { TrustLevel: "BANNED" },
            });
          }
        }
      }

      if (meta.DeviceFingerprint) {
        const deviceBan = await prisma.ban.create({
          data: {
            TargetType: "DEVICE",
            TargetID: meta.DeviceFingerprint.Fingerprint,
            Reason: `Cascade from user ${userId}: ${reasonInput || "No reason"}`,
            BannedBy: bannedByInput || "system",
            CreatedAt: now,
            ExpiresAt: expiresAtInput ? new Date(expiresAtInput) : null,
            Details: { sourceUserId: userId },
          },
        });
        bans.push(deviceBan);

        const altsByDevice = await prisma.metaData.findMany({
          where: {
            DeviceID: meta.DeviceID,
            UserID: {
              not: user.id,
              notIn: Array.from(altIds),
            },
            IsBlocked: false,
          },
          include: { User: true },
          distinct: ["UserID"],
        });

        for (const alt of altsByDevice) {
          if (!altIds.has(alt.UserID) && alt.User.UserID) {
            altIds.add(alt.UserID);

            const altBan = await prisma.ban.create({
              data: {
                TargetType: "USER",
                TargetID: alt.User.UserID,
                UserID: alt.UserID,
                Reason: `Alt account (shared device with ${userId}): ${reasonInput || "No reason"}`,
                BannedBy: bannedByInput || "system",
                CreatedAt: now,
                ExpiresAt: expiresAtInput ? new Date(expiresAtInput) : null,
                Details: { isAlt: true, linkedTo: userId, method: "DEVICE_MATCH" },
              },
            });
            bans.push(altBan);

            await prisma.user.update({
              where: { id: alt.UserID },
              data: { TrustLevel: "BANNED" },
            });
          }
        }
      }
    }

    await prisma.user.update({
      where: { UserID: userId },
      data: { TrustLevel: "BANNED" },
    });

    return NextResponse.json({
      success: true,
      requestId: ctx.requestId,
      message: `User ${userId} banned successfully`,
      bansCreated: bans.length,
      banCount: bans.length,
      altCount: altIds.size,
      details: {
        mainBanId: mainBan.ID,
        altsBanned: altIds.size,
        ipBanned: !!meta?.IPAddress && cascade,
        deviceBanned: !!meta?.DeviceFingerprint && cascade,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (
      ["IP not allowed", "Too many requests", "Request too old", "Wrong API key", "Invalid signature"].includes(
        message
      )
    ) {
      return deny(message, ctx?.requestId);
    }

    console.error(`[Ban Error][${ctx?.requestId}]`, error);
    return NextResponse.json({ error: "Internal error", requestId: ctx?.requestId }, { status: 500 });
  }
}