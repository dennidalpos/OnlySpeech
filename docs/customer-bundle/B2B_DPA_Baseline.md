# B2B DPA Baseline

## Scope

This is the repository-controlled baseline outline for a DPA or data-processing addendum related to OnlySpeech deployments.
It is written to be externally readable without unresolved placeholders, while still allowing customer-specific additions where required.

## 1. Parties And Roles

- Controller / Customer: the deployment owner or purchasing customer
- Processor / Vendor baseline: Danny Perondi
- Product: OnlySpeech Windows desktop workstation

The final role split may differ for customer-provided Azure/OpenAI accounts, customer-hosted infrastructure, or pilot/demo arrangements.

## 2. Processing Description

OnlySpeech may process:

- active-turn microphone audio;
- transcript and translation text;
- workstation configuration data;
- runtime diagnostics and support metadata.

Processing purpose: AI-assisted communication support for in-person conversations on a customer workstation.

## 3. Instructions

The vendor processes personal data only on documented customer instructions as reflected in:

- the signed order or commercial agreement;
- customer-selected runtime configuration;
- approved support tickets or deployment instructions.

## 4. Subprocessors / External Providers

The prudent baseline assumes customer-provided provider accounts.
Potential external services may include:

- Microsoft Azure Speech;
- OpenAI API.

If the vendor, not the customer, contracts directly with those providers, the DPA and commercial model must be updated accordingly.

## 5. Security Measures

Repository-controlled baseline measures include:

- workstation-local runtime state for packaged deployments;
- separated packaged secret storage;
- setup-wizard local password protection;
- privacy-first defaults such as disabled conversation history;
- release evidence, notice, and SBOM generation.

## 6. Retention And Deletion

OnlySpeech does not keep a local recording archive by default.
Customer-specific retention, export, deletion, and support-log handling must be defined in deployment documents.

## 7. Data Subject Requests

The customer remains responsible for validating and responding to requests from data subjects, unless a written agreement assigns part of that work to the vendor.

## 8. International Transfers

Cross-border processing depends on the customer's chosen provider accounts, regions, and contracts.
The customer must confirm whether SCCs, transfer-impact assessments, or other jurisdictional measures are required.

## 9. Audits And Assistance

The repository-controlled baseline does not include continuous audit hosting or a managed security operations service.
Reasonable assistance for repository-controlled software behavior, retained release evidence, and buyer bundle contents is provided through the documented support channel, while any contractual audit-rights language or incident-notification commitments beyond that baseline require a separate written agreement.
