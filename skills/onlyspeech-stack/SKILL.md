---
name: onlyspeech-stack
description: Detailed guidelines on the OnlySpeech tech stack (Electron 42, React 19, TS 6, Vite 8, Vitest 4, Azure Cognitive Speech SDK, OpenAI, Ollama).
---

# OnlySpeech Technical Stack Guideline

This skill provides comprehensive instructions, constraints, and official reference patterns for the OnlySpeech technical stack.

---

## 1. Node.js & TypeScript 6 Configuration

OnlySpeech uses a hybrid compilation scheme to support both Node-native Electron main process capabilities and web-compliant React renderer bundles.

### Main Process & Services (`src/main`, `src/services`, `src/tools`)
- **tsconfig**: Exclusively governed by [tsconfig.main.json](file:///d:/GITHUB/OnlySpeech/tsconfig.main.json).
- **Module Resolution**: `NodeNext`.
- **Target**: `ES2022` with `NodeNext` modules.
- **Convention**: Imports of local TS modules must include the `.js` extension (e.g., `import { X } from "./file.js"`).
- **Types**: Typed with `@types/node` and `electron`.

### Renderer Process & Shared Code (`src/renderer`, `src/shared`, `tests`)
- **tsconfig**: Governed by [tsconfig.json](file:///d:/GITHUB/OnlySpeech/tsconfig.json).
- **Module Resolution**: `Bundler` (Vite compatible).
- **Target**: `ESNext` / `ES2022`.
- **Convention**: Relative imports omit file extensions, and bundler resolves them. No native Node modules or relative Node imports are allowed.

---

## 2. Electron 42 Main-Renderer Sandbox

OnlySpeech enforces high security boundaries by completely sandboxing the React renderer windows.

### Preload Script & IPC Boundary
- All communication must flow through the preload bridge in [preload.ts](file:///d:/GITHUB/OnlySpeech/src/main/preload.ts).
- Direct imports of Node.js modules (like `fs`, `path`, `child_process`) or Electron modules (like `ipcRenderer` directly) in the React components are strictly prohibited.
- `contextBridge.exposeInMainWorld("onlySpeech", api)` exports a secure api surface typed in [onlyspeech-api.ts](file:///d:/GITHUB/OnlySpeech/src/shared/onlyspeech-api.ts).

### Multi-Display Window Positioning
- Managed via [display-manager.ts](file:///d:/GITHUB/OnlySpeech/src/main/display-manager.ts) using the Electron `screen` module.
- Layout coords are calculated using virtual coordinates. The primary screen top-left is `(0, 0)`.
- Use `screen.getAllDisplays()` to identify boundaries of external screens and map them to sides `A` and `B` using `bounds` coordinates.
- Listen to screen additions and deletions dynamically:
  ```typescript
  screen.on("display-added", callback);
  screen.on("display-removed", callback);
  screen.on("display-metrics-changed", callback);
  ```

---

## 3. React 19 Renderer Architecture

- **React 19 Core**: Strictly component-based composition. Since the kiosk renders two interfaces (Operator and Visitor), UI screens are isolated under [src/renderer/operator](file:///d:/GITHUB/OnlySpeech/src/renderer/operator).
- **No Tailwind CSS**: Styled exclusively using Vanilla CSS. Global and component styles are located under `styles` subdirectories.
- **React 19 Strict Mode**: Keeps rendering predictable and highlights unexpected side effects during hot-reload.

---

## 4. Vite 8 & LightningCSS Bundling

- **Configuration**: Configured in [vite.config.ts](file:///d:/GITHUB/OnlySpeech/vite.config.ts).
- **LightningCSS**: Used for robust, performant CSS transformations and minification.
- **Multi-page input**: Vite builds separate bundles for the main kiosk app (`index.html`) and the activation gate app (`activation.html`).
- **Dev Port**: Runs strictly on `127.0.0.1:5173`. The main process waits for this port to become available (`wait-on tcp:5173`) before launching Electron.

---

## 5. Speech Translation Services

OnlySpeech integrates three providers configured dynamically via `.env`:

### A. Azure Cognitive Services Speech SDK (`microsoft-cognitiveservices-speech-sdk` v1.50.x)
- Used for low-latency live continuous speech recognition.
- Uses `SpeechConfig` and `TranslationRecognizer` for real-time streaming:
  ```typescript
  import * as sdk from "microsoft-cognitiveservices-speech-sdk";
  const translationConfig = sdk.SpeechTranslationConfig.fromSubscription(key, region);
  translationConfig.speechRecognitionLanguage = sourceLang;
  translationConfig.addTargetLanguage(targetLang);
  const recognizer = new sdk.TranslationRecognizer(translationConfig, audioConfig);
  ```
- Continuously listens to speech recognition events (`recognizing`, `recognized`, `canceled`).

### B. ChatGPT API (OpenAI)
- Utilizes `gpt-4o-mini` for speech turn translations and `whisper-1` for audio transcription.
- Translates conversational context chunks by issuing fetch POST queries to OpenAI's endpoint.
- Uses strict JSON schemas for structured language response normalization.

### C. Ollama Local Integration
- Integrates local open-source LLMs (default `gemma3`) via `http://localhost:11434/api/chat` or `api/generate`.
- Supports raw or streaming responses. Streams must parse line-by-line NDJSON format.

---

## 6. Testing & Quality Gates (Vitest 4)

- **Vitest 4**: Runs fast, concurrent execution. Configured in [vitest.config.ts](file:///d:/GITHUB/OnlySpeech/vitest.config.ts).
- **Unit/Integration Tests**: Run `npm test`. Matches all files under `tests/**/*.test.ts` except E2E.
- **Electron E2E Tests**: Run `npm run test:e2e`. Boots the full Electron binary and validates UI integration and IPC channels using playwright-style window automation.
- **Coverage limits**: Coverage target configured for statements (75%), branches (65%), functions (75%), and lines (75%).
