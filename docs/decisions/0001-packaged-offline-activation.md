# Decision 0001: Packaged Offline Activation Contract

- Date: 2026-04-07
- Status: Accepted
- Scope: packaged Windows activation only

## Context

The repository needs a packaged-only offline activation flow based on customer email plus activation code.
The validation decision must stay in the Electron main process, must work without network access, and must avoid shipping any private signing material in the repository or packaged app.

This decision defines the activation contract now implemented by the packaged main-process validation, persisted activation state, startup gating, and activation UI flow.

## Decision

### Activation code format

The activation code is a compact ASCII token with three dot-separated segments:

`OS1.<payload-base64url>.<signature-base64url>`

Rules:

- `OS1` is the format prefix and contract version for the activation envelope;
- `payload-base64url` is base64url without padding of the UTF-8 payload bytes;
- `signature-base64url` is base64url without padding of the Ed25519 signature;
- the signature is computed over the raw decoded payload bytes, not over a reserialized object;
- the token is case-sensitive and must be preserved exactly as issued.

### Signed payload schema

The decoded payload is UTF-8 JSON with this schema:

```json
{
  "schemaVersion": 1,
  "keyId": "ks1",
  "email": "customer@example.com",
  "plan": "annual",
  "issuedAt": "2026-04-07T10:30:00.000Z",
  "expiresAt": "2027-04-07T10:30:00.000Z"
}
```

Field rules:

- `schemaVersion`: required integer, currently `1`;
- `keyId`: required non-empty string selecting the embedded public key;
- `email`: required canonical customer email string;
- `plan`: required string in `monthly`, `semiannual`, `annual`, or `lifetime`;
- `issuedAt`: required UTC timestamp in ISO 8601 form with trailing `Z`;
- `expiresAt`: required UTC timestamp in ISO 8601 form with trailing `Z` for time-limited plans, and `null` for `lifetime`.

### Canonical email normalization

Both the generator and the packaged app must normalize emails before signing or comparing them:

1. trim leading and trailing whitespace;
2. normalize the string with Unicode `NFKC`;
3. reject any value containing internal whitespace or control characters;
4. lowercase the full address;
5. reject malformed addresses before signing or acceptance.

The payload must store the canonicalized form only.
The app must canonicalize the user-entered email before comparing it to the signed payload.

### Plan and expiry semantics

Plan values are fixed to:

- `monthly`
- `semiannual`
- `annual`
- `lifetime`

Expiry rules:

- `monthly` means `issuedAt` plus 1 UTC calendar month;
- `semiannual` means `issuedAt` plus 6 UTC calendar months;
- `annual` means `issuedAt` plus 12 UTC calendar months;
- `lifetime` never expires and therefore requires `expiresAt: null`;
- month-based rollover must clamp to the last valid UTC day of the target month when the original day does not exist there;
- the app must treat a license as valid only while `now <= expiresAt` for non-lifetime plans.

The generator may calculate `expiresAt`, but the packaged app must recompute the expected UTC expiry from `plan` plus `issuedAt` and reject mismatches.

### Key rotation contract

- The packaged app embeds one or more Ed25519 public keys.
- `keyId` selects which public key validates the token.
- Unknown `keyId` values are invalid.
- Public-key rotation is additive: a new build may trust multiple `keyId` values while older keys are being retired.
- The private key and issuance workflow remain outside Git and outside packaged contents.

### Main-process validation rules

The Electron main process must enforce this order:

1. split the code into exactly three segments and require the `OS1` prefix;
2. base64url-decode payload and signature;
3. parse the payload only enough to extract an untrusted `keyId`;
4. verify the Ed25519 signature using the public key mapped by that `keyId`;
5. require `schemaVersion === 1`;
6. validate `plan`, `issuedAt`, and `expiresAt` against this contract;
7. canonicalize the entered email and require exact match with the payload email;
8. recompute expiry from `issuedAt` plus `plan` and reject payloads whose `expiresAt` does not match;
9. return explicit `invalid`, `expired`, or `email-mismatch` style outcomes instead of silently falling through.

Clock rollback handling, persistence, and startup gating are implemented on top of this contract and must continue to preserve it.

### Offline trusted-time rule

Persisted activation state must keep a workstation-local `lastTrustedUtc` marker.

Rules:

- every successful offline validation may advance `lastTrustedUtc`, but must never decrease it;
- the packaged app may tolerate small backward clock drift, but a rollback larger than 5 minutes is treated as explicit `clock-rollback`;
- expiry checks must compare against the effective trusted time `max(nowUtc, lastTrustedUtc)` so a license that has already crossed expiry cannot silently reopen after the workstation clock is set backward;
- `lastValidatedAt` may record the local validation attempt time even when `lastTrustedUtc` remains higher.

## Alternatives Considered

### Online activation service

Rejected for the current product phase because the repository target is a packaged offline-capable workstation and startup must not depend on network reachability.

### Symmetric HMAC code

Rejected because the packaged app would need the same shared secret used to issue codes, which would make code generation recoverable from the distributed app.

### Opaque encrypted blob without explicit claims

Rejected because it would make validation, support, and future key rotation harder than a signed payload with explicit typed claims.

## Rationale

Ed25519 gives a compact signature, is natively supported by Node crypto, and keeps verification asymmetric.
The explicit payload keeps supportable claims visible to the app without exposing the private key or requiring a server.
The versioned envelope plus `keyId` provides a controlled upgrade path for future contract or key changes.

## Expected Impact

- activation storage can persist the accepted token plus derived claims without inventing a second claim model;
- bootstrap gating can rely on a single main-process validation result;
- tests can use deterministic fixtures for valid, invalid, expired, mismatched, and lifetime cases;
- buyer-facing activation copy can describe "email plus code" without exposing the payload or signature mechanics.

## Costs And Limits

- offline activation cannot revoke already issued codes without shipping an app update or rotating trusted keys;
- offline anti-rollback currently depends on workstation-local trusted-time persistence and does not provide online revocation or cross-device attestation;
- email normalization is intentionally strict to keep generator and app behavior deterministic.
