// Shared types for the onboarding wizard and its steps to avoid circular imports
export interface OnboardingData {
  name: string;
  bio: string;
  image: string | null;
  gender: "male" | "female" | null;
  country: string;
  postCode: string;
  languages: string[];
  timezone: string;
  subjects: string[];
  availability: Uint8Array | null;
}

export interface Prefill {
  name: string;
  image: string | null;
}
