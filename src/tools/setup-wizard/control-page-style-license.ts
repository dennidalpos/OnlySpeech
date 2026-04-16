export const SETUP_WIZARD_CONTROL_LICENSE_STYLE = `
      .license-overview-grid,
      .license-status-summary,
      .license-metadata-grid,
      .license-card,
      .license-status-card,
      .license-form-shell,
      .license-form-grid,
      .license-feedback-stack,
      .license-remove-inline,
      .license-remove-copy,
      .license-danger-zone {
        display:grid;
        gap:12px;
        min-width:0;
      }
      .license-overview-grid {
        grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr);
        align-items:start;
        gap:16px;
      }
      .license-card {
        gap:14px;
        min-width:0;
      }
      .license-card .card-heading > div,
      .license-card .card-heading p,
      .license-status-card p,
      .license-status-empty p,
      .license-checkbox span,
      .license-remove-copy strong,
      .license-remove-copy p,
      .license-status-identity strong,
      .license-status-identity span,
      .license-status-timing,
      .license-metadata-item span,
      .license-metadata-item strong {
        min-width:0;
        overflow-wrap:anywhere;
        word-break:break-word;
      }
      .license-status-card {
        padding:18px;
        border-radius:22px;
        border:1px solid rgba(255,255,255,.1);
        background:rgba(255,255,255,.04);
      }
      .license-status-summary {
        grid-template-columns:minmax(0,1fr) auto;
        align-items:start;
      }
      .license-status-empty {
        display:grid;
        gap:10px;
        padding:18px;
        border-radius:20px;
        border:1px dashed rgba(255,255,255,.16);
        background:rgba(255,255,255,.03);
      }
      .license-status-badge {
        display:inline-flex;
        align-items:center;
        justify-content:center;
        gap:8px;
        min-height:36px;
        padding:8px 14px;
        border-radius:999px;
        border:1px solid rgba(255,255,255,.14);
        font-size:12px;
        font-weight:700;
        letter-spacing:.08em;
        text-transform:uppercase;
        max-width:100%;
        white-space:normal;
        text-align:center;
      }
      .license-status-badge.state-active {
        color:#d7ffeb;
        background:rgba(92,228,167,.14);
        border-color:rgba(92,228,167,.24);
      }
      .license-status-badge.state-expired {
        color:#ffd3d1;
        background:rgba(255,106,99,.18);
        border-color:rgba(255,106,99,.28);
      }
      .license-status-identity {
        display:grid;
        gap:4px;
        min-width:0;
      }
      .license-metadata-grid {
        grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
      }
      .license-metadata-item {
        display:grid;
        gap:4px;
        padding:12px 14px;
        border-radius:18px;
        background:rgba(255,255,255,.05);
        border:1px solid rgba(255,255,255,.08);
      }
      .license-metadata-item span {
        font-size:12px;
        letter-spacing:.08em;
        text-transform:uppercase;
        color:var(--muted);
      }
      .license-status-timing {
        font-weight:700;
        color:var(--text);
      }
      .license-field-row {
        gap:8px;
      }
      .license-form textarea,
      .license-feedback-details {
        font-family:Consolas, monospace;
        font-size:13px;
      }
      .license-form-actions,
      .license-status-actions,
      .license-remove-actions,
      .license-trial-actions,
      .license-inline-actions {
        justify-content:flex-start;
      }
      .license-form-actions > *,
      .license-status-actions > *,
      .license-remove-actions > *,
      .license-trial-actions > *,
      .license-inline-actions > * {
        flex:0 0 auto;
        min-width:220px;
      }
      .license-remove-inline {
        padding:14px 16px;
        border-radius:20px;
        border:1px solid rgba(255,255,255,.1);
        background:rgba(255,255,255,.04);
      }
      .license-danger-zone {
        border-color:rgba(255,106,99,.22);
        background:linear-gradient(180deg, rgba(255,106,99,.1), rgba(255,106,99,.04));
      }
      .license-remove-inline > .license-checkbox {
        padding:14px 16px;
        border-radius:18px;
        border:1px solid rgba(255,255,255,.08);
        background:rgba(255,255,255,.03);
      }
      .license-remove-copy strong {
        color:var(--text);
      }
      .license-checkbox {
        display:flex;
        gap:12px;
        align-items:flex-start;
        cursor:pointer;
        color:var(--text);
      }
      .license-checkbox input {
        width:auto;
        margin-top:2px;
        flex:0 0 auto;
      }
`;
