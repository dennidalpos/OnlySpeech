# Audit critico OnlySpeech

Data audit: 2026-05-13. Ambiente: Windows/PowerShell, repository locale `D:\GITHUB\OnlySpeech`.

## Executive summary

OnlySpeech non e un progetto banale: ha build TypeScript rigorosa, molti test unitari, packaging Windows, commissioning scripts e una struttura abbastanza ordinata. Pero non e solido a livello produzione senza riserve. I problemi piu gravi non sono sintattici: sono boundary di sicurezza Electron, gate CI obsoleto, E2E rosso e copertura live/hardware non dimostrata.

Il codice dimostra un buon investimento in test e flussi Windows, ma assume troppo spesso che il renderer sia trusted, che i fallback siano accettabili e che le prove reali possano restare fuori dal repo. Per un prodotto kiosk con microfono, credenziali provider customer-owned e activation commerciale, queste sono assunzioni pesanti.

## Stack rilevato

- Runtime: Electron 41, Node.js >=22, npm >=10.
- Frontend: React 19, Vite 8, TypeScript strict.
- Main process: TypeScript `src/main`, Electron BrowserWindow, IPC, Windows Registry, PowerShell integration.
- Servizi: Azure Speech SDK, OpenAI-compatible HTTP APIs, Azure Translator, Ollama optional.
- Test: Vitest unit/integration, Electron E2E separato.
- Packaging: electron-builder, NSIS, portable, PowerShell scripts.
- CI/CD: GitHub Actions Windows, `verify:repo` come gate canonico.
- Database: assente. Persistenza locale su `.env`, secure secrets, JSON, registry, logs.
- Package manager: npm con `package-lock.json`.

## Comandi eseguiti

| Comando | Esito | Note |
| --- | --- | --- |
| `git status --short` | passed | Working tree inizialmente pulito. |
| `rg --files` | passed | Mappata struttura repository. |
| `npm run build` | passed | Renderer Vite e main TypeScript compilano. |
| `npm test` | failed poi passed | Primo run fallito per incompatibilita `PROJECT_STATUS.json` dopo normalizzazione; ripristinato campo legacy `tasks`, secondo run: 82 passed, 1 skipped, 602 passed, 2 skipped. |
| `npm audit --json` | passed | 0 vulnerabilita. |
| `npm run build:main` | passed | TypeScript main ok. |
| `npm run audit:packaging` | passed after fix | Script aggiornato per accettare lo stato `npm audit` corrente a 0 vulnerabilita. |
| `npm run test:e2e` | failed | 9 passed, 1 failed. Visitor Georgian flow: expected `ენის შეცვლა`, received `Retry`. |
| `npm ls microsoft-cognitiveservices-speech-sdk uuid --depth=3` | passed | Azure Speech SDK 1.49.0 include nested uuid 9.0.1; uuid diretto 14.0.0. |
| `npm outdated --json` | failed exit code atteso | Elenca pacchetti aggiornabili: Electron 42.0.1, Azure Speech SDK 1.50.0, React 19.2.6, Vite 8.0.12, Vitest 4.1.6, Zod 4.4.3, altri. |

## Entry point principali

- Frontend runtime: `index.html`, `src/renderer/operator/main.tsx`, `src/renderer/operator/app/OperatorApp.tsx`.
- Activation frontend: `activation.html`, `src/renderer/activation/main.tsx`, `src/renderer/activation/ActivationApp.tsx`.
- Main process: `src/main/bootstrap.ts`.
- IPC runtime: `src/main/ipc.ts`, `src/main/preload.ts`.
- Setup wizard: `src/main/setup-wizard-manager.ts`, `src/tools/setup-wizard/preload.ts`, `src/tools/setup-wizard/pages.ts`.
- Speech: `src/services/speech/live-speech-client.ts`, `src/services/speech/translation-provider-service.ts`, `src/main/kiosk-speech-controller.ts`.
- TTS: `src/main/kiosk-text-to-speech-controller.ts`, `src/main/provider-text-to-speech-synthesizer.ts`, `src/services/speech/text-to-speech-client.ts`.
- Display/windowing: `src/main/display-manager.ts`, `src/main/kiosk-display-runtime.ts`, `src/main/window-factory.ts`.
- Persistence: `src/main/runtime-secrets.ts`, `src/main/activation-storage.ts`, `src/main/setup-wizard-access.ts`, `src/main/trial-tombstone.ts`.
- Packaging/CI: `scripts/support/workspace/verify-repo.ps1`, `scripts/support/packaging/package-audit.ps1`, `.github/workflows/*.yml`.

## Problemi ordinati per gravita

### High

1. `AUD-001` - Credenziali provider inoltrate ai renderer tramite IPC.
   - Evidenza: `src/main/kiosk-speech-controller.ts:129-143`, `src/main/kiosk-text-to-speech-controller.ts:191-213`, `src/tools/setup-wizard/preload.ts:231-240`.
   - Scenario: XSS o renderer compromesso legge Azure/OpenAI key e le invia fuori macchina.
   - Correzione: provider calls con segreti nel main/worker isolato; renderer senza chiavi statiche.

2. `AUD-002` - Permesso microfono concesso globalmente.
   - Evidenza: `src/main/media-permission-policy.ts:3-7`.
   - Scenario: contenuto imprevisto nella defaultSession chiede `media` e ottiene accesso.
   - Correzione: allowlist per webContents/URL/finestra e deny di default.

3. `AUD-003` - `sandbox: false` su finestre runtime, activation e wizard.
   - Evidenza: `src/main/window-factory.ts:83-88`, `src/main/activation-window.ts:41-46`, `src/main/setup-wizard-manager.ts:569-622`.
   - Scenario: exploit renderer ha isolamento piu debole proprio dove transitano segreti e capability privilegiate.
   - Correzione: sandbox true dove possibile, preload ridotti e capability per finestra.

4. `AUD-004` - Payload audio IPC senza limiti.
   - Evidenza: `src/main/ipc-payloads.ts:93-100`, `src/services/speech/translation-provider-service.ts:203-210`.
   - Scenario: renderer invia base64 enorme o MIME arbitrario, causando memoria/costi provider.
   - Correzione: max bytes, allowlist MIME, durata massima, rate limit.

5. `AUD-006` - E2E Electron fallisce sul flusso visitor non-Latin.
   - Evidenza: `tests/electron-e2e.test.ts:1090-1092`; ricevuto `Retry` invece di `ენის შეცვლა`.
   - Scenario: flusso localizzato visitor non dimostrato; automation confonde banner recovery e azione sessione.
   - Correzione: selector specifici, stato blocking esplicito, test mirato.

### Medium

7. `AUD-007` - `REQUIRED_MICROPHONES` non governa realmente l'assegnazione.
   - Evidenza: `src/services/audio/microphone-selection.ts:37-46`, `src/main/kiosk-health.ts:58-75`.
   - Impatto: dual-dedicated puo diventare single-shared con un solo microfono.

8. `AUD-008` - Password setup wizard senza rate limit e temporanea in chiaro.
   - Evidenza: `src/main/setup-wizard-access.ts:96-116`, `132-160`.
   - Impatto: workstation fisica piu esposta a brute force/accesso filesystem.

9. `AUD-009` - IPC wizard privilegiato senza controllo esplicito del mittente.
   - Evidenza: `src/main/setup-wizard-manager.ts:812-846`, `968-1011`.
   - Impatto: futuri renderer o XSS wizard possono salvare env/segreti/autostart.

10. `AUD-010` - Config invalide degradano silenziosamente ai default.
    - Evidenza: `src/shared/config.ts:27-38`, `79-93`.
    - Impatto: misconfigurazioni packaged invisibili.

11. `AUD-011` - Trial enforcement su chiave HKCU modificabile.
    - Evidenza: `src/main/trial-tombstone.ts:14-24`, `32-40`.
    - Impatto: trial aggirabile da utente locale determinato.

12. `AUD-012` - Keyring activation statico con una sola public key.
    - Evidenza: `src/main/activation-public-keys.ts:3-12`.
    - Impatto: revoca/rotazione richiedono release.

13. `AUD-013` - Manca lint/format.
    - Evidenza: `package.json:9-45`.
    - Impatto: controlli statici React/Electron/accessibilita non codificati.

14. `AUD-014` - `verify:repo` eredita ancora il test E2E rosso.
    - Evidenza: `scripts/support/workspace/verify-repo.ps1`, `.github/workflows/*.yml`.
    - Impatto: CI/release potenzialmente bloccate.

15. `AUD-016` - Funzionalita core live/hardware non dimostrate dal repo.
    - Evidenza: `PROJECT_STATUS.json`, README requirements.
    - Impatto: la parte piu rischiosa resta manuale/residua.

### Low

16. `AUD-015` - Log includono metadati device potenzialmente identificativi.
17. `AUD-017` - `PROJECT_STATUS.json` ha contratto legacy `tasks` non unificato.
18. `AUD-018` - Artefatti packaged pesanti presenti localmente ma ignorati da Git.

Dettaglio completo in `AUDIT_FINDINGS.json`.

## Dubbi e perplessita

- Dubbio: il renderer e trattato come trusted completo, ma il prodotto usa Electron e provider secrets reali.
- Dubbio: il fallback one-mic e presentato come supporto operativo o come recupero automatico non visibile?
- Dubbio: le prove live provider/hardware sono state fatte fuori repo, ma non sono dimostrabili qui.
- Perplessita risolta: il gate packaging si aspettava vulnerabilita obsolete; ora accetta lo stato zero-vulnerability.
- Perplessita: il codice ha molte difese puntuali, ma i confini tra runtime, wizard, activation e automation sono troppo permeabili.
- Perplessita: non c'e un database, ma ci sono molti stati locali indipendenti senza transazioni o rollback coordinato.

## Gap analysis

### Aree non coperte

- Live STT/TTS con Azure/OpenAI su credenziali reali.
- Microfoni reali, rumore, echo cancellation/noise suppression effettive.
- Display fisici reali, touch input, multi-monitor reali.
- Installer upgrade/rollback reali.
- Autostart al logon Windows reale.
- Security tests Electron: sandbox, permission policy, navigation, sender validation.
- E2E completo verde: attualmente 1 test fallisce.

### Aree coperte male

- Packaging audit: coperto da script aggiornato allo stato zero-vulnerability.
- IPC wizard: molti test funzionali, pochi controlli negativi di autorizzazione mittente.
- Audio payload: test funzionali, pochi limiti di abuso.
- Config validation: copre fallback, ma non strict failure production.
- UX error states: banner e azioni sessione si sovrappongono nella superficie automation.

### Aree ambigue

- `REQUIRED_MICROPHONES`: vincolo rigido o indicazione?
- Renderer trust model.
- Trial: deterrente locale o controllo commerciale robusto?
- Activation key rotation.
- Responsabilita tra setup wizard e runtime quando un env salvato e parzialmente valido.

### Assunzioni pericolose

- "Il renderer non verra compromesso".
- "Concedere media a tutta la defaultSession e accettabile".
- "Fallback a default config e meglio che fallire".
- "Un solo microfono basta anche se il profilo dice dual-dedicated".
- "Le prove manuali residue possono restare fuori dalla readiness decision".

### Domande aperte

1. Quale provider e modalita sono default produzione?
2. Il renderer e parte del trusted computing base?
3. Il cliente finale puo accedere a file profilo/log?
4. Quanto deve resistere il trial a utenti locali?
5. Quale matrice hardware minima e supportata contrattualmente?
6. Perche il fallback one-mic ignora `REQUIRED_MICROPHONES`?
7. Quale procedura esiste per revocare una activation key?
8. Gli artefatti packaged locali sono ancora validi?
9. La CI attuale fallisce per il test E2E Electron?
10. Esiste una policy di retention/redazione log customer?

### Cose da verificare manualmente

- PTT Azure e ChatGPT con microfoni reali.
- Qualita STT/TTS su lingue non latine e ambienti rumorosi.
- Permission prompt/comportamento microfono su Windows pulito.
- Setup wizard su touch screen.
- Installer NSIS per-machine, portable, uninstall, upgrade, rollback.
- Autostart HKCU al logon.
- Activation/trial con clock rollback e profili Windows diversi.

### Funzionalita apparentemente previste ma incomplete

- Provider live proof: prevista da script/template, non chiusa.
- Commissioning reale: previsto, residuo.
- Language/audio quality live matrix: prevista, residua.
- Dependency audit exception: prevista, ora non allineata allo stato reale.
- Lint/static quality gate: non presente.

## Raccomandazioni prioritarie

1. Rendere verde `npm run test:e2e`.
2. Eseguire `verify:repo` completo dopo la correzione E2E.
3. Definire threat model Electron.
4. Rimuovere segreti dai renderer.
5. Restringere media permission e abilitare sandbox.
6. Validare payload IPC audio.
7. Rendere esplicito o eliminare fallback one-mic.
8. Aggiungere rate limit setup wizard e sender validation IPC.
9. Rendere strict la config packaged.
10. Eseguire e archiviare evidence live/hardware.

## Quick wins

- Selector automation dedicato a `.visitor-actions .secondary-button`.
- Max length zod per `audioBase64`.
- Enum MIME zod per `audioMimeType`.
- Script `lint` minimo.
- Warning/log per config fallback.
- Redazione deviceId/groupId nei log.

## Rischi sistemici

- Boundary Electron debole: segreti, media, sandbox e IPC sono nello stesso fascio di rischio.
- Readiness falsata: molti test verdi ma E2E e gate completo falliscono.
- Dipendenza da prove manuali non archiviate.
- Config permissiva in un prodotto che dovrebbe essere deterministico su workstation.
- Stato locale frammentato senza transazioni.

## Classificazione finale

Stato progetto: **Rischioso**.

Motivazione sintetica: compila, ha una test suite ampia e il gate packaging ora passa, ma ha un E2E core rosso, segreti nel renderer, permessi media globali e validazioni live/hardware ancora non dimostrate. Non e "Bloccante" perche build, unit test e audit packaging passano; non e "Accettabile con riserve" perche i rischi toccano sicurezza e flussi core.

## Top 10 problemi da risolvere prima

1. Segreti provider nei renderer.
2. Media permission globale.
3. `sandbox: false` sulle finestre.
4. Payload audio IPC senza limiti.
5. `npm run test:e2e` rosso.
6. `verify:repo`/CI ereditano il test E2E rosso.
7. `REQUIRED_MICROPHONES` non rispettato.
8. IPC wizard senza sender validation.
9. Prove live/hardware non chiuse.
10. Lint/format non versionati.

## Top 10 domande da chiarire col proprietario

1. Il renderer deve essere considerato trusted o untrusted?
2. E accettabile che chiavi provider arrivino al renderer?
3. Quale livello di resistenza deve avere il trial?
4. Il fallback one-mic e requisito prodotto?
5. Quale hardware e obbligatorio per produzione?
6. Quale provider e il percorso primario di produzione?
7. La CI e attualmente verde sul branch principale?
8. Esiste evidence esterna delle prove live?
9. Come ruotate/revocate activation keys?
10. Quale retention/redazione e richiesta per log customer?
