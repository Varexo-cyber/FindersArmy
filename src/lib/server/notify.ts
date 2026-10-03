import "server-only";
import { db } from "./db";
import { sendMail, type Attachment } from "./mailer";
import { notificationCopy } from "../notifications/copy";
import type { NotificationData, NotificationType } from "../notifications/types";
import { appUrl, env } from "../env";

/**
 * Delivery channels. Email and in-app today; WhatsApp/SMS plug in here by implementing
 * `Channel` and adding it to `channelsFor`, without touching the call sites.
 */
interface Recipient {
  userId?: string;
  email: string;
  locale: string;
}

interface Delivery {
  recipient: Recipient;
  type: NotificationType;
  data: NotificationData;
  url?: string;
  attachments?: Attachment[];
}

interface Channel {
  name: string;
  deliver(d: Delivery): Promise<void>;
}

const inAppChannel: Channel = {
  name: "in-app",
  async deliver({ recipient, type, data, url }) {
    if (!recipient.userId) return;
    const copy = notificationCopy(type, recipient.locale, data);
    await db.notification.create({
      data: { userId: recipient.userId, type, payload: { title: copy.title, url: url ?? null, data } as object },
    });
  },
};

const emailChannel: Channel = {
  name: "email",
  async deliver({ recipient, type, data, url, attachments }) {
    const copy = notificationCopy(type, recipient.locale, data);
    const { ctaLabel, ...block } = copy.block;
    await sendMail({
      to: recipient.email,
      subject: copy.subject,
      locale: recipient.locale,
      block: { ...block, cta: ctaLabel && url ? { label: ctaLabel, url: url.startsWith("http") ? url : appUrl(url) } : undefined },
      attachments,
    });
  },
};

function channelsFor(): Channel[] {
  return [inAppChannel, emailChannel];
}

export async function notify(d: Delivery): Promise<void> {
  for (const channel of channelsFor()) {
    try {
      await channel.deliver(d);
    } catch (error) {
      // A failed email must not roll back the business action that triggered it, but it must be visible.
      console.error(JSON.stringify({ event: "notification_failed", channel: channel.name, type: d.type, error: String(error) }));
      if (env().NODE_ENV === "test") throw error;
    }
  }
}

export async function notifyUser(userId: string, type: NotificationType, data: NotificationData, url?: string, attachments?: Attachment[]) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) return;
  await notify({ recipient: { userId: user.id, email: user.email, locale: user.locale }, type, data, url, attachments });
}

/** Business notifications go to every member of the business. */
export async function notifyBusiness(businessId: string, type: NotificationType, data: NotificationData, url?: string, attachments?: Attachment[]) {
  const members = await db.businessMember.findMany({ where: { businessId }, include: { user: true } });
  if (members.length === 0) {
    const business = await db.business.findUniqueOrThrow({ where: { id: businessId } });
    await notify({ recipient: { email: business.email, locale: "nl" }, type, data, url, attachments });
    return;
  }
  for (const m of members) {
    if (m.user.deletedAt) continue;
    await notify({ recipient: { userId: m.userId, email: m.user.email, locale: m.user.locale }, type, data, url, attachments });
  }
}

export async function notifyAdmins(type: NotificationType, data: NotificationData, url?: string) {
  const admins = await db.user.findMany({ where: { roles: { has: "ADMIN" }, deletedAt: null } });
  for (const a of admins) {
    await notify({ recipient: { userId: a.id, email: a.email, locale: a.locale }, type, data, url });
  }
  const extra = env().ADMIN_EMAIL;
  if (extra && !admins.some((a) => a.email === extra)) {
    await notify({ recipient: { email: extra, locale: "nl" }, type, data, url });
  }
}

export async function notifyEmail(email: string, locale: string, type: NotificationType, data: NotificationData, url?: string) {
  await notify({ recipient: { email, locale }, type, data, url });
}
