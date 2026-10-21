import { testimonialSchema } from "@/lib/models";
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
    const parsed = testimonialSchema.safeParse(await readSubmission(request));
    if (!parsed.success || parsed.data.website)
      throw new SubmissionError(400, "invalid");
    if (!hasSupabase()) throw new SubmissionError(503, "unavailable");
    const db = serviceClient();
    const { data: allowed, error: rateError } = await db.rpc(
      "take_rate_limit",
      {
        rate_key: rateKey(request, "testimonial"),
        max_attempts: 3,
        window_seconds: 3600,
      },
    );
    if (rateError) throw new SubmissionError(503, "unavailable");
    if (!allowed) throw new SubmissionError(429, "limited");
    const d = parsed.data;
    const { error } = await db.from("testimonial_submissions").upsert(
      {
        submission_id: d.submissionId,
        name: d.name,
        message: d.message,
        locale: d.locale,
      },
      { onConflict: "submission_id", ignoreDuplicates: true },
    );
    if (error) throw new SubmissionError(503, "unavailable");
    return Response.json(
      { ok: true },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return submissionResponse(e);
  }
}
