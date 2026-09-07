import { describe, expect, it } from "vitest";
import * as publicApi from "../src";

describe("configurable-list-react public boundary", () => {
  it("exports the guarded renderer without exporting its internal bypass", () => {
    expect(publicApi.DetailLayoutRenderer).toBeTypeOf("function");
    expect("ValidatedDetailLayoutRenderer" in publicApi).toBe(false);
  });
});
