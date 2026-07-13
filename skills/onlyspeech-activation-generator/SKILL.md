---
name: onlyspeech-activation-generator
description: Guidance on using the offline cryptographic activation generator to issue licenses and manage keys.
---

# OnlySpeech Offline Activation Generator Skill

This skill guides AI agents in using the offline activation generator located under `.local/activation-generator/`.

## 1. Environment & Security Boundaries

The offline activation generator is a local-only workflow. Files inside `.local/activation-generator/` are intentionally git-ignored and must never be committed to Git.
- **Private Key**: Saved locally to `private/ks1-private.pem` (Ed25519).
- **Public Key**: Corresponding public key is embedded in the application at `src/main/activation-public-keys.ts`.
- **Ledger Log**: Every license issued is appended as a line in `issuance-log.jsonl`.

---

## 2. Standalone UI Mode

Launch the local Electron generator UI using:
```powershell
powershell -ExecutionPolicy Bypass -File .local/activation-generator/launch-generator.ps1
```

The UI allows operators to:
1. **Generate Key Pairs**: Creates a new Ed25519 pair if `ks1-private.pem` is absent.
2. **Apply to Repository**: Direct confirmation-driven update to `src/main/activation-public-keys.ts` with the new public key.
3. **Issue License**: Fill in customer email and plan, then preview and generate the cryptographically signed activation token.
4. **Copy/Export**: Copy the generated code to the clipboard or export it to a file under `out/`.

---

## 3. CLI Mode

If you need to generate license tokens programmatically, run:
```powershell
node .local/activation-generator/issue-activation.mjs `
  --email buyer@example.com `
  --plan annual `
  --private-key .local/activation-generator/private/ks1-private.pem `
  --key-id ks1 `
  --output .local/activation-generator/out/buyer-example-com-annual.txt
```

### Options:
- `--email`: The customer email (case-normalized at runtime).
- `--plan`: The license plan (`trial`, `annual`, `lifetime`, etc.).
- `--private-key`: Absolute or relative path to the private key.
- `--key-id`: The identifier for the key (e.g. `ks1`).
- `--output`: Optional file path to export the license string.
