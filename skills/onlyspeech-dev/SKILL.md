---
name: onlyspeech-dev
description: Guidance on OnlySpeech repository structure, development commands, build processes, and testing workflows.
---

# OnlySpeech Development Skill

This skill guides AI agents in developing, compiling, and testing the `OnlySpeech` application.

## 1. Component Boundaries & Rules

- **`src/main`**: Electron main process. Responsible for bootstrap, window lifecycle, system shortcuts, secure runtime secrets, and system integrations (like trial tombstones and registry validation).
- **`src/renderer`**: React-based operator and visitor UI.
  > [!CRITICAL]
  > Direct Node.js imports are strictly forbidden in the renderer. Communication with the main process must only happen via IPC interfaces exposed in `src/main/preload.ts`.
- **`src/shared`**: Shared contracts, Typescript interfaces, configuration schemas, and cryptographic validation structures.
- **`src/services`**: Audio management, Azure Speech, OpenAI Chat/TTS, and Ollama speech translation wrappers.

---

## 2. Common Development Commands

Use the following commands from the repository root:

- **Setup & Bootstrap**:
  ```powershell
  npm run bootstrap
  ```
- **Local Dev Server**:
  ```powershell
  npm run dev
  ```
- **Compile TypeScript & Build Assets**:
  ```powershell
  npm run build
  ```
- **Full Gate Verification (Lint, Types, Build, Tests)**:
  ```powershell
  npm run gate
  ```
- **Package Installer (Production release)**:
  ```powershell
  npm run package
  ```
- **Cleanup Workstation & Workspace**:
  ```powershell
  npm run clean
  npm run clean:reset
  ```

---

## 3. Testing Workflows

- **Unit and Integration Tests**:
  ```powershell
  npm run test
  ```
- **Electron End-to-End Tests**:
  ```powershell
  npm run test:e2e
  ```
- **Run Tests with Coverage**:
  ```powershell
  npm run test:coverage
  ```

---

## 4. Code Quality & Pre-Commit Cleanliness

Before completing any change, you must:
1. Verify the repository status:
   ```powershell
   git status --short
   ```
2. Run linting:
   ```powershell
   npm run lint
   ```
3. Run the compiler check:
   ```powershell
   npm run compile
   ```
