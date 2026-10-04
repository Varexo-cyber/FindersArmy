import { describe, expect, it } from "vitest";
import nl from "../../messages/nl.json";
import en from "../../messages/en.json";

function keys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" && !Array.isArray(v) ? keys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe("translations", () => {
  it("have the same keys in Dutch and English", () => {
    expect(keys(en).sort()).toEqual(keys(nl).sort());
  });
  it("contain no placeholder copy", () => {
    const all = JSON.stringify([nl, en]).toLowerCase();
    for (const banned of ["lorem", "ipsum", "todo", "revolutionair", "naadloos", "ontgrendel", "next-level", "empower"]) {
      expect(all).not.toContain(banned);
    }
  });
});
