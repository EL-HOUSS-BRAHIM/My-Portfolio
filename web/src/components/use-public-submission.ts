"use client";
import { useRef, useState, useSyncExternalStore } from "react";
import { SubmissionIdentity } from "@/lib/submission-identity";

type Status = "" | "success" | "error" | "invalid" | "limited" | "unavailable";
const subscribeReady = () => () => {};
const clientReady = () => true;
const serverReady = () => false;
export function usePublicSubmission(
  endpoint: "/api/contact" | "/api/testimonials",
) {
  const [state, setState] = useState<Status>("");
  const ready = useSyncExternalStore(subscribeReady, clientReady, serverReady);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const identity = useRef(new SubmissionIdentity());

  async function send(payload: Record<string, unknown>) {
    if (inFlight.current) return false;
    inFlight.current = true;
    setBusy(true);
    setState("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          submissionId: identity.current.forPayload(payload),
        }),
        signal: controller.signal,
      });
      if (response.ok) {
        setState("success");
        identity.current.clear();
        return true;
      }
      setState(
        response.status === 429
          ? "limited"
          : response.status === 400
            ? "invalid"
            : "unavailable",
      );
      // A definitive rejection can start fresh. Ambiguous service failures retain the ID.
      if (response.status >= 400 && response.status < 500)
        identity.current.clear();
      return false;
    } catch {
      setState("error");
      return false;
    } finally {
      clearTimeout(timeout);
      inFlight.current = false;
      setBusy(false);
    }
  }
  return { state, busy, ready, send, invalid: () => setState("invalid") };
}
