import { describe, expect, it } from "vitest";

import {
  getMilestoneIssueReason,
  getNextMilestone,
  isMilestoneStep,
} from "../../../lib/coupons/milestones";

describe("coupon milestones", () => {
  it("shares the same milestone sequence across helpers", () => {
    expect(getNextMilestone(0)).toBe(1);
    expect(getNextMilestone(1)).toBe(3);
    expect(getNextMilestone(4)).toBe(5);
    expect(getNextMilestone(5)).toBeNull();
    expect(isMilestoneStep(3)).toBe(true);
    expect(isMilestoneStep(2)).toBe(false);
    expect(getMilestoneIssueReason(5)).toBe("milestone_5");
  });
});
