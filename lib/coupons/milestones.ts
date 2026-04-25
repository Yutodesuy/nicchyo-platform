export const MILESTONE_STEPS = [1, 3, 5] as const;

export type MilestoneStep = (typeof MILESTONE_STEPS)[number];
export type MilestoneIssueReason = `milestone_${MilestoneStep}`;

export function isMilestoneStep(value: number): value is MilestoneStep {
  return (MILESTONE_STEPS as readonly number[]).includes(value);
}

export function getNextMilestone(stampCount: number): MilestoneStep | null {
  return MILESTONE_STEPS.find((step) => step > stampCount) ?? null;
}

export function getMilestoneIssueReason(step: MilestoneStep): MilestoneIssueReason {
  return `milestone_${step}` as MilestoneIssueReason;
}
