export function PageIntro({
  label,
  title,
  intro,
}: {
  label: string;
  title: string;
  intro: string;
}) {
  return (
    <div className="page-intro">
      <p className="eyebrow">{label}</p>
      <h1>{title}</h1>
      {intro && <p>{intro}</p>}
    </div>
  );
}
