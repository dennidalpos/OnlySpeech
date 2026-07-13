---
name: onlyspeech-release
description: Guidance on OnlySpeech packaging, signing verification, packaging audits, compliance artifacts, and customer release bundle assembly.
---

# OnlySpeech Packaging & Release Skill

This skill guides AI agents in packaging the OnlySpeech desktop app, auditing dependencies, verifying signatures, generating compliance evidence, and assembling customer bundles.

## 1. Packaging Pipeline (Electron Builder)

OnlySpeech compiles Node-native main processes and React renderer bundles, packaging them via `electron-builder` as defined in `package.json`:
- **Output directory**: `artifacts/packages/`
- **Main command**:
  ```powershell
  npm run package
  ```
- **Targets**:
  - Windows NSIS installer (`OnlySpeech-<version>-x64-setup.exe`)
  - Portable executable (`OnlySpeech-<version>-x64-portable.exe`)
  - Unpacked application directory under `win-unpacked` (archived as a versioned `.zip`)
- **ASAR**: Enabled by default (`asar: true`).

---

## 2. Security Audits & Environment Signing

Release candidates must pass security verification:
- **Code Signing Check**:
  ```powershell
  npm run release:signing-check
  ```
  Verifies required Windows signing environment variables are configured. Can pass with warnings in local environments if unsigned, but real releases require valid signatures.
- **Packaging Audit**:
  ```powershell
  npm run audit:packaging
  ```
  Ensures no forbidden development modules or unauthorized files are packaged into the ASAR file.

---

## 3. Compliance and Release Evidence

Before ship approval, the agent must generate official compliance and metadata logs:
- **Release Evidence**:
  ```powershell
  npm run release:evidence
  ```
  Writes package details and environment metadata to `artifacts/logs/release-evidence.json`.
- **Compliance Generation**:
  ```powershell
  npm run release:compliance
  ```
  Generates `third-party-notices.json` and a Software Bill of Materials (SBOM) `sbom.cdx.json` under `artifacts/logs/`.

---

## 4. Customer Bundle Assembly

Once all packages and logs are ready, assemble the final customer bundle:
```powershell
npm run release:customer-bundle
```
This script:
- Copies installer, portable executables, and zipped unpacked builds from `artifacts/packages/` to the target customer bundle path.
- Merges buyer-facing documentation (`docs/customer-bundle/*`) and compliance files.
- Includes generated evidence logs only if they already exist under `artifacts/logs/`.
