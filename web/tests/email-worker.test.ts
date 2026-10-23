import { it, expect } from "vitest";
import { createServer } from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";

it("maintains the database without SMTP and leaves pending email jobs unclaimed", async () => {
  const requests: string[] = [];
  const server = createServer((req, res) => {
    requests.push(req.url || "");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end("null");
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("No port");
    const child = spawn(
      process.execPath,
      ["scripts/email-worker.ts", "--once"],
      {
        env: {
          PATH: process.env.PATH,
          NODE_ENV: "test",
          NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${address.port}`,
          SUPABASE_SECRET_KEY: "test-only-secret-key",
          SITE_URL: "https://portfolio.example.com",
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let output = "";
    child.stdout.on("data", (data) => {
      output += String(data);
    });
    child.stderr.on("data", (data) => {
      output += String(data);
    });
    const [code] = await once(child, "exit");
    expect(code, output).toBe(0);
    expect(output).toContain("email_delivery_paused");
    expect(output).not.toContain("worker_poll_failed");
    expect(requests).toEqual(["/rest/v1/rpc/cleanup_portfolio"]);
  } finally {
    server.close();
    await once(server, "close");
  }
});

it("fails before polling when SMTP delivery is enabled without credentials", () => {
  const result = spawnSync(
    process.execPath,
    ["scripts/email-worker.ts", "--once"],
    {
      env: {
        NODE_ENV: "test",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:1",
        SUPABASE_SECRET_KEY: "test-only-secret-key",
        SITE_URL: "https://portfolio.example.com",
        EMAIL_DELIVERY_ENABLED: "true",
      },
      encoding: "utf8",
      timeout: 5000,
    },
  );
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("SMTP_HOST");
  expect(result.stdout).not.toContain("email_delivery_paused");
});

it("can skip SMTP verification for a paused deployment without database settings", () => {
  const result = spawnSync(
    process.execPath,
    ["scripts/verify-smtp.ts", "--if-enabled"],
    {
      env: { NODE_ENV: "test", SMTP_ENABLED: "false" },
      encoding: "utf8",
      timeout: 5000,
    },
  );
  expect(result.status).toBe(0);
  expect(result.stdout).toContain("smtp_paused");
});
it("redacts configuration failures from the SMTP verification command", () => {
  const result = spawnSync(process.execPath, ["scripts/verify-smtp.ts"], {
    env: { NODE_ENV: "test", SMTP_PASSWORD: "must-never-appear-in-logs" },
    encoding: "utf8",
    timeout: 5000,
  });
  expect(result.status).toBe(1);
  expect(result.stderr.trim()).toBe(
    JSON.stringify({ event: "smtp_verification_failed", emailSent: false }),
  );
  expect(result.stdout + result.stderr).not.toContain(
    "must-never-appear-in-logs",
  );
});
