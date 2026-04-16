import { createPublicKey, type KeyObject } from "node:crypto";

const ACTIVATION_PUBLIC_KEYS = Object.freeze({
  ks1: [
    "-----BEGIN PUBLIC KEY-----",
    "MCowBQYDK2VwAyEAnpeO5VFhSK9ZmUUDJf7Kz+cSJrSps51wf2rmxZNOwCc=",
    "-----END PUBLIC KEY-----"
  ].join("\n")
});

export type ActivationPublicKeyId = keyof typeof ACTIVATION_PUBLIC_KEYS;

export function getActivationPublicKeys(): Readonly<Record<string, string>> {
  return ACTIVATION_PUBLIC_KEYS;
}

export function getActivationPublicKeyObjects(): Readonly<Record<string, KeyObject>> {
  return Object.fromEntries(
    Object.entries(ACTIVATION_PUBLIC_KEYS).map(([keyId, publicKeyPem]) => [keyId, createPublicKey(publicKeyPem)])
  );
}
