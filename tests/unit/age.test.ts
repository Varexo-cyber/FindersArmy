import { describe, expect, it } from "vitest";
import { ageOn, checkFinderAge } from "@/lib/age";

const d = (s: string) => new Date(`${s}T00:00:00Z`);

describe("age", () => {
  it("counts the birthday itself", () => {
    expect(ageOn(d("2008-10-04"), d("2026-10-04"))).toBe(18);
    expect(ageOn(d("2008-10-05"), d("2026-10-04"))).toBe(17);
  });
  it("handles leap days", () => {
    expect(ageOn(d("2008-02-29"), d("2026-02-28"))).toBe(17);
    expect(ageOn(d("2008-02-29"), d("2026-03-01"))).toBe(18);
  });
  it("gates Finders at 18, or 16 with the flag", () => {
    expect(checkFinderAge(d("2008-10-04"), d("2026-10-04"), false)).toBe("OK");
    expect(checkFinderAge(d("2009-10-04"), d("2026-10-04"), false)).toBe("TOO_YOUNG");
    expect(checkFinderAge(d("2009-10-04"), d("2026-10-04"), true)).toBe("NEEDS_PARENT");
    expect(checkFinderAge(d("2011-01-01"), d("2026-10-04"), true)).toBe("TOO_YOUNG");
  });
});
