export const ONBOARDING_STEPS = 3;

export type OnboardingStep = 1 | 2 | 3;

export function normalizeStep(n: number | null | undefined): OnboardingStep {
  return (n === 2 || n === 3 ? n : 1) as OnboardingStep;
}

export const stepPath = (n: number) => `/onboarding/step-${n}`;

export function stepFromPath(pathname: string): OnboardingStep | null {
  const m = /^\/onboarding\/step-([1-3])\/?$/.exec(pathname);
  return m ? (Number(m[1]) as OnboardingStep) : null;
}

export function validateName(input: string): {
  name: string;
  error: string | null;
} {
  const name = input.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 50) {
    return { name, error: "Name must be 2 to 50 characters." };
  }
  return { name, error: null };
}
