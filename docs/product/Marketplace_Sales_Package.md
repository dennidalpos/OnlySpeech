# Marketplace Sales Package

## Canonical Offer

- Product: OnlySpeech
- Seller baseline: Danny Perondi
- Support channel baseline: <https://github.com/dennidalpos/OnlySpeech/issues>
- Offer type: one Windows workstation license for guided in-person conversations on two displays
- Deployment baseline: desktop/B2B pilot or production workstation, not browser SaaS
- Provider model baseline: customer-provided Azure Speech or OpenAI credentials, depending on the selected provider
- Runtime TTS baseline: provider-owned Azure/OpenAI playback only, with no workstation-managed local fallback in the product offer

## License Scope

- One purchased license covers one deployed Windows workstation at a time.
- The customer may keep one backup copy only for reinstall or disaster recovery on that same licensed workstation.
- A second simultaneous workstation, spare kiosk, or separate customer site requires an additional license unless the seller agrees otherwise in writing.
- The offer covers the packaged software and the buyer bundle defined in the repository; it does not include Azure Speech or OpenAI consumption.

## Buyer Deliverables

Each marketplace delivery is expected to include:

- the versioned NSIS installer;
- the versioned portable executable;
- the versioned unpacked package archive for technical validation or controlled handover;
- the purchased workstation activation instructions with customer email and activation code delivery;
- the buyer-facing quick-start guide;
- the buyer-facing privacy policy baseline;
- the buyer-facing software-use terms baseline;
- the AI disclosure copy;
- the operator privacy deployment guidance;
- the support and fulfillment policy;
- the DPA baseline outline when the customer needs negotiation-ready material.

## Marketplace Copy

### Short Description

Windows desktop communication aid for guided in-person conversations on one workstation with two displays.

### Long Description

OnlySpeech is a Windows-first desktop workstation for assisted in-person conversations.
It runs on one PC, shows an operator-facing and visitor-facing surface, and supports live speech processing with privacy-first local deployment defaults.
The commercial baseline is a guided desktop/B2B deployment with customer-provided credentials for the selected Azure Speech or OpenAI provider.
Packaged delivery unlocks the purchased workstation through the customer email and activation code supplied after purchase.

### Feature Bullets

- Two-screen workstation flow for guided operator and visitor conversations.
- Integrated setup wizard for displays, microphones, providers, languages, diagnostics, license management, and final save.
- Choice of `azure` or `chatgpt` live provider mode within one packaged app.
- Packaged activation step based on customer email plus code delivered after purchase.
- Privacy-first defaults: no recording archive, conversation history off by default, packaged secrets stored outside the saved `.env`.
- Windows installer, portable executable, and unpacked package outputs from the same release flow.

## Fiverr Listing Baseline

### Gig Title

I will provide a Windows desktop app for live two-way speech translation

### Search Tags

- speech translation
- desktop app
- windows app
- kiosk app
- live translation

### Positioning Notes

- Keep the Fiverr listing in English for broader marketplace search reach.
- Position OnlySpeech as packaged software for one Windows workstation, not as browser SaaS or a generic translation service.
- Keep the listing aligned with the supported product boundary: one PC, two displays, guided in-person conversations, and customer-provided Azure Speech or OpenAI credentials.
- Avoid unsupported claims such as mobile app delivery, multi-workstation orchestration, hosted service access, included provider credits, or on-site commissioning.

## System Requirements

- Windows x64 workstation
- two active displays for the supported kiosk layout
- either two assignable microphones or one shared assignable microphone
- internet connectivity for live provider calls
- customer-provided credentials for the selected Azure Speech or OpenAI provider when live kiosk speech is required
- local administrator access only when the deployment needs installer execution, startup configuration, or workstation power-setting changes

## What Is Included

- packaged application binaries for one workstation
- repository-owned setup, release, and compliance collateral copied into the buyer bundle
- best-effort installation and documented-flow support through the repository support channel
- patch-level replacement packages for repository-controlled defects within the support policy boundary

## What Is Not Included

- Azure Speech or OpenAI usage charges
- hosted SaaS access, multi-workstation orchestration, or browser deployment
- on-site commissioning, hardware procurement, managed network setup, or managed privacy/legal review
- workstation-managed local TTS fallback or custom speech engines outside the documented product boundary

## AI Disclosure Summary

OnlySpeech is an AI-assisted communication tool.
It processes active-turn voice and transcript data, output may contain errors, and it must not be the sole basis for critical, medical, legal, or safety decisions.

## Privacy Summary

- active-turn audio is processed for the current request and is not retained as an application recording archive by default;
- conversation history is disabled by default;
- runtime logs are intended to contain technical metadata only;
- packaged builds store secure provider secrets outside the saved runtime `.env`;
- customer-specific notices, retention rules, DPA terms, and provider-region choices remain deployment decisions.

## Post-Purchase Delivery Text

After purchase, the buyer receives the versioned customer release bundle generated from the repository release artifacts plus the activation material for the purchased workstation.
The bundle contains the installer, portable executable, unpacked package archive, buyer-facing documentation, and any retained internal release evidence separated into its own subfolder.
On first packaged launch, the buyer enters the delivered customer email and activation code before continuing to setup or runtime use.
The buyer must provide credentials for the selected Azure Speech or OpenAI provider before live kiosk speech is enabled.

## Support And Update Summary

- Support scope, fulfillment behavior, and update commitments are defined in `docs/customer-bundle/Support_and_Fulfillment_Policy.md`.
- The support channel baseline is the repository issue tracker at <https://github.com/dennidalpos/OnlySpeech/issues>.
- No uptime SLA, hosted-service SLA, or provider-consumption commitment is included in this marketplace baseline.

## Visual Asset Checklist

- square application icon from `build/icon.png` or `build/icon.ico`
- `docs/product/screenshots/runtime-operator-view.png`
- `docs/product/screenshots/runtime-visitor-view.png`
- `docs/product/screenshots/setup-stations.png`
- `docs/product/screenshots/setup-languages-tts.png`
- `docs/product/screenshots/setup-diagnostics.png`
- one captioned image that states the product is desktop/B2B, two-screen, and AI-assisted
- one silent marketplace demo video up to 20 seconds, generated with `scripts/internal/docs/write-product-demo-video.ps1` when marketplace video collateral is being prepared
