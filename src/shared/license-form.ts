export const ACTIVATION_CODE_PREFIX = "OS1.";
export const EMAIL_FORMAT_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const EMAIL_FORMAT_PATTERN_SOURCE = EMAIL_FORMAT_PATTERN.source;

export function normalizeLicenseField(value: string): string {
  return value.trim();
}

export function isLicenseEmailValid(value: string): boolean {
  const normalized = normalizeLicenseField(value);
  return normalized.length > 0 && EMAIL_FORMAT_PATTERN.test(normalized);
}

export function isActivationCodeFormatValid(value: string): boolean {
  const normalized = normalizeLicenseField(value);
  if (!normalized.startsWith(ACTIVATION_CODE_PREFIX)) {
    return false;
  }

  const parts = normalized.split(".");
  return parts.length === 3 && parts[1].length > 0 && parts[2].length > 0;
}
