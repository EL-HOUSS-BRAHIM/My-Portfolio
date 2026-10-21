import { createHmac, randomUUID } from "node:crypto";
import { siteUrl } from "./env";
export class SubmissionError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}
export async function readSubmission(request: Request) {
  if (request.headers.get("origin") !== new URL(siteUrl()).origin)
    throw new SubmissionError(403, "origin");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new SubmissionError(415, "content_type");
  const stream = request.body?.getReader();
  if (!stream) throw new SubmissionError(400, "invalid");
  let total = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await stream.read();
    if (done) break;
    total += value.byteLength;
    if (total > 16384) {
      await stream.cancel();
      throw new SubmissionError(413, "too_large");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new SubmissionError(400, "invalid");
  }
}
export function rateKey(request: Request, endpoint: string) {
  const secret = process.env.RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32)
    throw new SubmissionError(503, "unavailable");
  const ip = request.headers.get("x-portfolio-client-ip") || "local";
  return createHmac("sha256", secret).update(`${endpoint}:${ip}`).digest("hex");
}
export function submissionResponse(error: unknown) {
  const id = randomUUID();
  const status = error instanceof SubmissionError ? error.status : 503;
  const code = error instanceof SubmissionError ? error.code : "unavailable";
  if (status >= 500)
    console.error(
      JSON.stringify({ event: "submission_failed", requestId: id }),
    );
  return Response.json(
    { ok: false, code, requestId: id },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...(status === 429 ? { "Retry-After": "3600" } : {}),
      },
    },
  );
}
