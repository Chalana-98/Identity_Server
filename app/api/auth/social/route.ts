import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { addAuditLog } from "@/lib/audit";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { provider, providerId, accessToken, refreshToken, userId } = await req.json();

    const socialLogin = await prisma.socialLogin.create({
      data: {
        provider,
        providerId,
        accessToken,
        refreshToken,
        userId
      }
    });

    await addAuditLog(userId, "SOCIAL_LOGIN_LINKED", { provider });

    return NextResponse.json(socialLogin, { status: 201 });
  } catch (error) {
    console.error("Social login error:", error);
    return NextResponse.json(
      { message: "Failed to link social account" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { provider, userId } = await req.json();

    await prisma.socialLogin.deleteMany({
      where: {
        provider,
        userId
      }
    });

    await addAuditLog(userId, "SOCIAL_LOGIN_REMOVED", { provider });

    return NextResponse.json(
      { message: "Social login removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Social login removal error:", error);
    return NextResponse.json(
      { message: "Failed to remove social login" },
      { status: 500 }
    );
  }
}