import {
  emailDeliveryEnabled,
  smtpConfig,
  smtpTransport,
} from "./smtp-config.ts";

// Checks DNS, TLS and authentication. Never submits an email or touches the outbox.
let transport: ReturnType<typeof smtpTransport> | undefined;
try {
  if (
    process.argv.includes("--if-enabled") &&
    !emailDeliveryEnabled(process.env)
  ) {
    console.info(JSON.stringify({ event: "smtp_paused", emailSent: false }));
  } else {
    transport = smtpTransport(smtpConfig(process.env));
    await transport.verify();
    console.info(JSON.stringify({ event: "smtp_verified", emailSent: false }));
  }
} catch {
  // Provider errors may contain account details; don't log raw errors or env values.
  console.error(
    JSON.stringify({ event: "smtp_verification_failed", emailSent: false }),
  );
  process.exitCode = 1;
} finally {
  transport?.close();
}
