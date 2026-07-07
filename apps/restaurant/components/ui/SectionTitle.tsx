type Props = {
  subtitle: string;
  title: string;
  description?: string;
};

export default function SectionTitle({
  subtitle,
  title,
  description,
}: Props) {
  return (
    <div className="max-w-3xl">
      <div className="mb-5 text-sm font-black uppercase tracking-[0.35em] text-amber-300">
        {subtitle}
      </div>

      <h2 className="text-5xl font-black leading-tight md:text-6xl">
        {title}
      </h2>

      {description && (
        <p className="mt-8 text-lg leading-8 text-zinc-300">
          {description}
        </p>
      )}
    </div>
  );
}