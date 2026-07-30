import type { LucideIcon } from 'lucide-react';

type StatCardProps = {
  label: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  loading?: boolean;
};

export default function StatCard({
  label,
  value,
  description,
  icon: Icon,
  loading = false,
}: StatCardProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-xl backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-zinc-500">
            {label}
          </div>

          <div className="mt-3 text-3xl font-black text-white">
            {loading ? '—' : value}
          </div>

          {description && (
            <div className="mt-2 text-xs leading-5 text-zinc-600">
              {description}
            </div>
          )}
        </div>

        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-emerald-300">
            <Icon size={19} />
          </div>
        )}
      </div>
    </article>
  );
}