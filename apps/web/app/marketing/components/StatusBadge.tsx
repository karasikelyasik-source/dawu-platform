import type {
  CampaignStatus,
  RecipientStatus,
} from '../lib/marketing-types';

type Status = CampaignStatus | RecipientStatus;

type StatusBadgeProps = {
  status: Status;
};

function getStatusClasses(status: Status) {
  switch (status) {
    case 'SENT':
    case 'DELIVERED':
      return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';

    case 'OPENED':
      return 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300';

    case 'CLICKED':
      return 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300';

    case 'SENDING':
      return 'border-sky-500/20 bg-sky-500/10 text-sky-300';

    case 'QUEUED':
      return 'border-blue-500/20 bg-blue-500/10 text-blue-300';

    case 'SCHEDULED':
      return 'border-violet-500/20 bg-violet-500/10 text-violet-300';

    case 'FAILED':
      return 'border-red-500/20 bg-red-500/10 text-red-300';

    case 'SKIPPED':
    case 'CANCELLED':
      return 'border-zinc-500/20 bg-zinc-500/10 text-zinc-400';

    case 'PENDING':
      return 'border-amber-500/20 bg-amber-500/10 text-amber-300';

    default:
      return 'border-white/10 bg-white/[0.05] text-zinc-300';
  }
}

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${getStatusClasses(
        status,
      )}`}
    >
      {status.replaceAll('_', ' ')}
    </span>
  );
}