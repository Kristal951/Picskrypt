import { normalizeStep, type OnboardingStep } from "@/lib/onboarding";

export const SELF_SELECT = {
  id: true,
  email: true,
  name: true,
  avatar: true,
  username: true,
  onboarded: true,
  onboardingStep: true,
} as const;

export function toSelfDto(u: {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  username: string | null;
  onboarded: boolean | null;
  onboardingStep: number | null;
}): {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  username: string | null;
  onboarded: boolean;
  onboardingStep: OnboardingStep;
} {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatar: u.avatar,
    username: u.username,
    onboarded: u.onboarded === true,
    onboardingStep: normalizeStep(u.onboardingStep),
  };
}
