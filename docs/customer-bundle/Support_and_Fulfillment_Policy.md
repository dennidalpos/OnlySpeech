# Support And Fulfillment Policy

## Repository-Controlled Baseline

- Seller baseline: Danny Perondi
- Product: OnlySpeech
- Support channel: <https://github.com/dennidalpos/OnlySpeech/issues>
- Delivery model: versioned customer release bundle generated from the checked-in repository state

## Fulfillment

For each sold version, the seller delivers one versioned customer bundle that contains:

- the NSIS installer;
- the portable executable;
- the unpacked package archive;
- the activation instructions for the purchased workstation, including the customer email identity and activation code delivered after purchase;
- buyer-facing terms, privacy, AI disclosure, and support material;
- the customer quick-start guide plus the operator deployment guidance copied from the repository bundle source;
- retained internal release evidence artifacts only in a separate `internal-evidence/` folder when those JSON files exist in the workspace at bundle-generation time.

The bundle is produced from the repository release outputs and keeps buyer-facing material separate from internal evidence artifacts.

## Support Scope

The repository-controlled support baseline covers:

- first-use activation entry issues involving the delivered customer email or activation code;
- installer and portable package integrity issues;
- reproducible problems in documented setup, provider configuration, packaging, or launch flows;
- clarification of the documented workstation model, privacy boundary, and buyer bundle contents.

The baseline does not cover:

- Azure Speech or OpenAI account procurement, billing, or service outages;
- customer network configuration, endpoint protection, or hardware procurement;
- on-site commissioning of displays, microphones, touch input, or power settings;
- customer-specific legal review, DPA negotiation, or privacy notices;
- custom feature development or undocumented deployment models.

## Response And Update Policy

- Support is best-effort through the repository support channel.
- The target acknowledgement window for a reproducible support request is three business days.
- No uptime SLA, hosted-service SLA, or emergency-response commitment is included.
- Repository-controlled defects may be resolved by documentation correction, replacement bundle generation, or a patch release for the purchased version line.
- New features, new platform targets, or rollout changes outside the documented product boundary are not included in the baseline support commitment.

## Customer Responsibilities

- provide and manage credentials for the selected Azure Speech or OpenAI provider used by live speech features;
- confirm workstation hardware, local accounts, and deployment policies match the documented system requirements;
- review buyer-facing terms and privacy material before local rollout;
- keep exported runtime logs and release evidence under the customer's own retention policy when they leave the workstation boundary.

## Escalation Boundary

If a reported issue depends on external provider terms, code signing, on-site commissioning, or deployment-specific legal review, the issue remains outside the repository-controlled support baseline until the seller and customer agree on an expanded service scope in writing.
