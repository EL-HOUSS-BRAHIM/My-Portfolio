import { expect, it } from "vitest";
import { SubmissionIdentity } from "../src/lib/submission-identity";

it("keeps an uncertain retry stable but gives edited or subsequent messages a new identity", () => {
  const identity = new SubmissionIdentity();
  const original = {
    name: "Visitor",
    message: "A question about collaborating.",
  };
  const first = identity.forPayload(original);
  expect(identity.forPayload({ ...original })).toBe(first);
  const edited = identity.forPayload({
    ...original,
    message: "A different question about collaborating.",
  });
  expect(edited).not.toBe(first);
  identity.clear();
  expect(identity.forPayload(original)).not.toBe(first);
});
