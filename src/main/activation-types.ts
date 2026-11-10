export type ActivationPlan = "monthly" | "semiannual" | "annual" | "lifetime" | "trial";

export interface ActivationClaims {
  keyId: string;
  email: string;
  plan: ActivationPlan;
  issuedAt: string;
  expiresAt: string | null;
}
