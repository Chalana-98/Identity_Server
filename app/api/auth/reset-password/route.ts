import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { message: "If an account exists with this email, you will receive a password reset link" },
        { status: 200 }
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetExpires
      }
    });

    await sendPasswordResetEmail(email, resetToken);

    return NextResponse.json(
      { message: "If an account exists with this email, you will receive a password reset link" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { message: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { token, password } = await req.json();

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetExpires: null
      }
    });

    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.json(
      { message: "An error occurred while updating your password" },
      { status: 500 }
    );
  }
}