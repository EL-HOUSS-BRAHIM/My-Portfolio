// An uncertain retry keeps its identity; edited content is a distinct submission.
export class SubmissionIdentity {
  private current: { key: string; id: string } | null = null;

  forPayload(payload: Record<string, unknown>) {
    const key = JSON.stringify(payload);
    if (this.current?.key !== key)
      this.current = { key, id: crypto.randomUUID() };
    return this.current.id;
  }

  clear() {
    this.current = null;
  }
}
