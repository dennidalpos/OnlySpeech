interface RuntimeDisclosureCardProps {
  title: string;
  paragraphs: string[];
}

export function RuntimeDisclosureCard(props: RuntimeDisclosureCardProps) {
  return (
    <div className="runtime-disclosure-card" role="note" aria-label={props.title}>
      <strong>{props.title}</strong>
      {props.paragraphs.map((paragraph, index) => (
        <p key={`${props.title}-${index}`}>{paragraph}</p>
      ))}
    </div>
  );
}
