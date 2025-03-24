import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    const apiToken = await prisma.apiToken.findFirst({
      where: {
        token,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!apiToken) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Update last used timestamp
    await prisma.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsed: new Date() }
    });

    return NextResponse.json({
      valid: true,
      scopes: apiToken.scopes,
      user: apiToken.user
    });
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json(
      { message: "Failed to validate token" },
      { status: 500 }
    );
  }
}