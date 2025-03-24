import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import bcrypt from "bcryptjs";
import { addAuditLog } from "@/lib/audit";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          // Log failed attempt
          await prisma.loginAttempt.create({
            data: {
              userId: user.id,
              success: false,
              ipAddress: "127.0.0.1" // In production, get from request
            }
          });
          throw new Error("Invalid credentials");
        }

        if (!user.verified) {
          throw new Error("Please verify your email first");
        }

        // Log successful login
        await prisma.loginAttempt.create({
          data: {
            userId: user.id,
            success: true,
            ipAddress: "127.0.0.1" // In production, get from request
          }
        });

        await addAuditLog(user.id, "LOGIN", { method: "credentials" });

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
    verifyRequest: "/auth/verify"
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
      }
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          username: token.username,
          role: token.role
        }
      };
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };