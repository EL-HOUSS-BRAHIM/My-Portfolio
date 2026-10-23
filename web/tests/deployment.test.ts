import { it, expect } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
async function deployment(fail: boolean, smtpFail = false) {
  const temp = await mkdtemp(join(tmpdir(), "portfolio-deploy-test-"));
  try {
    const root = join(temp, "portfolio"),
      shared = join(temp, "budgetify"),
      bin = join(temp, "bin"),
      log = join(temp, "calls.log");
    for (const p of [
      join(root, "releases"),
      join(root, "gateway"),
      join(shared, "gateway"),
      bin,
    ])
      await mkdir(p, { recursive: true });
    await writeFile(
      join(shared, "gateway", "Caddyfile.gateway"),
      "# Shared routes stay intact\nimport /etc/caddy/portfolio/*.caddy\n",
    );
    await writeFile(
      join(shared, "gateway", "compose.yaml"),
      "# /etc/caddy/portfolio\n",
    );
    await writeFile(join(root, "compose.yaml"), "# test fixture");
    await writeFile(
      join(root, "gateway", "production.caddy"),
      "PREVIOUS PORTFOLIO ROUTE\n",
    );
    await writeFile(join(root, "releases", "production.current"), "blue\n");
    await writeFile(
      join(root, "releases", "production-blue.env"),
      "PORTFOLIO_ALIAS=portfolio-production-blue\n",
    );
    const secrets = join(temp, "runtime.env");
    await writeFile(secrets, "# no real credentials\n");
    const config = join(temp, "release.env");
    await writeFile(
      config,
      `DEPLOY_ENV=production\nPORTFOLIO_DOMAIN=brahim-elhouss.me\nPORTFOLIO_IMAGE=ghcr.io/el-houss-brahim/portfolio:${"a".repeat(40)}\nPORTFOLIO_WORKER_IMAGE=ghcr.io/el-houss-brahim/portfolio-worker:${"a".repeat(40)}\nPORTFOLIO_SECRETS_FILE=${secrets}\n`,
    );
    for (const command of ["docker", "curl"])
      await writeFile(
        join(bin, command),
        `#!/usr/bin/env node\nconst fs=require('node:fs');fs.appendFileSync(process.env.PORTFOLIO_TEST_LOG,JSON.stringify({command:${JSON.stringify(command)},args:process.argv.slice(2)})+'\\n');if(${JSON.stringify(command)}==='docker'&&process.env.PORTFOLIO_TEST_SMTP_FAIL==='true'&&process.argv.includes('scripts/verify-smtp.ts'))process.exit(1);if(${JSON.stringify(command)}==='curl'&&process.env.PORTFOLIO_TEST_FAIL==='true'&&process.argv.some(x=>x.includes('https://brahim-elhouss.me')))process.exit(22);\n`,
        { mode: 0o755 },
      );
    const result = spawnSync(
      "bash",
      [resolve("../scripts/deploy-portfolio.sh"), config],
      {
        env: {
          ...process.env,
          PATH: `${bin}:${process.env.PATH}`,
          PORTFOLIO_ROOT: root,
          PORTFOLIO_SHARED_ROOT: shared,
          PORTFOLIO_TEST_LOG: log,
          PORTFOLIO_TEST_FAIL: String(fail),
          PORTFOLIO_TEST_SMTP_FAIL: String(smtpFail),
        },
        encoding: "utf8",
      },
    );
    expect(result.status).toBe(fail || smtpFail ? 1 : 0);
    const calls = (await readFile(log, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { command: string; args: string[] });
    const verifyIndex = calls.findIndex((c) =>
      c.args.includes("scripts/verify-smtp.ts"),
    );
    const upIndex = calls.findIndex((c) => c.args.includes("up"));
    expect(verifyIndex).toBeGreaterThanOrEqual(0);
    if (smtpFail) expect(upIndex).toBe(-1);
    else expect(verifyIndex).toBeLessThan(upIndex);
    expect(calls[verifyIndex].args).toContain("--if-enabled");
    expect(
      calls.some(
        (c) =>
          c.args.includes("down") ||
          c.args.includes("prune") ||
          c.args.includes("restart"),
      ),
    ).toBe(false);
    for (const call of calls.filter((c) => c.args.includes("stop"))) {
      expect(call.args).toContain("--project-name");
      expect(call.args[call.args.indexOf("--project-name") + 1]).toMatch(
        /^portfolio-production-/,
      );
    }
    expect(
      await readFile(join(shared, "gateway", "Caddyfile.gateway"), "utf8"),
    ).toBe(
      "# Shared routes stay intact\nimport /etc/caddy/portfolio/*.caddy\n",
    );
    const route = await readFile(
      join(root, "gateway", "production.caddy"),
      "utf8",
    );
    expect(route).toContain(
      fail || smtpFail
        ? "PREVIOUS PORTFOLIO ROUTE"
        : "portfolio-production-green:3000",
    );
    expect(
      (
        await readFile(join(root, "releases", "production.current"), "utf8")
      ).trim(),
    ).toBe(fail || smtpFail ? "blue" : "green");
    if (!fail && !smtpFail)
      for (const url of [
        "https://afrimed.space/",
        "https://lyvora.afrimed.space/health",
        "https://lyvora-preview.afrimed.space/health",
      ])
        expect(
          calls.some((c) => c.command === "curl" && c.args.includes(url)),
        ).toBe(true);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}
it("deploys only portfolio slots and verifies shared applications", async () => {
  await deployment(false);
});
it("restores the previous portfolio route when the candidate probe fails", async () => {
  await deployment(true);
});

it("stops rollout before starting services when SMTP authentication fails", async () => {
  await deployment(false, true);
});
