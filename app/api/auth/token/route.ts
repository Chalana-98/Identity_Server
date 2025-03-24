import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { addAuditLog } from "@/lib/audit";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const tokens = await prisma.apiToken.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        scopes: true,
        lastUsed: true,
        expiresAt: true,
        createdAt: true
      }
    });

    return NextResponse.json(tokens);
  } catch (error) {
    console.error("Token fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch tokens" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name, scopes, expiresAt } = await req.json();

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');

    const apiToken = await prisma.apiToken.create({
      data: {
        name,
        token,
        scopes,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        userId: session.user.id
      }
    });

    await addAuditLog(session.user.id, "API_TOKEN_CREATED", {
      tokenId: apiToken.id,
      name,
      scopes
    });

    return NextResponse.json({
      ...apiToken,
      token // Only return the token on creation
    }, { status: 201 });
  } catch (error) {
    console.error("Token creation error:", error);
    return NextResponse.json(
      { message: "Failed to create token" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { tokenId } = await req.json();

    const token = await prisma.apiToken.findFirst({
      where: {
        id: tokenId,
        userId: session.user.id
      }
    });

    if (!token) {
      return NextResponse.json(
        { message: "Token not found" },
        { status: 404 }
      );
    }

    await prisma.apiToken.delete({
      where: { id: tokenId }
    });

    await addAuditLog(session.user.id, "API_TOKEN_DELETED", {
      tokenId,
      name: token.name
    });

    return NextResponse.json(
      { message: "Token deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Token deletion error:", error);
    return NextResponse.json(
      { message: "Failed to delete token" },
      { status: 500 }
    );
  }
}