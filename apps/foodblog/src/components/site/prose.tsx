/** Renders plain-text blocks as paragraphs, preserving blank-line breaks. */
export function Prose({ text, className }: { text: string; className?: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  return (
    <div className={className}>
      {paragraphs.map((paragraph, index) => (
        // Paragraph order is fixed by the source text, so the index is stable.
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}
