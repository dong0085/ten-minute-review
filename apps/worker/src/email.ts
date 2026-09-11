import { Resend } from "resend";
import { env } from "./env";

export {
  escapeHtml,
  renderActionEmail,
  renderDailyQuizEmail,
  renderPasswordResetEmail,
  renderVerificationEmail,
} from "@tmr/core";
export type { DailyQuizEmailEntry } from "@tmr/core";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendEmail(message: EmailMessage): Promise<{ id: string | null }> {
  if (env.emailProvider === "resend") {
    if (!env.resendApiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }
    const resend = new Resend(env.resendApiKey);
    const { data, error } = await resend.emails.send({
      from: env.emailFrom,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    if (error) {
      throw new Error(error.message);
    }
    return { id: data?.id ?? null };
  }

  console.log(
    `\n[email:console] to=${message.to}\nsubject=${message.subject}\n\n${message.text}\n`,
  );
  return { id: null };
}
