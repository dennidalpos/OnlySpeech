# AGENTS.md — OnlySpeech Repository Instructions

Repository-specific instructions for Codex / AI Agents.

OnlySpeech is a Windows-first Electron desktop translation kiosk for two-sided live speech translation, utilizing an operator-facing display and a visitor-facing display. It is proprietary software.

Primary local environment: **Windows + PowerShell**.

Use repository conventions when they are clear. Treat the app as a fresh product by default: remove obsolete/legacy paths when they block clarity, but keep changes focused, verifiable, and limited to the requested task.

---

## 1. Priorities

1. Preserve user work.
2. Make the smallest correct repository change, unless the user explicitly asks for cleanup/removal of legacy code.
3. Maintain and respect the cryptographic licensing system.
4. Keep the repository clean and navigable.
5. Follow existing repository conventions.
6. Verify with available repository checks (Vitest, ESLint, Electron E2E, packaging audit).
7. Keep `PROJECT_STATUS.json` as a todo-only file when present or requested.
8. Report changes, checks, and remaining uncertainty.

Do not change unrelated files. Do not introduce dependencies, public API changes, config/deployment changes, broad refactors, migrations, or destructive operations unless the task clearly requires them. Destructive cleanup may remove obsolete repo code or generated outputs when requested, but never use destructive Git operations unless explicitly requested.

Do not claim a check passed unless it was actually run and passed.

---

## 2. Fresh project policy

Treat OnlySpeech as fresh/greenfield unless the user explicitly says it must integrate with legacy systems or preserve an installed production contract.

Do not add legacy compatibility layers, migration scaffolding, deprecated patterns, transitional folder names, backward-compatibility shims, historical cleanup work, or assumptions about previous production users/data/APIs.

Prefer current conventions, clean architecture, minimal structure, and only the files needed for the requested scope. When removing legacy, remove stale references, docs, scripts, tests, and generated assumptions in the same change.

---

## 3. Windows-first rules

Use PowerShell-compatible commands unless repository evidence requires another shell, container, CI image, or deployment target.

Assume local development is Windows. Avoid local assumptions about Bash, WSL, GNU-only flags, `/tmp`, `/home`, `chmod`, `sed -i`, `rm -rf`, or Unix-only path separators.

Use repository-relative paths, quote paths that may contain spaces, avoid hardcoded absolute paths, and prefer cross-platform path APIs in code.

---

## 4. Workflow

For implementation tasks:

1. Inspect only files needed for the requested change, including applicable local instructions and nearby patterns.
2. Check the working tree before editing:

   ```powershell
   git status --short
   ```

3. Do not overwrite unrelated uncommitted user changes.
4. Implement the smallest production-quality change.
5. Add or update tests when behavior changes and a test framework exists.
6. Update docs only when setup, commands, behavior, public API, deployment, scripts, or structure change.
7. Run the most relevant available checks.
8. Perform a cleanliness check before the final response.

For read-only tasks, do not modify files. Report findings, affected areas, recommended fixes, and review limits.

---

## 5. Cleanliness check

Before the final response for implementation tasks, verify that:

- unrelated files were not changed;
- new files are in the correct responsibility folder;
- generated, temporary, debug, build, report, or log files were not left in source folders;
- stale references were not left after renames or splits;
- duplicate scripts, configs, assets, or docs were not introduced;
- `.gitignore` covers local/generated outputs when appropriate.

Minimum commands when available:

```powershell
git status --short
git ls-files
```

Then run relevant project-native checks: format, lint, typecheck, tests, build, or security checks. State why any relevant check was not run.

---

## 6. `PROJECT_STATUS.json`

`PROJECT_STATUS.json` is optional unless already present or explicitly requested.

When it exists, it must contain **only current incomplete todo tasks**.

Allowed schema:

```json
{
  "todos": [
    "Short actionable task"
  ]
}
```

Rules:

- Remove completed, obsolete, duplicated, invalidated, or historical items.
- Do not store completed work, prompt/chat history, secrets, credentials, personal data, check results, decisions, assumptions, risks, blockers, timestamps, changelog entries, or status notes.
- Prefer fewer accurate todos over many stale todos.
- Do not update it for read-only tasks unless requested.

---

## 7. Structure and files

Use the existing structure when coherent. For new or unclear areas, start minimal and add folders only when real responsibilities exist.

Keep each source file focused on one responsibility. Split files only when responsibilities are mixed or maintenance is clearly worse without a split. Do not perform large unrelated splits.

### OnlySpeech Component Boundaries:
- `src/main`: Electron main process (bootstrap, window management, IPC, secure secrets).
- `src/renderer`: React-based UI for operator and visitor surfaces. Do not use Node.js direct imports in the renderer; communicate with the main process exclusively via IPC preloads.
- `src/shared`: Shared contracts, config schemas, language definitions, and licensing schemas.
- `src/services`: Audio devices, speech translation services (Azure Speech, OpenAI Chat/TTS, Ollama).
- `src/tools`: Setup-wizard HTML/preload fragments and helper output definitions.
- `.local/activation-generator`: Standalone local Electron application & CLI for cryptographic trial and license token generation.
- `tests`: Structured unit, integration, and E2E verification suites split into responsibility folders (`main/`, `renderer/`, `scripts/`, `services/`, `shared/`) with `electron-e2e.test.ts` at the root.

Avoid vague folders like `misc`, `stuff`, `old`, `new`, `final`, `temp2`, `backup`; avoid vague files like `utils.*`, `helpers.*`, `common.*`, `manager.*`, or unqualified `service.*` unless already established by the repository.

`index.*` files should contain exports, framework-required entrypoints, or very small composition code; not substantial implementation logic.

---

## 8. Scripts

Use repository-native scripts first.

When adding Windows-first local scripts, prefer PowerShell wrappers under `scripts/`.

Scripts must run from the repository root, validate required tools, fail with non-zero exit codes on errors, and avoid duplicating an existing script. Keep public scripts thin; put shared script logic in `scripts/support/` when needed.

Update `scripts/README.md` when public scripts are added, removed, or renamed.

Script analysis and cleanup expectations:

- Prefer the public npm aliases in `package.json` for normal verification.
- For a full script cycle after cleanup, start with `npm run clean`, then run syntax checks for all `scripts/**/*.ps1` and `scripts/**/*.mjs`.
- When available, use `Invoke-ScriptAnalyzer -Severity Error` for PowerShell scripts. Treat warnings as review items unless they indicate a real runtime defect.
- Use `npm run start -- -Smoke -SmokeTimeoutMs 8000` for public source smoke validation.
- Do not run `docs:screenshots` and `docs:social-assets` in parallel because both compile into `dist/renderer` and Windows file locks can create false failures.
- `release:tag-check` requires a release tag and may fail correctly on an untagged working tree.
- `release:signing-check` can pass with optional-signing warnings when signing environment variables are absent.

---

## 9. Verification

When behavior changes, add or update tests using the existing framework (Vitest).

- Use `npm test` to run local tests.
- Use `npm run test:e2e` for Electron end-to-end tests.
- Use `npm run gate -- -KeepOutputs -EnablePackagedAutomation` for production gate verification.

If no test framework exists, do not install one automatically unless required. Provide a practical manual verification path instead.

Run relevant available checks and report exact commands and results. Do not stop at the first failed check if useful static review can continue.

---

## 10. Security and dependencies

Never create, print, commit, or expose secrets.

Use `.env.example` for required environment variables. Do not put credentials, private keys, tokens, passwords, or personal data into docs, logs, examples, or status files.

Validate external input, escape output where required, use parameterized database queries, and avoid logging sensitive data.

Before adding a dependency, check whether the repository already has a suitable dependency. Prefer the standard library or existing utilities. Respect the existing package manager and lockfile. Do not add dependencies only for convenience.

---

## 11. Git hygiene

Inspect the working tree before editing. Do not overwrite user changes.

Avoid destructive Git operations: `git reset --hard`, `git clean -fd`, force pushes, branch deletion, and history rewriting.

Only stage or commit when explicitly requested.

---

## 12. Licensing and Activation Safeguards

OnlySpeech uses a strict, proprietary offline cryptographic licensing and activation system. To preserve it:

1. **Cryptographic Validation**: Do not modify or bypass the verification logic in `src/main/activation-validator.ts` (which validates Ed25519 signed activation tokens against public keys), `src/main/activation-state.ts`, or `src/main/activation-flow.ts`.
2. **No Bypasses or Mocks**: Never introduce mock licenses, bypasses, or hardcoded success states in production pathways. The activation gate must block the kiosk runtime unless a valid trial is active or a cryptographically signed license is successfully loaded and validated.
3. **Trial Tombstone & Expiry Integrity**: Preserve trial expiration logic, rollback/time-drift checking (`clock-rollback`), and the registry-based trial tombstone persistence to prevent trial reuse.
4. **Setup Wizard & License Removal**: Keep license management intact within the Setup Wizard. The operator must only be able to clear or replace the license through official setup pathways, validating input before calling the backend.
5. **License Keygen & Generator**: The license key generation script (`scripts/license-keygen.ps1`) and the offline activation generator located under `.local/activation-generator/` must remain untouched and fully operational.

---

## 13. Final response

For implementation tasks, include:

- what changed;
- files changed;
- checks run and results;
- cleanliness result;
- `PROJECT_STATUS.json` todo update, if applicable;
- remaining risks, blockers, or next steps.

For review-only tasks, include findings by severity, affected files/areas, suggested fixes, assumptions, and review limits.

Be factual and concise. Do not claim production readiness unless relevant checks passed or limitations are clearly stated.

---

## 14. Workspace Custom Skills

Workspace-specific AI agent skills are stored under the version-controlled `skills/` directory.

### Available Skills:
- `onlyspeech-dev`: Development commands, workflows, test runs, and quality checks.
- `onlyspeech-licensing`: Ed25519 cryptographic token validation rules, trials, and clock rollback checking.
- `onlyspeech-stack`: Electron 42, React 19, TS 6 module resolution, Vite 8/LightningCSS, speech providers.
- `onlyspeech-commissioning`: Target-station validation checklists, autostart registry configuration, and commissioning close-out reports.
- `onlyspeech-release`: Electron Builder packaging configuration, signing checks, package auditing, SBOM, and customer bundle assembly.
- `onlyspeech-activation-generator`: Local offline Ed25519 activation generator UI & CLI usage.

### Installation:
To configure custom workspace skills on any local development PC, execute:
```powershell
.\scripts\install-skills.ps1
```
This automatically updates `.agents/skills.json` to link the version-controlled `skills/` folder.
