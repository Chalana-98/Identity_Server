import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

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
          throw new Error("Invalid credentials");
        }

        if (!user.verified) {
          throw new Error("Please verify your email first");
        }

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        };
      }
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
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          username: user.username,
          role: user.role
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          username: token.username,
          role: token.role
        }
      };
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };