import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { validate, verifyRequestSchema } from "@/lib/security/validation";
import { hashIPData, hashDeviceData } from "@/packages/crypto";
import { getClient, isDiscordError } from "@/lib/discord/client";

type RoleResult = { success: boolean; error?: string };

export async function POST(req: Request) {
	try {
		const store = await cookies();
		const token =
			store.get("authjs.session-token")?.value || store.get("next-auth.session-token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Not signed in" }, { status: 401 });
		}

		const session = await prisma.session.findFirst({
			where: { sessionToken: token, expires: { gt: new Date() } },
			include: { user: true },
		});

		if (!session?.user?.UserID) {
			return NextResponse.json({ error: "Session expired or user not linked" }, { status: 401 });
		}

		const userId = session.user.UserID;

		const body = await req.json();
		const parsed = validate(verifyRequestSchema, body);
		if (!parsed.success) {
			return NextResponse.json({ error: parsed.error }, { status: 400 });
		}

		const ipHash = hashIPData(req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown");
		const deviceData = parsed.data.DeviceData;
		const deviceHash = hashDeviceData(
			Array.isArray(deviceData)
				? deviceData.join("|")
				: typeof deviceData === "string"
					? deviceData
					: JSON.stringify(deviceData)
		);
		const now = new Date();

		const [bannedIP, bannedDevice] = await Promise.all([
			prisma.ban.findFirst({
				where: {
					TargetType: "IP",
					TargetID: ipHash,
					RevokedAt: null,
					OR: [{ ExpiresAt: null }, { ExpiresAt: { gt: now } }],
				},
			}),
			prisma.ban.findFirst({
				where: {
					TargetType: "DEVICE",
					TargetID: deviceHash,
					RevokedAt: null,
					OR: [{ ExpiresAt: null }, { ExpiresAt: { gt: now } }],
				},
			}),
		]);

		if (bannedIP) {
			return NextResponse.json({ error: "IP banned", reason: bannedIP.Reason }, { status: 403 });
		}

		if (bannedDevice) {
			return NextResponse.json({ error: "Device banned", reason: bannedDevice.Reason }, { status: 403 });
		}

		const user = await prisma.user.findUnique({ where: { UserID: userId } });
		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const existingMeta = await prisma.metaData.findFirst({ where: { UserID: user.id }, select: { ID: true } });
		if (existingMeta) {
			const role = await grantRole(userId);

			await prisma.user.update({
				where: { id: user.id },
				data: { LastActive: new Date() },
			});

			return NextResponse.json({
				success: true,
				alreadyVerified: true,
				roleGranted: role.success,
				roleError: role.error,
				message: role.success
					? "Already verified - role granted!"
					: `Already verified - ${role.error}`,
			});
		}

		const [ipRecord, deviceRecord] = await Promise.all([
			prisma.iPAddress.upsert({
				where: { IPHash: ipHash },
				create: { IPHash: ipHash, Details: {} },
				update: {},
			}),
			prisma.deviceFingerprint.upsert({
				where: { Fingerprint: deviceHash },
				create: { Fingerprint: deviceHash, Details: {} },
				update: {},
			}),
		]);

		const sharedDevice = await prisma.metaData.findFirst({
			where: { DeviceID: deviceRecord.ID },
			include: { User: true },
		});

		const trust = sharedDevice
			? { level: "SUSPICIOUS", score: 0.3, flags: ["SHARED_DEVICE"] as string[], status: "SUSPICIOUS" }
			: { level: "NEW", score: 0.8, flags: [] as string[], status: "VERIFIED" };

		const extra = sharedDevice
			? {
					previousUser: sharedDevice.User?.UserID,
					sharedDevice: true,
				}
			: {};

		await prisma.user.update({
			where: { id: user.id },
			data: {
				TrustLevel: trust.level,
				LastActive: new Date(),
			},
		});

		const meta = await prisma.metaData.create({
			data: {
				UserID: user.id,
				IPID: ipRecord.ID,
				DeviceID: deviceRecord.ID,
				TrustScore: trust.score,
				RiskFlags: trust.flags,
				VerificationStatus: trust.status,
				ExtraData: extra,
			},
		});

		const role = await grantRole(userId);
		const roleExtra = role.success
			? {
					...extra,
					roleGranted: true,
					roleGrantedAt: new Date().toISOString(),
				}
			: {
					...extra,
					roleGranted: false,
					roleError: role.error,
					roleFailedAt: new Date().toISOString(),
				};

		await prisma.metaData.update({
			where: { ID: meta.ID },
			data: {
				ExtraData: roleExtra,
			},
		});

		return NextResponse.json({
			success: true,
			roleGranted: role.success,
			roleError: role.error,
			warning: sharedDevice ? "Device previously used by another account" : undefined,
			message: role.success
				? "Verified and role granted!"
				: `Verified but role failed: ${role.error}. Contact a mod.`,
		});
	} catch (error) {
		console.error("Verification error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

async function grantRole(userId: string): Promise<RoleResult> {
	try {
		const roleId = process.env.VERIFIED_ROLE_ID;

		if (!roleId) {
			return { success: false, error: "Missing VERIFIED_ROLE_ID" };
		}

		await getClient().addRole(userId, roleId, "Cozy Heart verification flow");
		return { success: true };
	} catch (error) {
		const status = isDiscordError(error) ? error.status : undefined;
		const errorMap: Record<number, string> = {
			403: "Bot lacks permission",
			404: "User not in server",
			429: "Rate limited",
		};

		return {
			success: false,
			error: errorMap[status as number] || `Discord API error (${status})`,
		};
	}
}

