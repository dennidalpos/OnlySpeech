# Packaged Activation And Commissioning Runbook

Use this page for the remaining real-workstation close-out that cannot be proven from repository-only automation.

This runbook covers:

- final packaged activation validation with real purchased activation material;
- final target-station commissioning evidence, including explicit `touch-input` closure when applicable to the target hardware.

## Preconditions

- a real packaged build exists under `artifacts/packages/`;
- the target Windows workstation is available with its real displays and any applicable touch hardware;
- the purchased customer email and activation code for that workstation are available;
- `artifacts/logs/activation-validation.json` has been refreshed with `npm run activation:template`;
- `artifacts/logs/target-station-validation.json` has been refreshed with `npm run commission:template`;
- the retained local generator workspace under `.local/activation-generator/` remains ignored and is not needed unless support must reproduce a non-production token outside Git.

## Activation Validation

Run these checks on the real packaged build, not on `npm start` source mode.
Refresh the retained activation checklist first if the file is missing or stale:

```powershell
npm run activation:template
```

| Scenario | Action | Expected result | Evidence to retain |
| --- | --- | --- | --- |
| Valid first activation | Start packaged app with no persisted activation state, enter the purchased email and code | Activation succeeds and the setup wizard or kiosk flow opens | Note packaged build path, plan shown by the UI, and the created `%LOCALAPPDATA%\\OnlySpeech\\config\\activation-state.json` file |
| Invalid code | Retry with a malformed or otherwise invalid code | Activation stays blocked and shows an invalid-code style error | Screenshot or operator note |
| Email mismatch | Use a valid code with the wrong email casing-normalized identity | Activation stays blocked and shows email mismatch | Screenshot or operator note |
| Startup blocking before activation | Delete `%LOCALAPPDATA%\\OnlySpeech\\config\\activation-state.json` and relaunch | Packaged startup returns to the activation window before wizard or kiosk startup | Operator note |
| Startup unlock after persisted activation | Reactivate, then relaunch without deleting local state | Packaged startup bypasses the activation gate and resumes normal flow | Operator note |
| Plan recognition | Validate the purchased plan rendered by the UI or support surface | Plan matches the signed claims for the delivered code | Operator note |
| Temporary-plan expiry | Validate a non-lifetime code whose expiry can be observed safely in a controlled test window | Expired code is rejected with an expired-style result | Operator note with timestamps |
| Lifetime plan | Validate a lifetime code if one exists for the release | No expiry is shown or enforced for the lifetime plan | Operator note |
| Reinstall with preserved profile | Reinstall or relaunch while preserving `%LOCALAPPDATA%\\OnlySpeech` | Activation stays unlocked | Operator note |
| Reinstall with removed profile | Remove `%LOCALAPPDATA%\\OnlySpeech\\config\\activation-state.json` or the full local profile, then relaunch | Activation is required again | Operator note |
| Clock rollback | After a successful activation, set the workstation clock backward by more than 5 minutes and relaunch | Activation is blocked with clock-rollback behavior | Operator note with before/after clock values |
| Copy-risk observation | Copy the activation state or activation code to a second workstation only if support or release validation explicitly authorizes it | Record whether the app accepts or rejects the copied material and treat the outcome as a release risk note | Risk note, not a buyer-facing claim |
Record the retained notes directly in `artifacts/logs/activation-validation.json` by updating:

- `validated_by` and top-level `notes` when known;
- each scenario `status` from `pending` to `passed`, `failed`, or `not_applicable`;
- `checked_at`, `evidence`, and per-scenario `notes` for any observed outcome.

The packaged runtime also enforces one local 15-day trial per workstation through the registry tombstone used by `src/main/trial-tombstone.ts`. That behavior is real, but the current `npm run activation:template` artifact does not expose it as a separate retained scenario. Treat it as a support observation unless the artifact generator is expanded later. If support must intentionally re-arm only the trial gate, use `scripts/internal/runtime/clear-trial-tombstone.ps1`. If support must wipe the entire packaged workstation profile, including `%LOCALAPPDATA%\OnlySpeech\.env`, activation state, secure secrets, logs, session data, and the trial tombstone, prefer `npm run clean:workstation`. The internal script path `scripts/internal/runtime/clear-local-workstation-data.ps1` remains the underlying fallback entrypoint.

## Commissioning Close-Out

The following target-station checks can be automated on the active workstation before the remaining manual close-out:

```powershell
npm run commission:automation
```

When the packaged workstation profile exists, `npm run commission:automation` reads `%LOCALAPPDATA%\OnlySpeech\.env`. Repo-root `.env` is only the fallback for source-workspace runs or explicit overrides.

This automation updates `artifacts/logs/target-station-validation.json` only for the checks it can really observe:

- `fullscreen-displays`
- `visitor-language-catalog-validation`
- `idle-clear`
- `hard-reset`

It does not close `microphone-side-mapping`, `provider-exchange-side-a`, or `provider-exchange-side-b`, which still require real operator confirmation on the commissioned station.

1. Run `npm run commission:template` if `artifacts/logs/target-station-validation.json` is missing or stale.
2. Update `artifacts/logs/target-station-validation.json` on the real target workstation:
   - fill `station_id`, `validated_by`, and `notes` when known;
   - change every completed check from `pending` to `passed`, `failed`, or `not_applicable`;
   - record `checked_at` and notes for any non-trivial outcome;
   - explicitly close `touch-input`.
3. Capture the final artifact with full evidence:

```powershell
npm run commission:handover
```

4. Confirm `artifacts/logs/commissioning-evidence.json` no longer reports fallback behavior:
   - `doctor.skipped` is `false`;
   - `runtime_logs.export_skipped` is `false`;
   - `target_station_validation.summary.pending` is `0`;
   - `remaining_target_station_checks` is empty.

## Tracking Notes

If this manual pass is being tracked in `PROJECT_STATUS.json`, close or update the relevant open task only after `artifacts/logs/activation-validation.json` and `artifacts/logs/commissioning-evidence.json` reflect the retained evidence that actually exists.

Do not claim signed-release, GitHub-hosted CI, or commercial-review completion unless those external bundles are retained too.

## Repository-Local Verification Before The Manual Pass

These checks are the local confidence floor before running the real workstation procedure:

- `npm test -- tests/runtime-paths.test.ts tests/activation-storage.test.ts tests/activation-validator.test.ts tests/activation-state.test.ts tests/bootstrap-flow.test.ts tests/activation-ui.test.tsx`
- `npm run compile`
- `npm run test:packaged-automation`

They do not replace the manual packaged pass; they only confirm that the repository automation surface is still coherent before the real close-out session.
