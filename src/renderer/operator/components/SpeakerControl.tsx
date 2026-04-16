interface SpeakerControlProps {
  active: boolean;
  disabled: boolean;
  label: string;
  status: string | null;
  title: string;
  onClick: () => void;
}

export function SpeakerControl({ active, disabled, label, status, title, onClick }: SpeakerControlProps) {
  return (
    <div className="speaker-control">
      <button
        className={`speaker-button${active ? " active" : ""}`}
        type="button"
        onClick={onClick}
        aria-label={title}
        aria-pressed={active}
        disabled={disabled}
        title={title}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14.5 4.2a1 1 0 0 1 1.7.71v14.18a1 1 0 0 1-1.7.71l-5.25-5.05H5a1 1 0 0 1-1-1V9.25a1 1 0 0 1 1-1h4.25L14.5 4.2Zm3.7 2.58a1 1 0 0 1 1.41 0 7.64 7.64 0 0 1 0 10.44 1 1 0 1 1-1.42-1.4 5.64 5.64 0 0 0 0-7.64 1 1 0 0 1 0-1.4Zm-2.85 2.13a1 1 0 0 1 1.41 0 4.6 4.6 0 0 1 0 6.18 1 1 0 1 1-1.41-1.4 2.6 2.6 0 0 0 0-3.39 1 1 0 0 1 0-1.4Z" />
        </svg>
        <span>{label}</span>
      </button>
      <span className="speaker-status" role="status" aria-live="polite">
        {status ?? ""}
      </span>
    </div>
  );
}
