import { contactSchema } from "@/lib/models";
import { hasSupabase } from "@/lib/env";
import { serviceClient } from "@/lib/supabase/server";
import {
  readSubmission,
  rateKey,
  SubmissionError,
  submissionResponse,
} from "@/lib/submission";
export async function POST(request: Request) {
  try {
    const parsed = contactSchema.safeParse(await readSubmission(request));
    if (!parsed.success) throw new SubmissionError(400, "invalid");
    if (parsed.data.website) throw new SubmissionError(400, "invalid");
    if (!hasSupabase()) throw new SubmissionError(503, "unavailable");
    const { error } = await serviceClient().rpc("submit_contact", {
      payload: parsed.data,
      rate_key: rateKey(request, "contact"),
    });
    if (error)
      throw new SubmissionError(
        error.message.includes("rate_limited") ? 429 : 503,
        error.message.includes("rate_limited") ? "limited" : "unavailable",
      );
    return Response.json(
      { ok: true },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return submissionResponse(error);
  }
}
