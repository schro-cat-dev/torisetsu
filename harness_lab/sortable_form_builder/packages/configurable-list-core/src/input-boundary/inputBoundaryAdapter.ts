import type { BoundaryIssue } from "./types";

type AcceptedBoundaryResult = {
  ok: true;
  value: unknown;
  issues: readonly [];
};

type RejectedBoundaryResult = {
  ok: false;
  issues: ReadonlyArray<BoundaryIssue>;
};

type BoundaryResultLike = AcceptedBoundaryResult | RejectedBoundaryResult;
type AcceptedValue<Result extends BoundaryResultLike> = Extract<
  Result,
  { ok: true }
>["value"];
type RejectedIssue<Result extends BoundaryResultLike> = Extract<
  Result,
  { ok: false }
>["issues"][number];

export class InputBoundaryRejectedError<
  Issue extends BoundaryIssue = BoundaryIssue,
> extends Error {
  readonly issues: ReadonlyArray<Issue>;

  constructor(issues: ReadonlyArray<Issue>) {
    super("Input was rejected at the validation boundary.");
    this.name = "InputBoundaryRejectedError";
    this.issues = issues;
  }
}

export function createInputBoundaryAdapter<Result extends BoundaryResultLike>(
  filter: (input: unknown) => Result,
) {
  return Object.freeze({
    filter,
    require(input: unknown): AcceptedValue<Result> {
      const result = filter(input);
      if (!result.ok) {
        throw new InputBoundaryRejectedError<RejectedIssue<Result>>(
          result.issues as ReadonlyArray<RejectedIssue<Result>>,
        );
      }
      return result.value as AcceptedValue<Result>;
    },
  });
}
