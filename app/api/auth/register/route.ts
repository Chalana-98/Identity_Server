import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email or username already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate verification token
    const verifyToken = crypto.randomBytes(32).toString("hex");

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        verifyToken,
        profile: {
          create: {} // Create empty profile
        }
      }
    });

    // Send verification email
    await sendVerificationEmail(email, verifyToken);

    return NextResponse.json(
      { message: "Registration successful. Please check your email to verify your account." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "An error occurred during registration" },
      { status: 500 }
    );
  }
}