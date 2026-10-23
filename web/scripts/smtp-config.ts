import nodemailer from "nodemailer";
import { z } from "zod";

export function emailDeliveryEnabled(env: NodeJS.ProcessEnv) {
  const flag = z.enum(["true", "false"]);
  const enabled = flag.optional().parse(env.EMAIL_DELIVERY_ENABLED);
  const legacy = flag.optional().parse(env.SMTP_ENABLED);
  if (enabled !== undefined && legacy !== undefined && enabled !== legacy)
    throw new Error("EMAIL_DELIVERY_ENABLED and SMTP_ENABLED disagree");
  return (enabled ?? legacy ?? "false") === "true";
}

export function smtpConfig(env: NodeJS.ProcessEnv) {
  const config = z
    .object({
      SMTP_HOST: z.string().min(1),
      SMTP_PORT: z.coerce.number().int().min(1).max(65535),
      SMTP_SECURE: z.enum(["true", "false"]),
      SMTP_USER: z.string().min(1),
      SMTP_PASSWORD: z.string().min(1),
      SMTP_FROM: z.email(),
      CONTACT_TO: z.email(),
    })
    .parse(env);
  // QueenSMTP's standard ports have different TLS handshakes.
  if (
    (config.SMTP_PORT === 465 && config.SMTP_SECURE !== "true") ||
    (config.SMTP_PORT === 587 && config.SMTP_SECURE !== "false")
  )
    throw new Error("Use SMTP_SECURE=true for port 465, false for port 587");
  return config;
}

export function smtpTransport(config: ReturnType<typeof smtpConfig>) {
  return nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE === "true",
    requireTLS: config.SMTP_SECURE !== "true",
    auth: { user: config.SMTP_USER, pass: config.SMTP_PASSWORD },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    tls: { minVersion: "TLSv1.2" },
    logger: false,
    debug: false,
  });
}
