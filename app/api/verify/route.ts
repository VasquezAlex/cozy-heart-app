import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { headers } from "next/headers"
import prisma from "@/database/index"
import { hashIPData, hashDeviceData } from "@/packages/crypto"
import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v10"

const discord = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!)

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("authjs.session-token")?.value || 
                         cookieStore.get("next-auth.session-token")?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const session = await prisma.session.findFirst({
      where: {
        sessionToken: sessionToken,
        expires: { gt: new Date() }
      },
      include: { user: true }
    })
    
    if (!session?.user) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 })
    }
    
    const UserID = session.user.UserID
    
    if (!UserID) {
      return NextResponse.json({ error: "UserID not linked" }, { status: 400 })
    }
    
    const headersList = await headers()
    const ip = headersList.get("x-forwarded-for")?.split(",")[0] ?? "unknown"
    
    const { DeviceData } = await req.json()
    
    if (!DeviceData) {
      return NextResponse.json({ error: "Missing device data" }, { status: 400 })
    }

    const ipHash = hashIPData(ip)
    const deviceFP = hashDeviceData(Array.isArray(DeviceData) ? DeviceData.join("|") : DeviceData)

    const now = new Date()
    
    const [bannedIP, bannedDevice] = await Promise.all([
      prisma.ban.findFirst({
        where: {
          TargetType: "IP",
          TargetID: ipHash,
          RevokedAt: null,
          OR: [{ ExpiresAt: null }, { ExpiresAt: { gt: now } }]
        }
      }),
      prisma.ban.findFirst({
        where: {
          TargetType: "DEVICE",
          TargetID: deviceFP,
          RevokedAt: null,
          OR: [{ ExpiresAt: null }, { ExpiresAt: { gt: now } }]
        }
      })
    ])

    if (bannedIP) {
      return NextResponse.json({ error: "IP banned", reason: bannedIP.Reason }, { status: 403 })
    }
    
    if (bannedDevice) {
      return NextResponse.json({ error: "Device banned", reason: bannedDevice.Reason }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { UserID }
    })
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const existingMeta = await prisma.metaData.findFirst({
      where: { UserID: user.id }
    })
    
    if (existingMeta) {
      const roleResult = await grantDiscordRole(UserID)
      
      await prisma.user.update({
        where: { id: user.id },
        data: { LastActive: new Date() }
      })
      
      return NextResponse.json({ 
        success: true, 
        alreadyVerified: true,
        roleGranted: roleResult.success,
        roleError: roleResult.error,
        message: roleResult.success ? "Already verified - role granted!" : `Already verified - ${roleResult.error}`
      })
    }

    const [ipRecord, deviceRecord] = await Promise.all([
      prisma.iPAddress.upsert({
        where: { IPHash: ipHash },
        create: { IPHash: ipHash, Details: {} },
        update: {}
      }),
      prisma.deviceFingerprint.upsert({
        where: { Fingerprint: deviceFP },
        create: { Fingerprint: deviceFP, Details: {} },
        update: {}
      })
    ])

    const sharedDeviceMeta = await prisma.metaData.findFirst({
      where: { DeviceID: deviceRecord.ID },
      include: { User: true }
    })

    await prisma.user.update({
      where: { id: user.id },
      data: {
        TrustLevel: sharedDeviceMeta ? "SUSPICIOUS" : "NEW",
        LastActive: new Date()
      }
    })

    const metaData = await prisma.metaData.create({
      data: {
        UserID: user.id,
        IPID: ipRecord.ID,
        DeviceID: deviceRecord.ID,
        TrustScore: sharedDeviceMeta ? 0.3 : 0.8,
        RiskFlags: sharedDeviceMeta ? ["SHARED_DEVICE"] : [],
        VerificationStatus: sharedDeviceMeta ? "SUSPICIOUS" : "VERIFIED",
        ExtraData: sharedDeviceMeta ? {
          previousUser: sharedDeviceMeta.User?.UserID,
          sharedDevice: true
        } : {}
      }
    })

    const roleResult = await grantDiscordRole(UserID)
    
    await prisma.metaData.update({
      where: { ID: metaData.ID },
      data: { 
        ExtraData: { 
          ...(sharedDeviceMeta ? {
            previousUser: sharedDeviceMeta.User?.UserID,
            sharedDevice: true
          } : {}),
          roleGranted: roleResult.success,
          ...(roleResult.success 
            ? { roleGrantedAt: new Date().toISOString() }
            : { roleError: roleResult.error, roleFailedAt: new Date().toISOString() }
          )
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      roleGranted: roleResult.success,
      roleError: roleResult.error,
      warning: sharedDeviceMeta ? "Device previously used by another account" : undefined,
      message: roleResult.success 
        ? "Verified and role granted!" 
        : `Verified but role failed: ${roleResult.error}. Contact a mod.`
    })
    
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function grantDiscordRole(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.GUILD_ID || !process.env.VERIFIED_ROLE_ID) {
      return { success: false, error: "Missing GUILD_ID or VERIFIED_ROLE_ID" }
    }

    await discord.put(
      Routes.guildMemberRole(
        process.env.GUILD_ID,
        userId,
        process.env.VERIFIED_ROLE_ID
      )
    )

    return { success: true }

  } catch (err) {
    const statusCode = (err as Record<string, unknown>).status || (err as Record<string, unknown>).statusCode
    
    const errorMap: Record<number, string> = {
      403: "Bot lacks permission",
      404: "User not in server",
      429: "Rate limited"
    }

    return { 
      success: false, 
      error: errorMap[statusCode as number] || `Discord API error (${statusCode})` 
    }
  }
}