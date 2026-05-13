# Piano azione audit

## Priorita immediate

1. Chiudere il rosso E2E visitor non-Latin.
   - Gravita: alta.
   - Sforzo: medio.
   - Rischio se ignorato: flusso visitor localizzato e automation surface non affidabili.
   - Test dopo intervento: `npm run test:e2e`; aggiungere test mirato su RuntimeIssueBanner + visitor action selector.

2. Eliminare passaggio di segreti statici ai renderer.
   - Gravita: alta.
   - Sforzo: alto.
   - Rischio se ignorato: esfiltrazione credenziali provider da renderer compromesso.
   - Test dopo intervento: unit test IPC, test TTS/STT provider mock, e2e PTT demo/ChatGPT mocked.

3. Restringere permessi media Electron.
   - Gravita: alta.
   - Sforzo: medio.
   - Rischio se ignorato: qualunque contenuto nella defaultSession puo ottenere microfono.
   - Test dopo intervento: test media-permission-policy con URL/webContents autorizzati e negati; e2e wizard/runtime microphone probe.

4. Abilitare o giustificare sandbox Electron.
   - Gravita: alta.
   - Sforzo: medio/alto.
   - Rischio se ignorato: compromissione renderer con isolamento debole.
   - Test dopo intervento: build, e2e activation/wizard/runtime, verifica preload APIs.

## Completato

- `npm run audit:packaging` ora accetta lo stato corrente zero-vulnerability di `npm audit`.
  - Test eseguiti: `npm audit --json`, `npm run audit:packaging`, `npx vitest run tests/check-packaging-audit.test.ts`, `npm test`, `npm run build`.
  - Nota: `verify:repo` completo non e stato rieseguito perche invoca ancora `npm run test:e2e`, che resta rosso in AUD-006.

## Interventi consigliati in ordine

1. Stabilizzare automation selectors e UX del banner runtime.
2. Ripristinare il gate completo correggendo il test E2E rosso.
3. Definire threat model Electron: renderer trusted o untrusted.
4. Spostare provider secret usage nel main process.
5. Introdurre policy media per finestra/origin.
6. Aggiungere limiti a `audioBase64`, MIME allowlist, durata massima PTT e rate limit.
7. Decidere se `REQUIRED_MICROPHONES` e vincolo o suggerimento; rendere il fallback one-mic esplicito.
8. Aggiungere rate limit setup wizard password e controllo event.sender sugli handler wizard.
9. Rendere strict la validazione config packaged.
10. Eseguire matrice live su workstation reale e allegare evidence.

## Rischi se non si interviene

- Release bloccate da gate obsoleti.
- Falsa confidenza: unit test verdi ma e2e core rosso.
- Segreti provider customer esposti al livello meno isolato dell'app.
- Microfono concesso troppo ampiamente.
- Configurazioni errate degradano senza segnali forti.
- Deployment con un solo microfono anche quando la configurazione dichiara due.
- Trial e setup access non robusti contro utenti locali determinati.

## Cosa testare dopo ogni intervento

- Security IPC/secrets: verificare che nessun comando renderer contenga `azureSpeechKey`, `chatGptApiKey`, token o authorization header statico.
- Media permission: testare richiesta microfono da runtime A/B, wizard control/overlay, activation window e URL non autorizzato.
- Sandbox: smoke Electron su activation, setup wizard, runtime A/B, TTS/STT mocked.
- Audio limits: payload vuoto, payload troppo grande, base64 malformato, MIME non permesso, timeout provider.
- Microphone policy: dual-dedicated con 0/1/2 microfoni, single-shared con 0/1/2 microfoni, configured mic assente.
- Config strict: provider invalido, timeout invalido, monitor/microphone count invalido, default language invalida.
- Setup access: password errata ripetuta, cambio password, recovery, log non sensibili.
- CI: `npm run build`, `npm test`, `npm run test:e2e`, `npm run audit:packaging`, `npm run verify:repo` su Windows pulito.

## Quick wins

- Cambiare `inspectWindow` per selezionare `.visitor-actions .secondary-button` invece del primo `.secondary-button` globale.
- Aggiungere max length a `speechTurnRequestSchema.audioBase64`.
- Aggiungere allowlist MIME a `speechTurnRequestSchema.audioMimeType`.
- Aggiungere script `lint` anche inizialmente non bloccante.
- Documentare nel wizard quando viene attivato fallback one-mic.

## Interventi ad alto sforzo

- Refactor STT/TTS provider per non far uscire segreti dal main process.
- Sandbox hardening di tutte le finestre Electron.
- Test automation live/hardware ripetibile con evidence firmata o almeno hashata.
- Schema versionato unico per `PROJECT_STATUS.json`.
