# OnlySpeech AI Agent Skills

This directory contains workspace-specific skills for Google Antigravity (and other AI agents supporting custom skills).

These skills contain critical context, conventions, architecture guidelines, and instructions that the AI agent reads before writing code or suggesting changes.

## Available Skills

- **[onlyspeech-dev](onlyspeech-dev/SKILL.md)**: Repository structure, common development commands, test scripts, and gate checks.
- **[onlyspeech-licensing](onlyspeech-licensing/SKILL.md)**: Security guidelines, cryptographic validation rules (Ed25519), and licensing system constraints.
- **[onlyspeech-stack](onlyspeech-stack/SKILL.md)**: Deep technical guidelines for Electron 42, React 19, TS 6, Vite 8, Vitest 4, Azure Speech SDK, OpenAI, and Ollama integration.
- **[onlyspeech-commissioning](onlyspeech-commissioning/SKILL.md)**: Workstation licensing activation checklists, autostart configuration, and commissioning close-out evidence.
- **[onlyspeech-release](onlyspeech-release/SKILL.md)**: Packaging pipeline, signature validation, packaging audits, SBOM/compliance generation, and customer bundle assembly.
- **[onlyspeech-activation-generator](onlyspeech-activation-generator/SKILL.md)**: Local offline Ed25519 activation generator application and command-line usage.

---

## Installation & Setup on Other PCs

To load these skills in your local Antigravity environment, run the installer script from the root of the repository:

### PowerShell (Windows)
```powershell
.\scripts\install-skills.ps1
```

This script will automatically:
1. Create a `.agents` directory in the repository root if it does not exist.
2. Generate/update the `.agents/skills.json` configuration file.
3. Link the absolute path of this version-controlled `skills` directory so your AI agent loads them on startup.

## Updating Skills

Since the skills are version-controlled, any updates pulled from Git are automatically available to the agent on its next initialization. If you add a new skill directory (e.g. `skills/my-new-skill/SKILL.md`), it will be discovered automatically because of the path mapping in `.agents/skills.json`.
