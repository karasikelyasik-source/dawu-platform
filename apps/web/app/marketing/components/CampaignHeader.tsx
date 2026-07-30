'use client';

import Link from 'next/link';
import { ArrowLeft, CalendarClock, Mail } from 'lucide-react';

import type { MarketingCampaign } from '../lib/marketing-types';
import StatusBadge from './StatusBadge';

type Props = {
  campaign: MarketingCampaign;
};

function formatDate(value?: string | null) {
  if (!value) return '—';

  return new Intl.DateTimeFormat('en-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function CampaignHeader({
  campaign,
}: Props) {
  return (
    <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <Link
          href="/marketing/campaigns"
          className="mb-4 inline-flex items-center gap-2 text-sm font-black text-zinc-500 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to campaigns
        </Link>

        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
          <Mail size={14} />
          Campaign
        </div>

        <h1 className="mt-4 text-4xl font-black tracking-tight text-white">
          {campaign.name}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <StatusBadge status={campaign.status} />

          {campaign.scheduledAt && (
            <div className="inline-flex items-center gap-2 text-sm text-zinc-500">
              <CalendarClock size={15} />
              Scheduled {formatDate(campaign.scheduledAt)}
            </div>
          )}
        </div>

        <div className="mt-5 text-zinc-400">
          {campaign.subject}
        </div>
      </div>
    </section>
  );
}