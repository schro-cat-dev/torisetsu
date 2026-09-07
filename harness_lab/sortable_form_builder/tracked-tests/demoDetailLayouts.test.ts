import { describe, expect, it } from "vitest";
import { filterDetailLayoutConfig } from "@torisetsu/configurable-list";
import { collectionDefinitions } from "../src/demo/collectionDefinitions";

describe("demo detail layouts", () => {
  it.each(Object.entries(collectionDefinitions))(
    "%s layout passes the shared detail filter",
    (_collectionId, definition) => {
      const result = filterDetailLayoutConfig(
        definition.display.detailLayout,
        definition.fields,
      );

      expect(result).toMatchObject({ ok: true, issues: [] });
    },
  );
});
