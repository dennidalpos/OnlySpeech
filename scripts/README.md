# Scripts

OnlySpeech scripts are Windows + PowerShell entrypoints. Use npm aliases for normal operation; support scripts under `scripts/support/` are implementation details unless a runbook names them directly.

## Official Commands

| area | command | use |
| --- | --- | --- |
| setup | `npm run bootstrap` | Validate Node.js/npm and restore dependencies with `npm ci` when needed. |
| setup | `npm run bootstrap -- -ForceRefresh` | Reinstall dependencies when `node_modules` is inconsistent. |
| dev | `npm run dev` | Start renderer, main compiler, and Electron watchers. |
| start | `npm run start` | Build stale source outputs and launch Electron locally. |
| start | `npm run start -- -SetupWizard` | Open the integrated setup wizard from source. |
| start | `npm run start -- -SetupWizard -WizardSection provider` | Open a supported wizard section: `stations`, `provider`, `languages`, `diagnostics`, or `license`. |
| test | `npm test` | Run Vitest excluding compiled Electron e2e. |
| test | `npm run test:e2e` | Compile and run Electron e2e coverage. |
| build | `npm run build` | Compile renderer and main process output. |
| check | `npm run gate -- -KeepOutputs -EnablePackagedAutomation` | Local production-readiness gate with retained outputs and packaged automation. |
| check | `npm run verify:repo -- -KeepOutputs -EnablePackagedAutomation` | Canonical CI/release verification command. |
| package | `npm run package` | Build public Windows installer, portable executable, and unpacked archive. |
| cleanup | `npm run clean` | Remove repo-local generated outputs while preserving dependencies, `.env`, workstation data, and autostart. |
| cleanup | `npm run clean:workstation` | Remove packaged workstation-local OnlySpeech state for support or reinstall. |
| release | `npm run release:evidence` | Write retained release metadata for existing package outputs. |
| release | `npm run release:compliance` | Write third-party notices and SBOM artifacts. |
| release | `npm run release:customer-bundle` | Assemble the buyer-facing bundle from existing package outputs and docs. |

There is no checked-in lint or format command.

## Production Gate

Use this sequence before a Windows deployment candidate:

1. `npm run bootstrap`
2. `npm test`
3. `npm run test:e2e`
4. `npm run gate -- -KeepOutputs -EnablePackagedAutomation`
5. `npm run package`
6. Target-workstation activation, commissioning, live speech, autostart, upgrade, and rollback validation.

The repository gate is necessary but not sufficient for production. Real hardware, live credentials, retained installer comparison, and logon evidence are still required.

## Troubleshooting

| symptom | action |
| --- | --- |
| Dependency install is stale or broken. | Run `npm run bootstrap -- -ForceRefresh`. |
| Source app opens setup instead of kiosk. | Finish setup or verify the source `.env` runtime configuration. |
| Display or microphone blockers remain. | Run `npm run start -- -SetupWizard -WizardSection stations`. |
| Provider validation fails. | Check `TRANSLATION_PROVIDER`, provider credentials, region/model values, network access, and selected languages. |
| Packaged workstation has stale local state. | Run `npm run clean:workstation`, then provision again. |
| Windows N cannot capture speech. | Install Microsoft Media Feature Pack and reboot. |

The detailed script inventory and side-effect map is [script.md](script.md).
