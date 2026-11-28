# OnlySpeech Brand Assets

OnlySpeech uses a compact two-person speech mark derived from the existing runtime palette and typography. The asset set does not introduce a new design system; it documents the versioned source files and generated outputs currently consumed by the app, installer, README, and social metadata.

## Visual Baseline

- Product name: `OnlySpeech`
- Product description: Windows desktop workstation for guided two-person speech translation.
- Tone: operational, privacy-first, Windows-first, B2B desktop deployment.
- Font stack: `"Segoe UI", "Arial Nova", sans-serif` for the dark runtime surface and `"Segoe UI", "Helvetica Neue", sans-serif` for activation.
- Primary dark palette: `#091018`, `#17344a`, `#f4f7fb`, `#bfd2de`, `#55d6ff`, `#ffb54a`.
- Activation/light palette: `#f4efe7`, `#fffaf4`, `#d7ddd8`, `#142022`, `#1b88cc`, `#ff9151`.
- Runtime radii and shadows remain owned by the existing CSS tokens in `src/renderer/operator/styles/operator-base.css`, `src/renderer/activation/styles/activation.css`, and `src/tools/setup-wizard/control-page-style.ts`.

## Versioned Sources

| path | purpose |
| --- | --- |
| `build/brand/onlyspeech-mark.svg` | Source compact mark for dark surfaces, favicon, app icon, and installer icon generation. |
| `build/brand/onlyspeech-mark-light.svg` | Source compact mark variant for light activation or document surfaces. |
| `build/brand/onlyspeech-logo-dark.svg` | Source horizontal logo for dark GitHub or product surfaces. |
| `build/brand/onlyspeech-logo-light.svg` | Source horizontal logo for light document surfaces. |

## Generated Outputs

| path | size | consumer |
| --- | ---: | --- |
| `build/icon.ico` | multi-size ICO: 16, 24, 32, 48, 64, 128, 256 | Electron Builder Windows app icon, NSIS installer, uninstaller, and installer header. |
| `build/icon.png` | 256 x 256 | README fallback reference, marketplace guidance, and demo-video support page. |
| `build/brand/onlyspeech-mark-256.png` | 256 x 256 | Compact mark export. |
| `build/brand/onlyspeech-mark-light-256.png` | 256 x 256 | Compact light mark export. |
| `build/brand/onlyspeech-logo-dark-920x240.png` | 920 x 240 | GitHub-facing README logo. |
| `build/brand/onlyspeech-logo-light-920x240.png` | 920 x 240 | Light logo export for docs or marketplace use. |
| `public/brand/favicon.svg` | vector | Runtime and activation HTML favicon. |
| `public/brand/favicon-32.png` | 32 x 32 | PNG favicon fallback. |
| `public/brand/apple-touch-icon.png` | 180 x 180 | Apple touch icon metadata. |
| `public/brand/pwa-icon-192.png` | 192 x 192 | PWA-size icon export; no web manifest is currently implemented. |
| `public/brand/pwa-icon-512.png` | 512 x 512 | PWA-size icon export; no web manifest is currently implemented. |
| `public/brand/social/onlyspeech-og.png` | 1200 x 630 | `og:image` metadata in `index.html`. |
| `public/brand/social/onlyspeech-twitter-card.png` | 1200 x 600 | `twitter:image` metadata in `index.html`. |
| `docs/product/brand/social/onlyspeech-og.png` | 1200 x 630 | Versioned Open Graph media kit output. |
| `docs/product/brand/social/onlyspeech-twitter-card.png` | 1200 x 600 | Versioned Twitter/X card media kit output. |
| `docs/product/brand/social/onlyspeech-announcement.png` | 1080 x 1080 | Base announcement/post image. |

The project does not currently use a PWA manifest. The 192 px and 512 px exports are kept as equivalent web icon outputs so a future manifest can reference existing files without redesigning the mark.

## Consumers

- `README.md` displays `build/brand/onlyspeech-logo-dark-920x240.png` and keeps `build/icon.png` documented as the installer icon export.
- `package.json` points Electron Builder and NSIS to `build/icon.ico`.
- `index.html` references favicon, Apple touch icon, theme color, Open Graph image, and Twitter/X card image under `public/brand`.
- `activation.html` references favicon, Apple touch icon, and light theme color.
- `scripts/support/docs/marketplace-demo-video.html` continues to consume `build/icon.png`.
- `docs/product/Marketplace_Sales_Package.md` defines the marketplace usage boundary for the shipped icon, screenshots, and demo collateral.

## Regeneration

From the repository root on Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\support\docs\write-brand-assets.ps1
```

For a dry-run directory check:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\support\docs\write-brand-assets.ps1 -DryRun
```

The generator uses Windows `System.Drawing` through PowerShell and does not add npm dependencies. After regenerating, run at least:

```powershell
npm run build
npm test
```

Use `npm run package` when validating the NSIS/portable icon in packaged outputs.
