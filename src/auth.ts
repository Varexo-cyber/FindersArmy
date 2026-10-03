import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { AdminRole, Role } from "@prisma/client";
import { db } from "@/lib/server/db";
import { sendMail } from "@/lib/server/mailer";

declare module "next-auth" {
  interface Session {
    user: { id: string; roles: Role[]; adminRole: AdminRole | null; locale: string } & DefaultSession["user"];
  }
}

const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
  pages: { signIn: "/login", verifyRequest: "/login/check", error: "/login" },
  providers: [
    {
      id: "email",
      type: "email",
      name: "E-mail",
      from: process.env.EMAIL_FROM ?? "FindersArmy <noreply@findersarmy.com>",
      maxAge: 30 * 60,
      options: {},
      async sendVerificationRequest({ identifier, url }) {
        const user = await db.user.findUnique({ where: { email: identifier.toLowerCase() } });
        const locale = user?.locale ?? (url.includes("%2Fen%2F") || url.includes("%2Fen&") ? "en" : "nl");
        const en = locale === "en";
        await sendMail({
          to: identifier,
          locale,
          subject: en ? "Your FindersArmy login link" : "Je inloglink voor FindersArmy",
          block: {
            heading: en ? "Log in to FindersArmy" : "Inloggen bij FindersArmy",
            paragraphs: [
              en
                ? "Click the button to log in. The link works once and expires in 30 minutes."
                : "Klik op de knop om in te loggen. De link werkt één keer en verloopt na 30 minuten.",
            ],
            cta: { label: en ? "Log in" : "Inloggen", url },
            footnote: en
              ? "Didn't request this? Ignore this email; nobody can log in without this link."
              : "Niet aangevraagd? Negeer deze e-mail; zonder deze link kan niemand inloggen.",
          },
        });
      },
    },
    ...(googleEnabled ? [Google({ allowDangerousEmailAccountLinking: true })] : []),
  ],
  callbacks: {
    async session({ session, user }) {
      const u = user as unknown as { id: string; roles: Role[]; adminRole: AdminRole | null; locale: string; deletedAt: Date | null };
      session.user.id = u.id;
      session.user.roles = u.roles ?? [];
      session.user.adminRole = u.adminRole ?? null;
      session.user.locale = u.locale ?? "nl";
      return session;
    },
    async signIn({ user }) {
      const existing = user.email ? await db.user.findUnique({ where: { email: user.email.toLowerCase() } }) : null;
      return !existing?.deletedAt;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id && user.email) {
        await db.user.update({ where: { id: user.id }, data: { email: user.email.toLowerCase() } });
      }
    },
  },
});

export const isGoogleEnabled = googleEnabled;
