import { createClient } from "@supabase/supabase-js";
import {
  emailDeliveryEnabled,
  smtpConfig,
  smtpTransport,
} from "./smtp-config.ts";
import { z } from "zod";
const env = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    SUPABASE_SECRET_KEY: z.string().min(10),
    SITE_URL: z.url(),
  })
  .parse(process.env);
const deliveryEnabled = emailDeliveryEnabled(process.env);
const smtp = deliveryEnabled ? smtpConfig(process.env) : null;
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const transport = smtp ? smtpTransport(smtp) : null;
if (!deliveryEnabled)
  console.info(JSON.stringify({ event: "email_delivery_paused" }));
let running = true;
process.on("SIGTERM", () => {
  running = false;
});
process.on("SIGINT", () => {
  running = false;
});
let cleaned = 0;
while (running) {
  try {
    if (Date.now() - cleaned > 60000) {
      const { error } = await db.rpc("cleanup_portfolio");
      if (error) throw error;
      cleaned = Date.now();
    }
    if (smtp && transport) {
      const { data: jobs, error } = await db.rpc("claim_email_jobs", {
        batch_size: 5,
      });
      if (error) throw error;
      for (const job of jobs || []) {
        try {
          const { data: message, error: loadError } = await db
            .from("contact_messages")
            .select("*")
            .eq("id", job.message_id)
            .single();
          if (loadError) throw loadError;
          await transport.sendMail({
            from: smtp.SMTP_FROM,
            to: smtp.CONTACT_TO,
            replyTo: message.email,
            subject:
              `Portfolio enquiry: ${message.subject || "New message"}`.replace(
                /[\r\n]/g,
                " ",
              ),
            text: `${message.name}\n${message.email}\n\n${message.message}\n\nReceived: ${message.created_at}\nDashboard: ${env.SITE_URL}/${message.locale}/admin`,
            messageId: `<portfolio-${job.id}@${new URL(env.SITE_URL).hostname}>`,
          });
          const { error: saveError } = await db
            .from("email_outbox")
            .update({
              state: "sent",
              sent_at: new Date().toISOString(),
              last_error: null,
            })
            .eq("id", job.id)
            .eq("attempts", job.attempts);
          if (saveError) throw saveError;
          console.info(JSON.stringify({ event: "email_sent", jobId: job.id }));
        } catch {
          const failed = job.attempts >= 6;
          const { error: saveError } = await db
            .from("email_outbox")
            .update({
              state: failed ? "failed" : "pending",
              last_error: "delivery_failed",
              next_attempt_at: new Date(
                Date.now() + Math.min(3600, 30 * 2 ** job.attempts) * 1000,
              ).toISOString(),
            })
            .eq("id", job.id)
            .eq("attempts", job.attempts);
          console.error(
            JSON.stringify({
              event: saveError
                ? "email_state_failed"
                : failed
                  ? "email_exhausted"
                  : "email_retry",
              jobId: job.id,
            }),
          );
        }
      }
    }
  } catch {
    console.error(JSON.stringify({ event: "worker_poll_failed" }));
  }
  if (process.argv.includes("--once")) break;
  await new Promise((resolve) => setTimeout(resolve, 10000));
}
transport?.close();
