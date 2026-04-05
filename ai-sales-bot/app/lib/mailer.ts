import nodemailer from "nodemailer";

let _transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!_transporter) {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) throw new Error("Missing GMAIL_USER or GMAIL_APP_PASSWORD");
    _transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }
  return _transporter;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ messageId: string }> {
  const from = process.env.GMAIL_USER;
  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: `"Max @ Sales Bot" <${from}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html ?? opts.text.replace(/\n/g, "<br>"),
  });
  return { messageId: info.messageId };
}
