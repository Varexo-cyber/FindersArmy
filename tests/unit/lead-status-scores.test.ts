import { describe, expect, it } from "vitest";
import { businessCanTransition, pipelineIndex, validateBusinessTransition } from "@/lib/lead-status";
import { businessScore, finderScore, finderStanding } from "@/lib/scores";

describe("lead transitions", () => {
  it("lets businesses move forward through the pipeline", () => {
    expect(businessCanTransition("NEW", "CONTACTED")).toBe(true);
    expect(businessCanTransition("CONTACTED", "QUOTE_SENT")).toBe(true);
    expect(businessCanTransition("QUOTE_SENT", "WON")).toBe(true);
    expect(businessCanTransition("WON", "COMPLETED")).toBe(true);
  });

  it("does not let businesses invoice, pay, or move backwards", () => {
    expect(businessCanTransition("COMPLETED", "CONFIRMED")).toBe(false);
    expect(businessCanTransition("WON", "PAID")).toBe(false);
    expect(businessCanTransition("QUOTE_SENT", "NEW")).toBe(false);
    expect(businessCanTransition("INVOICED", "LOST")).toBe(false);
    expect(businessCanTransition("FRAUD", "NEW")).toBe(false);
  });

  it("requires a positive deal amount for WON", () => {
    expect(validateBusinessTransition({ from: "QUOTE_SENT", to: "WON" })).toBe("DEAL_AMOUNT_REQUIRED");
    expect(validateBusinessTransition({ from: "QUOTE_SENT", to: "WON", dealAmountCents: 0 })).toBe("DEAL_AMOUNT_REQUIRED");
    expect(validateBusinessTransition({ from: "QUOTE_SENT", to: "WON", dealAmountCents: 1.5 })).toBe("DEAL_AMOUNT_REQUIRED");
    expect(validateBusinessTransition({ from: "QUOTE_SENT", to: "WON", dealAmountCents: 250_000 })).toBeNull();
  });

  it("requires a reason for LOST", () => {
    expect(validateBusinessTransition({ from: "NEW", to: "LOST" })).toBe("LOST_REASON_REQUIRED");
    expect(validateBusinessTransition({ from: "NEW", to: "LOST", lostReason: "PRICE" })).toBeNull();
  });

  it("orders the pipeline", () => {
    expect(pipelineIndex("NEW")).toBe(0);
    expect(pipelineIndex("PAID_OUT")).toBe(8);
    expect(pipelineIndex("LOST")).toBe(-1);
  });
});

describe("scores", () => {
  it("gives new businesses the benefit of the doubt", () => {
    expect(businessScore({ respondedInTime: [false], updated: [], paidOnTime: [] })).toBe(100);
  });

  it("weights response, updates and payment", () => {
    expect(businessScore({ respondedInTime: [false, false, false, false], updated: [true, true, true], paidOnTime: [true] })).toBe(60);
    expect(businessScore({ respondedInTime: [true, true, true], updated: [true, true, true], paidOnTime: [false, false] })).toBe(70);
  });

  it("scores finders on spam rate once there is enough data", () => {
    expect(finderScore({ spamFlags: [true, true] })).toBe(100);
    expect(finderScore({ spamFlags: [true, false, false, false, false] })).toBe(80);
    expect(finderScore({ spamFlags: [true, true, true, false, false] })).toBe(40);
  });

  it("maps finder score to standing", () => {
    expect(finderStanding(80, 60, 35)).toBe("ACTIVE");
    expect(finderStanding(59, 60, 35)).toBe("WARNED");
    expect(finderStanding(34, 60, 35)).toBe("SUSPENDED");
  });
});
