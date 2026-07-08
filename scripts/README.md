# Scripts

OnlySpeech scripts are Windows + PowerShell entrypoints. Run commands from the repository root. Use npm aliases for normal operation; support scripts under `scripts/support/` are implementation details unless a runbook names them directly.

## Official Commands

| area | command | use |
| --- | --- | --- |
| setup | `npm run bootstrap` | Validate Node.js/npm and restore dependencies with `npm ci` when needed. |
| setup | `npm run bootstrap -- -ForceRefresh` | Reinstall dependencies when `node_modules` is inconsistent. |
| setup | `.\scripts\install-skills.ps1` | Configure AI agent skills for this workspace (creates `.agents/skills.json`). |
| dev | `npm run dev` | Start renderer, main compiler, and Electron watchers. |
| start | `npm run start` | Build stale source outputs and launch Electron locally. |
| start | `npm run start -- -Smoke -SmokeTimeoutMs 8000` | Build stale outputs and verify the source Electron runtime stays alive for the smoke window. |
| start | `npm run start -- -SetupWizard` | Open the integrated setup wizard from source. |
| start | `npm run start -- -SetupWizard -WizardSection provider` | Open a supported wizard section: `stations`, `provider`, `languages`, `diagnostics`, or `license`. |
| test | `npm test` | Run Vitest excluding compiled Electron e2e. |
| test | `npm run test:coverage` | Enforce coverage thresholds for activation, IPC, runtime configuration, providers, and setup persistence. |
| check | `npm run lint` | Run ESLint across TypeScript, React, and JavaScript sources and tests. |
| test | `npm run test:e2e` | Compile and run Electron e2e coverage. |
| build | `npm run build` | Compile renderer and main process output. |
| check | `npm run gate -- -KeepOutputs -EnablePackagedAutomation` | Local production-readiness gate with retained outputs and packaged automation. |
| check | `npm run gate -- -RefreshDependencies -KeepOutputs -EnablePackagedAutomation` | Same gate with a forced deterministic dependency refresh. |
| check | `npm run verify:repo -- -KeepOutputs -EnablePackagedAutomation` | Canonical CI/release verification command. |
| package | `npm run package` | Build public Windows installer, portable executable, and unpacked archive. |
| cleanup | `npm run clean` | Remove repo-local generated outputs while preserving dependencies, `.env`, workstation data, and autostart. |
| cleanup | `npm run clean:workstation` | Remove packaged workstation-local OnlySpeech state for support or reinstall. |
| release | `npm run release:evidence` | Write retained release metadata for existing package outputs. |
| release | `npm run release:compliance` | Write third-party notices and SBOM artifacts. |
| release | `npm run release:customer-bundle` | Assemble the buyer-facing bundle from existing package outputs and docs. |
| collateral | `npm run docs:social-assets` | Capture the five-step demo flow and generate 9:16 and 4:5 campaign assets under `social_assets/`. |

The checked quality surface is ESLint, TypeScript build, Vitest, Electron e2e, packaging audit, PowerShell script tests, and the Windows gate.

## Production Gate

Use this sequence before a Windows deployment candidate:

1. `npm run bootstrap`
2. `npm test`
3. `npm run test:e2e`
4. `npm run gate -- -KeepOutputs -EnablePackagedAutomation`
5. `npm run package`
6. `npm run release:evidence`
7. `npm run release:compliance`
8. `npm run release:customer-bundle`
9. Target-workstation activation, commissioning, live speech, autostart, and fresh install/uninstall validation.

The repository gate is necessary but not sufficient for production. Real hardware, live credentials, packaged install/uninstall, and logon evidence are still required.

## Troubleshooting

| symptom | action |
| --- | --- |
| Dependency install is stale or broken. | Run `npm run bootstrap -- -ForceRefresh`. |
| Source app opens setup instead of kiosk. | Finish setup or verify the source `.env` runtime configuration. |
| Demo mode stays on language selection. | Run `npm run build`, then `npm run start`; verify `APP_MODE=demo` and that both display windows receive runtime state. |
| Display or microphone blockers remain. | Run `npm run start -- -SetupWizard -WizardSection stations`. |
| Provider validation fails. | Check `TRANSLATION_PROVIDER`, provider credentials, region/model values, network access, and selected languages. |
| Gate fails at test. | Run `npm test` directly and fix the failing Vitest file before rerunning the gate. |
| Gate fails at packaging audit. | Run `npm audit --audit-level=moderate` and `npm run audit:packaging`, then remediate or formally accept findings. |
| Packaged workstation has stale local state. | Run `npm run clean:workstation`, then provision again. |
| Windows N cannot capture speech. | Install Microsoft Media Feature Pack and reboot. |

The detailed script inventory and side-effect map is [script.md](script.md).
