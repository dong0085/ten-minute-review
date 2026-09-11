import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { verify } from "@node-rs/argon2";
import { cookies } from "next/headers";
import {
  createUser,
  extendClassroomActivityForLogin,
  getUserByEmail,
  recordReferralSignup,
} from "@tmr/db";
import { env } from "./env";
import { getDb } from "./db";
import { resolveInviteCode } from "./invite";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

const providers: NextAuthConfig["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(Google({ allowDangerousEmailAccountLinking: true }));
}

providers.push(
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = typeof credentials?.email === "string" ? credentials.email : null;
      const password = typeof credentials?.password === "string" ? credentials.password : null;
      if (!email || !password) {
        return null;
      }
      const user = await getUserByEmail(getDb(), email);
      if (!user?.passwordHash) {
        return null;
      }
      const valid = await verify(user.passwordHash, password).catch(() => false);
      if (!valid) {
        return null;
      }
      return { id: user.id, email: user.email, name: user.username ?? user.email };
    },
  }),
);

export const authConfig: NextAuthConfig = {
  secret: env.authSecret,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers,
  events: {
    async signIn({ user }) {
      if (user.id) {
        await extendClassroomActivityForLogin(getDb(), user.id);
      }
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) {
        return false;
      }
      const db = getDb();
      const existing = await getUserByEmail(db, user.email);
      if (existing) {
        user.id = existing.id;
        return true;
      }
      if (account?.provider === "credentials") {
        return true;
      }
      let referrerUserId: string | null = null;
      let sourceCode: string | null = null;
      if (env.inviteOnly) {
        const store = await cookies();
        const cookieCode = store.get("tmr_invite")?.value ?? null;
        const resolved = await resolveInviteCode(db, cookieCode);
        if (!resolved) {
          return "/signup?error=invite";
        }
        referrerUserId = resolved.referrerUserId;
        sourceCode = cookieCode;
      }
      const created = await createUser(db, {
        email: user.email,
        username: user.name ?? null,
        avatarUrl: user.image ?? null,
        emailVerifiedAt: new Date(),
      });
      if (!created) {
        return false;
      }
      user.id = created.id;
      if (referrerUserId) {
        await recordReferralSignup(db, {
          referrerUserId,
          sourceCode,
          referredUserId: created.id,
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
      }
      if (!token.userId && token.email) {
        const dbUser = await getUserByEmail(getDb(), token.email);
        if (dbUser) {
          token.userId = dbUser.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.userId === "string") {
        session.user.id = token.userId;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
