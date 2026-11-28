<p align="center"><img src="build/brand/onlyspeech-logo-dark-920x240.png" alt="OnlySpeech logo" width="460" /></p>

# OnlySpeech

Windows-first desktop workstation for guided two-person speech translation.

## Purpose

An Electron app for one Windows PC with two display surfaces, one for the operator and one for the visitor, to run guided in-person conversations with push-to-talk speech. Live speech uses customer-owned Azure Speech or OpenAI credentials; `ollama` is translation-only and a `demo` mode needs no credentials. There is no browser/SaaS or multi-workstation mode.

## Requirements

- Windows x64, PowerShell, Node.js 22+ and npm 10+.
- Live deployment: two displays, two microphones or one shared one, internet access and provider credentials. Packaged workstations also need Windows PowerShell 5.1, `powercfg.exe` and Media Foundation (on Windows N editions install the Media Feature Pack).

## First setup

```powershell
npm run bootstrap
npm run start -- -SetupWizard   # displays, microphones, provider, languages, activation
npm run dev                     # or `npm run start` for a direct launch
```

Provider values (`AZURE_SPEECH_KEY`, `CHATGPT_API_KEY`, ...) are owned by the setup wizard and the source `.env`: never commit real credentials.

## Usage

Start the app on the workstation, confirm the two languages with the visitor, then use push-to-talk (`dual-dedicated` or `single-shared` microphone). Use `APP_MODE=demo` to try it without credentials.

## Build and test

```powershell
npm test
npm run test:e2e
npm run gate -- -KeepOutputs -EnablePackagedAutomation   # full Windows verification gate
npm run package                                          # installer, portable exe, unpacked archive
```

A passing gate does not clear a customer deployment: signing, activation, live speech and install/uninstall must be validated on the target PC. `npm run clean` and `clean:workstation` delete data: review [scripts/script.md](scripts/script.md) first. GitHub Actions are disabled, so run the same commands locally.

## Documentation and security

[Full previous reference](REFERENCE.md) (command table, troubleshooting) · [Technical contract](docs/PROJECT_SPEC.md) · [Provider setup](docs/product/provider-setup.md) · [Customer quick start](docs/customer-bundle/Customer_Quick_Start.md) · [Scripts](scripts/README.md) · [Security policy](SECURITY.md) · [License](LICENSE) (proprietary; components in [CREDITS.md](CREDITS.md)).
