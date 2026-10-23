import { expect, it } from "vitest";
import {
  emailDeliveryEnabled,
  smtpConfig,
  smtpTransport,
} from "../scripts/smtp-config.ts";
const smtp = {
  NODE_ENV: "test" as const,
  SMTP_HOST: "smtp.queensmtp.com",
  SMTP_PORT: "465",
  SMTP_SECURE: "true",
  SMTP_USER: "test-user",
  SMTP_PASSWORD: "test-password",
  SMTP_FROM: "portfolio@example.com",
  CONTACT_TO: "owner@example.com",
};
it("supports the existing runtime flag and rejects conflicting flags", () => {
  expect(emailDeliveryEnabled({ NODE_ENV: "test" })).toBe(false);
  expect(emailDeliveryEnabled({ NODE_ENV: "test", SMTP_ENABLED: "true" })).toBe(
    true,
  );
  expect(() =>
    emailDeliveryEnabled({
      NODE_ENV: "test",
      SMTP_ENABLED: "false",
      EMAIL_DELIVERY_ENABLED: "true",
    }),
  ).toThrow("disagree");
});
it("enforces TLS on QueenSMTP ports and keeps transport logging off", () => {
  const ssl = smtpTransport(smtpConfig(smtp));
  expect(ssl.options).toMatchObject({
    secure: true,
    logger: false,
    debug: false,
    tls: { minVersion: "TLSv1.2" },
  });
  ssl.close();
  const starttls = smtpTransport(
    smtpConfig({ ...smtp, SMTP_PORT: "587", SMTP_SECURE: "false" }),
  );
  expect(starttls.options).toMatchObject({ secure: false, requireTLS: true });
  starttls.close();
  expect(() => smtpConfig({ ...smtp, SMTP_SECURE: "false" })).toThrow("465");
  expect(() => smtpConfig({ ...smtp, SMTP_PORT: "587" })).toThrow("587");
});
