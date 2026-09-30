import { Resend } from "resend";
import { magicLinkEmail } from "./magicLinkTemplate";

let resend: Resend | null = null;

function client(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return (resend ??= new Resend(key));
}

const FROM = process.env.EMAIL_FROM || "Picskrypt <no-reply@picskrypt.com>";

export async function sendMagicLinkToEmail(opts: {
  to_email: string;
  magic_link: string;
  expires_in_minutes?: number;
}) {
  const { html, text } = magicLinkEmail({
    magicLink: opts.magic_link,
    expiresInMinutes: opts.expires_in_minutes,
  });

  const { error } = await client().emails.send({
    from: FROM,
    to: opts.to_email,
    subject: "Your Picskrypt login link",
    html,
    text,
  });

  if (error) {
    throw new Error(`Resend failed to send magic link: ${error.message}`);
  }
}