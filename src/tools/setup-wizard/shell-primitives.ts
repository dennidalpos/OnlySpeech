interface SetupWizardHeaderOptions {
  eyebrow: string;
  title: string;
  description?: string;
  actionsHtml?: string;
}

interface SetupWizardDisclosureOptions {
  summary: string;
  bodyHtml: string;
  detailsClass?: string;
  id?: string;
  open?: boolean;
}

interface SetupWizardSurfaceActionButtonOptions {
  id: string;
  label: string;
  indicator: string;
  description: string;
  className?: string;
  extraAttributes?: string;
}

function renderHeaderCopy(title: string, description?: string): string {
  return `
      <div class="section-copy">
        <h2>${title}</h2>
        ${description ? `<p class="section-intro">${description}</p>` : ""}
      </div>
  `;
}

export function getSetupWizardSectionHeaderHtml(options: SetupWizardHeaderOptions): string {
  return `
        <div class="section-heading">
          <div class="section-title-row">
            <span class="eyebrow">${options.eyebrow}</span>
            ${renderHeaderCopy(options.title, options.description)}
          </div>
          ${options.actionsHtml ? `<div class="actions section-heading-actions">${options.actionsHtml}</div>` : ""}
        </div>
  `;
}

export function getSetupWizardCardHeaderHtml(options: SetupWizardHeaderOptions): string {
  return `
            <div class="card-heading">
              <div class="section-title-row">
                <span class="eyebrow card-eyebrow">${options.eyebrow}</span>
                ${renderHeaderCopy(options.title, options.description)}
              </div>
              ${options.actionsHtml ? `<div class="actions card-heading-actions">${options.actionsHtml}</div>` : ""}
            </div>
  `;
}

export function getSetupWizardDisclosureHtml(options: SetupWizardDisclosureOptions): string {
  const detailsClass = options.detailsClass || "wizard-disclosure";
  const detailsId = options.id ? ` id="${options.id}"` : "";
  const openAttr = options.open === false ? "" : " open";
  return `
        <details class="${detailsClass}"${detailsId}${openAttr}>
          <summary>${options.summary}</summary>
          <div class="wizard-disclosure-body">
            ${options.bodyHtml}
          </div>
        </details>
  `;
}

export function getSetupWizardSurfaceActionButtonHtml(
  options: SetupWizardSurfaceActionButtonOptions
): string {
  const className = options.className || "secondary wizard-action";
  const extraAttributes = options.extraAttributes ? ` ${options.extraAttributes}` : "";
  return `
    <button
      class="${className} window-action-button"
      type="button"
      id="${options.id}"
      data-window-action-description="${options.description}"
      aria-description="${options.description}"${extraAttributes}
    >
      <span data-action-label>${options.label}</span>
      <span class="window-action-indicator" aria-hidden="true">${options.indicator}</span>
    </button>
  `;
}
