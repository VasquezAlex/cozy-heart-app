import { prisma } from "@/lib/db/client";
import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ verified: false }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { TrustLevel: true },
    });

    const verified = user?.TrustLevel === "VERIFIED";

    return NextResponse.json({ verified });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json({ verified: false }, { status: 500 });
  }
}
