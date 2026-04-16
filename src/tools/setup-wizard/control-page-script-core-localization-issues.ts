export function getSetupWizardControlCoreLocalizationIssuesScript(): string {
  return `      function formatCopy(template, values = {}) {
        return String(template).replace(/\\{(\\w+)\\}/g, (_match, key) => String(values[key] ?? ""));
      }
      function localizeWizardIssue(issue) {
        const detail = issue?.detail ? String(issue.detail) : "";
        switch (issue?.code) {
          case "missing-display-a":
            return { ...issue, message: copy.issueMissingDisplayA };
          case "missing-display-b":
            return { ...issue, message: copy.issueMissingDisplayB };
          case "missing-microphone-a":
            return { ...issue, message: copy.issueMissingMicrophoneA };
          case "missing-microphone-b":
            return {
              ...issue,
              message: String(issue?.message || "").toLowerCase().includes("condiviso") || String(issue?.message || "").toLowerCase().includes("shared")
                ? copy.issueMissingSharedMicrophone
                : copy.issueMissingMicrophoneB
            };
          case "distinct-microphones-required":
            return { ...issue, message: copy.issueDistinctMicrophonesRequired };
          case "unsupported-provider":
            return { ...issue, message: copy.issueUnsupportedProvider };
          case "missing-provider-credentials":
            return { ...issue, message: copy.issueMissingProviderCredentials, detail };
          case "azure-tts-catalog-unavailable":
            return { ...issue, message: copy.issueAzureTextToSpeechCatalogUnavailable, detail };
          case "unresolved-target-tts-a":
          case "unresolved-target-tts-b":
            return {
              ...issue,
              message: formatCopy(copy.issueUnresolvedTargetTextToSpeech, { side: issue.code.slice(-1).toUpperCase() }),
              detail
            };
          default:
            return { ...issue, detail };
        }
      }
`;
}
