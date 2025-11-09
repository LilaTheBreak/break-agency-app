import { Router } from "express";
import nodemailer from "nodemailer";

export const dev = Router();

dev.post("/test-mail", async (req, res) => {
  if (process.env.ENABLE_DEV_MAIL !== "true") {
    return res.status(403).json({ ok: false, error: "dev mail disabled" });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!
      }
    });

    await transporter.verify();

    const info = await transporter.sendMail({
      from: `"Home AI" <${process.env.SMTP_USER ?? ""}>`,
      to: "luxuryhomesbylila@gmail.com",
      subject: "Test email from /dev/test-mail",
      text: "If you received this, SMTP is working 🎉"
    });

    return res.json({ ok: true, messageId: info.messageId });
  } catch (err: any) {
    console.error("[dev:test-mail] error", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});
