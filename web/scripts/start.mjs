import { cp, access } from "node:fs/promises";
import { spawn } from "node:child_process";
await access(".next/standalone/server.js");
await cp("public", ".next/standalone/public", { recursive: true });
await cp(".next/static", ".next/standalone/.next/static", { recursive: true });
const child = spawn(process.execPath, [".next/standalone/server.js"], {
  stdio: "inherit",
  env: {
    ...process.env,
    HOSTNAME: "0.0.0.0",
    PORT: process.env.PORT || "3000",
  },
});
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
