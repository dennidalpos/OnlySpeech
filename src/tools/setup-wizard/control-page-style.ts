import { SETUP_WIZARD_CONTROL_LICENSE_STYLE } from "./control-page-style-license.js";

export const SETUP_WIZARD_CONTROL_PAGE_STYLE = [`
      :root {
        color-scheme: dark;
        --font-sans:"Segoe UI","Arial Nova",sans-serif;
        --bg-start:#091018;
        --bg-end:#17344a;
        --panel:rgba(7,15,25,.9);
        --panel-border:rgba(255,255,255,.1);
        --panel-strong:rgba(10,19,31,.96);
        --card:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03));
        --card-strong:rgba(255,255,255,.05);
        --card-border:rgba(255,255,255,.11);
        --surface-soft:rgba(255,255,255,.04);
        --surface-muted:rgba(255,255,255,.025);
        --text:#f4f7fb;
        --muted:#bfd2de;
        --focus:#fde68a;
        --shadow:0 24px 80px rgba(0,0,0,.34);
        --space-2:8px;
        --space-3:12px;
        --space-4:16px;
        --space-5:20px;
        --space-6:24px;
        --space-7:32px;
        --radius-sm:16px;
        --radius-md:22px;
        --radius-lg:30px;
        --accent-cool:#55d6ff;
        --accent-cool-strong:#1b88cc;
        --accent-warm:#ffb54a;
        --accent-warm-strong:#ff9151;
        --accent-stations:#6fe7ff;
        --accent-provider:#70d7ff;
        --accent-tests:#ffcb70;
        --accent-license:#c0b2ff;
        --accent-save:#5ce4a7;
        --danger:#ff6a63;
        --success:#5ce4a7;
        --side-a-bg:rgba(85,214,255,.12);
        --side-a-border:rgba(85,214,255,.24);
        --side-b-bg:rgba(255,181,74,.12);
        --side-b-border:rgba(255,181,74,.22);
      }
      * { box-sizing: border-box; }
      html { scroll-behavior:smooth; }
      body {
        margin:0;
        font-family:var(--font-sans);
        background:
          radial-gradient(circle at top left, rgba(85,214,255,.18), transparent 32%),
          radial-gradient(circle at top right, rgba(255,181,74,.18), transparent 28%),
          linear-gradient(160deg, var(--bg-start), var(--bg-end));
        color:var(--text);
      }
      button,input,select,textarea { font:inherit; }
      button,select { touch-action:manipulation; }
      .shell {
        width:min(1360px, calc(100vw - 32px));
        margin:24px auto 32px;
        display:grid;
        gap:24px;
      }
      .hero,
      .panel {
        position:relative;
        overflow:hidden;
        background:var(--panel);
        border:1px solid var(--panel-border);
        border-radius:var(--radius-lg);
        box-shadow:var(--shadow);
      }
      .hero::before,
      .panel::before {
        content:"";
        position:absolute;
        inset:0 0 auto 0;
        height:1px;
        background:linear-gradient(90deg, rgba(255,255,255,.24), rgba(255,255,255,0));
        pointer-events:none;
      }
      .hero {
        padding:var(--space-6);
        display:grid;
        gap:var(--space-5);
      }
      .panel {
        padding:var(--space-6);
        display:grid;
        gap:var(--space-5);
      }
      .shell-hero {
        padding-bottom:20px;
      }
      .shell-overview-panel {
        gap:20px;
      }
      .hero-top,
      .section-heading,
      .card-heading,
      .actions,
      .review-strip,
      .section-links,
      .side-card-head {
        display:flex;
        gap:12px;
        flex-wrap:wrap;
        align-items:flex-start;
      }
      .hero-top,
      .section-heading,
      .card-heading {
        justify-content:space-between;
      }
      .hero-copy,
      .section-copy,
      .section-title-row {
        display:grid;
        gap:8px;
        min-width:0;
      }
      .hero-copy h1 {
        margin:0;
        font-size:clamp(2.25rem, 4vw, 4rem);
        line-height:1.02;
      }
      .section-copy h2,
      .card-heading h2,
      .card-heading h3,
      .panel h2,
      .card h3 {
        margin:0;
      }
      .section-copy h2,
      .panel h2 {
        font-size:clamp(1.4rem, 2vw, 1.95rem);
        line-height:1.14;
      }
      .card-heading h2,
      .card-heading h3,
      .card h3 {
        font-size:1.06rem;
        line-height:1.24;
      }
      .section-intro,
      .hero-copy p,
      .panel p,
      .hint,
      .meta,
      .field-note,
      .side-caption,
      .setup-language-description,
      .wizard-disclosure-body,
      .wizard-disclosure-body p {
        margin:0;
        color:var(--muted);
        line-height:1.5;
        overflow-wrap:anywhere;
      }
      .shell-overview-grid,
      .wizard-grid,
      .provider-grid,
      .form-grid,
      .display-grid,
      .stations-grid,
      .test-stations-grid,
      .profile-choice-grid,
      .license-overview-grid,
      .license-form-grid,
      .kiosk-card-grid,
      .setup-language-card-grid {
        display:grid;
        gap:16px;
      }
      .wizard-grid-2,
      .shell-overview-grid,
      .provider-grid,
      .form-grid,
      .profile-choice-grid,
      .test-stations-grid,
      .stations-grid,
      .kiosk-card-grid,
      .license-overview-grid {
        grid-template-columns:repeat(2, minmax(0,1fr));
      }
      .wizard-grid-3 {
        grid-template-columns:repeat(3, minmax(0,1fr));
      }
      .display-grid {
        grid-template-columns:repeat(auto-fit,minmax(250px,1fr));
      }
      .card,
      .hero-card,
      .settings-card,
      .station-block,
      .side-card,
      .display-card,
      .device-group,
      .setup-language-select-card,
      .setup-language-info-card,
      .setup-language-side-card,
      .kiosk-card,
      .diagnostic-subcard,
      .save-review-card {
        background:var(--card);
        border:1px solid var(--card-border);
        border-radius:var(--radius-md);
        box-shadow:inset 0 1px 0 rgba(255,255,255,.03);
      }
      .card,
      .settings-card,
      .save-review-card,
      .setup-language-select-card,
      .setup-language-info-card,
      .kiosk-card,
      .diagnostic-subcard,
      .display-card {
        padding:18px;
      }
      .station-block,
      .side-card,
      .device-group,
      .setup-language-side-card {
        padding:16px;
      }
      .card,
      .settings-card,
      .save-review-card,
      .station-block,
      .side-card,
      .device-group,
      .device-groups,
      .shell-overview-main,
      .shell-overview-side,
      .provider-card,
      .setup-language-side-card,
      .setup-language-select-card,
      .setup-language-info-card,
      .display-card,
      .diagnostic-subcard,
      .kiosk-card {
        display:grid;
        gap:14px;
      }
      .full-span { grid-column:1 / -1; }
      .eyebrow,
      .card-eyebrow,
      .block-section-label,
      .danger-eyebrow {
        display:inline-flex;
        align-items:center;
        gap:8px;
        font-size:12px;
        letter-spacing:.14em;
        text-transform:uppercase;
        color:var(--muted);
      }
      .card-eyebrow {
        letter-spacing:.1em;
      }
      .danger-eyebrow {
        color:#ffd3d1;
      }
      .section-panel[data-accent="stations"] { box-shadow:0 24px 80px rgba(0,0,0,.34), inset 0 0 0 1px rgba(111,231,255,.08); }
      .section-panel[data-accent="provider"] { box-shadow:0 24px 80px rgba(0,0,0,.34), inset 0 0 0 1px rgba(112,215,255,.08); }
      .section-panel[data-accent="tests"] { box-shadow:0 24px 80px rgba(0,0,0,.34), inset 0 0 0 1px rgba(255,203,112,.08); }
      .section-panel[data-accent="license"] { box-shadow:0 24px 80px rgba(0,0,0,.34), inset 0 0 0 1px rgba(192,178,255,.08); }
      .section-panel[data-accent="save"] { box-shadow:0 24px 80px rgba(0,0,0,.34), inset 0 0 0 1px rgba(92,228,167,.08); }
      .section-emphasis {
        box-shadow:0 0 0 1px rgba(255,255,255,.08), 0 0 0 2px rgba(111,231,255,.12), var(--shadow);
      }
      .section-links {
        gap:10px;
      }
      .section-link {
        flex:1 1 150px;
        min-width:0;
        min-height:46px;
        padding:10px 16px;
        border-radius:999px;
        border:1px solid rgba(255,255,255,.13);
        background:rgba(255,255,255,.05);
        color:var(--text);
        cursor:pointer;
        white-space:normal;
        text-align:center;
        line-height:1.3;
      }
      .inline-select {
        min-width:min(260px, 100%);
        display:grid;
        gap:6px;
      }
      .inline-select span {
        color:var(--muted);
        font-size:13px;
      }
      label {
        display:grid;
        gap:6px;
        font-size:14px;
        color:var(--muted);
      }
      input,
      select,
      textarea {
        width:100%;
        min-width:0;
        padding:12px 14px;
        border-radius:14px;
        border:1px solid rgba(255,255,255,.14);
        background:rgba(255,255,255,.05);
        color:var(--text);
        transition:border-color .15s ease, box-shadow .15s ease, background .15s ease;
      }
      select option,
      select optgroup {
        color:#10161f;
        background:#f7fbff;
        font-style:normal;
      }
      textarea {
        min-height:110px;
        resize:vertical;
      }
      button {
        min-height:46px;
        min-width:0;
        border:1px solid transparent;
        border-radius:16px;
        padding:11px 16px;
        cursor:pointer;
        white-space:normal;
        text-align:center;
        line-height:1.3;
        transition:transform .15s ease, border-color .15s ease, background .15s ease, box-shadow .15s ease, opacity .15s ease;
      }
      .window-action-button {
        display:inline-flex;
        align-items:center;
        justify-content:center;
        gap:10px;
      }
      .window-action-indicator {
        display:inline-flex;
        align-items:center;
        justify-content:center;
        padding:4px 8px;
        border-radius:999px;
        background:rgba(255,255,255,.12);
        border:1px solid rgba(255,255,255,.16);
        color:var(--muted);
        font-size:11px;
        font-weight:700;
        letter-spacing:.04em;
        text-transform:uppercase;
      }
      button:hover:not(:disabled):not(.is-active),
      .section-link:hover:not(:disabled):not(.is-active) {
        transform:translateY(-1px);
        border-color:rgba(85,214,255,.26);
        box-shadow:0 14px 36px rgba(85,214,255,.1);
      }
      .primary {
        background:linear-gradient(135deg, var(--accent-warm), var(--accent-warm-strong));
        color:#10161f;
        font-weight:800;
      }
      .secondary {
        background:rgba(255,255,255,.08);
        color:var(--text);
        border-color:rgba(255,255,255,.14);
      }
      .ghost {
        background:transparent;
        color:var(--muted);
        border:1px dashed rgba(255,255,255,.2);
      }
      .danger {
        background:linear-gradient(180deg, rgba(255,106,99,.18), rgba(255,106,99,.1));
        color:#ffd8d5;
        border-color:rgba(255,106,99,.3);
      }
      .wizard-action.is-active,
      .section-link.is-active,
      .secondary.is-active,
      .ghost.is-active {
        background:linear-gradient(135deg, rgba(85,214,255,.22), rgba(27,136,204,.28));
        color:var(--text);
        border-color:rgba(85,214,255,.3);
        box-shadow:0 0 0 1px rgba(255,255,255,.08), 0 0 0 4px rgba(85,214,255,.12);
      }
      .primary.is-active {
        box-shadow:0 0 0 1px rgba(255,255,255,.12), 0 0 0 4px rgba(255,181,74,.18);
      }
      .side-A.is-active {
        background:linear-gradient(135deg, rgba(85,214,255,.22), rgba(27,136,204,.2));
      }
      .side-B.is-active {
        background:linear-gradient(135deg, rgba(255,181,74,.22), rgba(255,145,81,.2));
      }
      button:disabled,
      button.is-busy,
      .section-link:disabled,
      input:disabled,
      select:disabled,
      textarea:disabled {
        cursor:not-allowed;
        opacity:.68;
        transform:none;
        box-shadow:none;
      }
      button:focus-visible,
      input:focus-visible,
      select:focus-visible,
      textarea:focus-visible,
      [tabindex="-1"]:focus-visible {
        outline:none;
        border-color:var(--focus);
        box-shadow:0 0 0 3px rgba(253,230,138,.2);
      }
      .review-strip,
      .save-actions-bar {
        gap:12px;
      }
      .review-chip,
      .pill,
      .side-badge {
        display:grid;
        gap:4px;
        padding:10px 12px;
        border-radius:18px;
        font-size:13px;
        border:1px solid rgba(255,255,255,.1);
        background:rgba(255,255,255,.05);
      }
      .review-chip strong,
      .pill strong,
      .side-badge {
        color:var(--text);
      }
      .review-chip span,
      .pill span,
      .side-caption {
        color:var(--muted);
      }
      .review-chip.is-ok,
      .checklist-item-ok {
        background:rgba(92,228,167,.12);
        border-color:rgba(92,228,167,.24);
      }
      .review-chip.is-warn,
      .checklist-item-warn,
      .notice.warn,
      .notice.warning {
        background:rgba(255,181,74,.12);
        border-color:rgba(255,181,74,.22);
        color:#ffe7b6;
      }
      .review-chip.is-error,
      .notice.error {
        background:rgba(255,106,99,.12);
        border-color:rgba(255,106,99,.24);
        color:#ffd3d1;
      }
      .notice.info {
        background:rgba(85,214,255,.12);
        border-color:rgba(85,214,255,.22);
        color:#d7f6ff;
      }
      .notice,
      .checklist-item,
      .section-progress,
      .review-readonly-field {
        padding:14px 16px;
        border-radius:18px;
        border:1px solid rgba(255,255,255,.12);
      }
      .notice,
      .checklist-item,
      .review-readonly-field {
        display:grid;
        gap:4px;
      }
      .notice strong {
        color:inherit;
      }
      .notice-stack,
      .checklist {
        display:grid;
        gap:12px;
      }
      .notice-stack:empty,
      .checklist:empty {
        display:none;
      }
      .checklist-item {
        width:100%;
        background:rgba(255,255,255,.05);
        color:var(--text);
        text-align:left;
      }
      .side-A,
      .setup-language-side-card.side-A,
      .side-card.side-A {
        background:var(--side-a-bg);
        border-color:var(--side-a-border);
      }
      .side-B,
      .setup-language-side-card.side-B,
      .side-card.side-B {
        background:var(--side-b-bg);
        border-color:var(--side-b-border);
      }
      .side-A { color:#8cefff; }
      .side-B { color:#ffd185; }
      .block-label {
        font-size:15px;
        font-weight:700;
      }
      .block-sublabel {
        font-size:13px;
        color:var(--muted);
      }
      .stations-grid,
      .test-stations-grid {
        align-items:start;
      }
      .station-col {
        display:grid;
        gap:14px;
      }
      .display-card h3 {
        margin:0;
      }
      .device-list {
        margin:0;
        padding-left:18px;
        color:var(--muted);
        display:grid;
        gap:4px;
      }
      .wizard-disclosure {
        border-radius:18px;
        border:1px solid rgba(255,255,255,.1);
        background:rgba(255,255,255,.03);
        overflow:hidden;
      }
      .wizard-disclosure summary {
        cursor:pointer;
        list-style:none;
        padding:14px 16px;
        font-size:13px;
        font-weight:700;
        letter-spacing:.04em;
        color:var(--text);
        display:flex;
        align-items:center;
        gap:8px;
      }
      .wizard-disclosure summary::-webkit-details-marker {
        display:none;
      }
      .wizard-disclosure summary::after {
        content:'›';
        font-size:18px;
        line-height:1;
        margin-left:auto;
        display:inline-block;
        transition:transform .18s;
        opacity:.6;
      }
      details[open].wizard-disclosure summary::after {
        transform:rotate(90deg);
      }
      .wizard-disclosure-body {
        padding:0 16px 16px;
        display:grid;
        gap:10px;
      }
      .disclosure-heading {
        display:block;
        font-weight:700;
        color:var(--text);
      }
      .disclosure-subtitle {
        display:block;
        margin-top:4px;
        font-size:13px;
        color:var(--muted);
      }
      .technical-disclosure pre {
        margin:0;
      }
      .setup-language-selector-simple {
        display:grid;
        gap:12px;
      }
      .setup-language-selected {
        display:flex;
        gap:10px;
        align-items:flex-start;
        min-width:0;
      }
      .setup-language-selected > div {
        display:grid;
        gap:4px;
        min-width:0;
      }
      .setup-language-selected strong {
        display:block;
        font-size:16px;
        line-height:1.3;
      }
      .setup-language-selected span {
        color:var(--muted);
        font-size:14px;
        overflow-wrap:anywhere;
      }
      .setup-language-flag-badge {
        width:42px;
        height:28px;
        display:grid;
        place-items:center;
        border-radius:10px;
        overflow:hidden;
        background:rgba(255,255,255,.08);
      }
      .setup-language-flag-badge .visitor-language-flag {
        width:100%;
        height:100%;
        display:block;
      }
      .setup-language-fallback-note {
        color:var(--muted);
        font-size:12px;
        line-height:1.35;
      }
      .setup-language-meta {
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
        gap:8px 16px;
      }
      .segmented-actions > * {
        flex:0 1 180px;
      }
      .save-actions-bar,
      .section-save-bar {
        padding:16px;
        border-radius:20px;
        border:1px solid rgba(255,255,255,.09);
        background:rgba(255,255,255,.03);
      }
      .save-actions-bar > *,
      .section-save-bar > * {
        flex:1 1 220px;
      }
      .save-cta-card {
        align-content:start;
      }
      .autostart-control-row {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        flex-wrap:wrap;
        padding:12px 14px;
        border-radius:var(--radius-md);
        border:1px solid var(--card-border);
        background:rgba(255,255,255,.03);
      }
      .autostart-control-row .card-eyebrow {
        font-size:12px;
        font-weight:700;
        letter-spacing:.06em;
        text-transform:uppercase;
        color:var(--muted);
      }
      .autostart-review-chip {
        display:block;
        min-height:36px;
        line-height:1.5;
      }
      .autostart-review-chip:empty {
        display:none;
      }
      .save-actions-compact {
        justify-content:flex-end;
      }
      .save-actions-compact > * {
        flex:0 0 auto !important;
      }
      .advanced-disclosure > summary {
        cursor:pointer;
        list-style:none;
        display:flex;
        align-items:center;
        gap:8px;
      }
      .advanced-disclosure > summary::-webkit-details-marker {
        display:none;
      }
      .advanced-disclosure > summary::after {
        content:'›';
        font-size:18px;
        line-height:1;
        margin-left:auto;
        display:inline-block;
        transition:transform .18s;
        opacity:.6;
      }
      details[open].advanced-disclosure > summary::after {
        transform:rotate(90deg);
      }
      .provider-card.hidden,
      .field-hidden {
        display:none !important;
      }
      [hidden] {
        display:none !important;
      }
      .section-progress {
        display:grid;
        gap:12px;
        background:rgba(255,255,255,.05);
        border-color:rgba(255,255,255,.14);
      }
      .section-progress[hidden] { display:none !important; }
      .section-progress-inline { padding:12px 14px; }
      .section-progress-copy {
        display:grid;
        gap:4px;
      }
      .meter {
        position:relative;
        height:14px;
        border-radius:999px;
        overflow:hidden;
        background:rgba(255,255,255,.08);
        border:1px solid rgba(255,255,255,.12);
      }
      .meter-bar {
        height:100%;
        width:0%;
        background:linear-gradient(90deg,#22c55e,#eab308,#ef4444);
        transition:width 60ms linear;
      }
      .meter-indeterminate { min-height:12px; }
      .meter-bar-indeterminate {
        width:36%;
        border-radius:999px;
        background:linear-gradient(90deg, rgba(85,214,255,.2), rgba(85,214,255,1), rgba(255,181,74,.45));
        animation:wizard-indeterminate 1.2s ease-in-out infinite;
      }
      .output {
        min-height:150px;
        max-height:340px;
        overflow:auto;
        padding:14px;
        border-radius:18px;
        background:rgba(0,0,0,.22);
        border:1px solid rgba(255,255,255,.08);
        white-space:pre-wrap;
        color:#d8e5f6;
        font-family:Consolas, monospace;
        font-size:13px;
      }
      .test-result { min-height:110px; }
      .top-gap { margin-top:14px; }
      @keyframes wizard-indeterminate {
        0% { transform:translateX(-120%); }
        100% { transform:translateX(320%); }
      }
      @media (max-width:1180px) {
        .wizard-grid-2,
        .wizard-grid-3,
        .shell-overview-grid,
        .form-grid,
        .provider-grid,
        .display-grid,
        .stations-grid,
        .test-stations-grid,
        .profile-choice-grid,
        .license-overview-grid,
        .license-form-grid,
        .kiosk-card-grid {
          grid-template-columns:1fr;
        }
      }
      @media (max-width:760px) {
        .shell {
          width:min(100vw - 16px, 100%);
          margin:12px auto 20px;
          gap:16px;
        }
        .hero,
        .panel {
          padding:18px;
          border-radius:24px;
        }
        .card,
        .settings-card,
        .save-review-card,
        .setup-language-select-card,
        .setup-language-info-card,
        .display-card,
        .diagnostic-subcard {
          padding:16px;
        }
        .section-heading,
        .card-heading,
        .hero-top {
          flex-direction:column;
          align-items:stretch;
        }
        .section-link,
        .actions > *,
        .save-actions-bar > * {
          flex:1 1 100%;
        }
      }
`,
SETUP_WIZARD_CONTROL_LICENSE_STYLE].join("\n");
