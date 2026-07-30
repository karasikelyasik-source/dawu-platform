'use client';

import Link from 'next/link';
import {
  Loader2,
  Pencil,
  RefreshCw,
  Send,
  Trash2,
  Users,
} from 'lucide-react';

import type { MarketingCampaign } from '../lib/marketing-types';

type Props = {
  campaign: MarketingCampaign;
  preparing: boolean;
  sending: boolean;
  deleting: boolean;
  refreshing: boolean;
  onPrepare: () => void;
  onSend: () => void;
  onDelete: () => void;
  onRefresh: () => void;
};

export default function CampaignActions({
  campaign,
  preparing,
  sending,
  deleting,
  refreshing,
  onPrepare,
  onSend,
  onDelete,
  onRefresh,
}: Props) {
  const busy =
    preparing || sending || deleting || refreshing;

  const canEdit =
    campaign.status !== 'SENDING' &&
    campaign.status !== 'SENT';

  const canPrepare =
    campaign.status !== 'SENDING' &&
    campaign.status !== 'SENT';

  const canSend =
    campaign.status !== 'SENDING' &&
    campaign.status !== 'SENT';

  return (
    <section className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-5 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-black text-white">
            Campaign actions
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Prepare recipients, send the campaign or manage the draft.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-zinc-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshCw
              size={17}
              className={refreshing ? 'animate-spin' : ''}
            />
            Refresh
          </button>

          {canEdit && (
            <Link
              href={`/marketing/campaigns/${campaign.id}/edit`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-white transition hover:bg-white/[0.08]"
            >
              <Pencil size={17} />
              Edit
            </Link>
          )}

          <button
            type="button"
            onClick={onPrepare}
            disabled={busy || !canPrepare}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm font-black text-blue-300 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {preparing ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Users size={17} />
            )}
            Prepare recipients
          </button>

          <button
            type="button"
            onClick={onSend}
            disabled={busy || !canSend}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500 px-4 py-3 text-sm font-black text-zinc-950 shadow-lg shadow-emerald-500/15 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Send size={17} />
            )}
            Send campaign
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={busy || campaign.status === 'SENDING'}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Trash2 size={17} />
            )}
            Delete
          </button>
        </div>
      </div>
    </section>
  );
}