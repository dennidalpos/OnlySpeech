---
name: onlyspeech-commissioning
description: Guidance on OnlySpeech target-workstation activation, autostart setup, manual verification checklists, and commissioning close-out evidence.
---

# OnlySpeech Commissioning & Validation Skill

This skill guides AI agents in verifying target-workstation activation, autostart registry behavior, and commissioning close-out evidence.

## 1. Preconditions for Commissioning

Before starting the workstation close-out, ensure that:
- A packaged build has been compiled (`npm run package`), yielding outputs under `artifacts/packages/`.
- The target Windows workstation is reachable with displays and touch hardware.
- The customer email and activation code are available.
- Validation template files have been refreshed using:
  ```powershell
  npm run activation:template
  npm run commission:template
  npm run commission:closeout-template
  ```

---

## 2. Activation Validation Scenarios

Verify these scenarios on the packaged build (not source mode). Update status from `pending` to `passed`, `failed`, or `not_applicable` in `artifacts/logs/activation-validation.json`:

- **Valid first activation**: Enter purchased email and code -> checks if activation state matches claims and creates `%LOCALAPPDATA%\OnlySpeech\config\activation-state.json`.
- **Invalid code / Email mismatch**: Ensure bad codes/emails are blocked with clear error states.
- **Startup blocking**: Delete `activation-state.json` and ensure it blocks startup, prompting the user.
- **Clock rollback**: Changing local workstation clock backward by > 5 minutes blocks kiosk runtime.
- **Trial gate reset**: If necessary, re-arm the trial gate via `scripts/support/runtime/clear-trial-tombstone.ps1`.
- **Workstation wipe**: Use `npm run clean:workstation` to wipe all config, state, registry trial tombstone, and logs.

---

## 3. Packaged Autostart Validation

Validate automatic startup setup via HKCU Run key:
- **Registry path**: `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`
- **Value name**: `OnlySpeech`
- **Target**: Path to packaged `OnlySpeech.exe`.
- **Flow**: Enable in setup wizard, verify Run entry is created, reboot to confirm launch, disable in wizard, and verify registry entry is removed.
- Record outcomes under `autostart.scenarios` in `artifacts/logs/packaged-closeout-validation.json`.

---

## 4. Commissioning Close-Out & Handover

Run close-out automation on the target workstation:
```powershell
npm run commission:automation
```
This updates `artifacts/logs/target-station-validation.json` for checks it can observe (`fullscreen-displays`, `visitor-language-catalog-validation`, `idle-clear`, `hard-reset`).

- **Manual Verification**: Manually verify and close `microphone-side-mapping`, provider exchanges, and `touch-input`.
- **Handover Artifact Assembly**: Run the handover command to compile all evidence:
  ```powershell
  npm run commission:handover
  ```
- **Check Evidence**: Confirm `artifacts/logs/commissioning-evidence.json` contains no skipped steps or pending checks.
