import "server-only";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { createElement } from "react";
import { EmailLayout, type EmailBlock } from "@/emails/layout";
import { env, isDemoMode } from "../env";
import { db } from "./db";

export interface Attachment {
  filename: string;
  content: Buffer;
}

export interface MailMessage {
  to: string;
  subject: string;
  preview?: string;
  block: EmailBlock;
  locale: string;
  attachments?: Attachment[];
}

let resend: Resend | null = null;

/**
 * Sends a transactional email. Without RESEND_API_KEY the message goes to the dev mailbox table
 * instead, so local development and e2e tests can follow magic links without a mail server.
 * In production a missing key is an error: silently dropping a payment reminder is not an option.
 */
export async function sendMail(message: MailMessage): Promise<void> {
  const element = createElement(EmailLayout, {
    preview: message.preview ?? message.subject,
    block: message.block,
    locale: message.locale,
  });
  const html = await render(element);
  const text = await render(element, { plainText: true });
  const e = env();

  if (!e.RESEND_API_KEY) {
    if (e.NODE_ENV === "production" && !process.env.E2E && !isDemoMode()) throw new Error("RESEND_API_KEY is required in production");
    await db.devMail.create({ data: { to: message.to.toLowerCase(), subject: message.subject, html, text } });
    if (e.NODE_ENV === "development") console.info(`[dev-mail] to=${message.to} subject="${message.subject}"`);
    return;
  }

  resend ??= new Resend(e.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: e.EMAIL_FROM,
    to: message.to,
    subject: message.subject,
    html,
    text,
    attachments: message.attachments?.map((a) => ({ filename: a.filename, content: a.content })),
  });
  if (error) throw new Error(`Email delivery failed: ${error.message}`);
}
