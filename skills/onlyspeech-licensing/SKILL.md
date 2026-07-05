---
name: onlyspeech-licensing
description: Guidance on preserving and validating the proprietary offline cryptographic licensing and trial activation systems.
---

# OnlySpeech Cryptographic Licensing & Activation Skill

This skill contains the constraints and rules for maintaining the OnlySpeech licensing security boundaries.

## 1. Licensing & Activation Safeguards

OnlySpeech uses a strict, proprietary offline cryptographic licensing and activation system. You **MUST** strictly adhere to the following rules:

1. **Cryptographic Validation**:
   - Do not modify or bypass the verification logic in `src/main/activation-validator.ts` (which validates Ed25519 signed activation tokens against public keys), `src/main/activation-state.ts`, or `src/main/activation-flow.ts`.
2. **No Bypasses or Mocks**:
   - Never introduce mock licenses, bypasses, or hardcoded success states in production pathways. The activation gate must block the kiosk runtime unless a valid trial is active or a cryptographically signed license is successfully loaded and validated.
3. **Trial Tombstone & Expiry Integrity**:
   - Preserve trial expiration logic, rollback/time-drift checking (`clock-rollback`), and the registry-based trial tombstone persistence to prevent trial reuse.
4. **Setup Wizard & License Removal**:
   - Keep license management intact within the Setup Wizard. The operator must only be able to clear or replace the license through official setup pathways, validating input before calling the backend.
5. **License Keygen & Generator**:
   - The license key generation script (`scripts/license-keygen.ps1`) and the offline activation generator located under `.local/activation-generator/` must remain untouched and fully operational.

---

## 2. Key Verification Modules

- [activation-validator.ts](file:///d:/GITHUB/OnlySpeech/src/main/activation-validator.ts): Contains Ed25519 token signatures validation logic.
- [activation-state.ts](file:///d:/GITHUB/OnlySpeech/src/main/activation-state.ts): Keeps track of the current activation state.
- [activation-flow.ts](file:///d:/GITHUB/OnlySpeech/src/main/activation-flow.ts): Governs trial state transitions and license checks.
- [trial-tombstone.ts](file:///d:/GITHUB/OnlySpeech/src/main/trial-tombstone.ts): Registry persistence mapping to prevent trial tampering.

---

## 3. Operations

- **Generating a Test License**:
  Run `scripts/license-keygen.ps1` from a PowerShell terminal.
