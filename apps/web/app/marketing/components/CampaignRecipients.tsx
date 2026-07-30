'use client';

import { AlertTriangle, Mail, Users } from 'lucide-react';

import type {
  MarketingRecipient,
  RecipientStatus,
} from '../lib/marketing-types';
import StatusBadge from './StatusBadge';

type Props = {
  recipients?: MarketingRecipient[];
  totalRecipients?: number;
};

function formatDate(value?: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getRecipientEventDate(
  recipient: MarketingRecipient,
) {
  switch (recipient.status) {
    case 'CLICKED':
      return recipient.clickedAt;

    case 'OPENED':
      return recipient.openedAt;

    case 'DELIVERED':
      return recipient.deliveredAt;

    case 'SENT':
      return recipient.sentAt;

    case 'FAILED':
      return recipient.failedAt;

    default:
      return recipient.updatedAt;
  }
}

function statusPriority(status: RecipientStatus) {
  const priorities: Record<RecipientStatus, number> = {
    FAILED: 1,
    SENDING: 2,
    QUEUED: 3,
    PENDING: 4,
    CLICKED: 5,
    OPENED: 6,
    DELIVERED: 7,
    SENT: 8,
    SKIPPED: 9,
  };

  return priorities[status];
}

export default function CampaignRecipients({
  recipients = [],
  totalRecipients = 0,
}: Props) {
  const sortedRecipients = [...recipients].sort((a, b) => {
    const statusDifference =
      statusPriority(a.status) - statusPriority(b.status);

    if (statusDifference !== 0) {
      return statusDifference;
    }

    return (
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
    );
  });

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/70 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col gap-3 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users size={19} className="text-emerald-300" />

            <h2 className="text-lg font-black text-white">
              Recipients
            </h2>
          </div>

          <p className="mt-1 text-sm text-zinc-500">
            Showing {recipients.length} of {totalRecipients} recipients.
          </p>
        </div>

        {totalRecipients > recipients.length && (
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-black text-zinc-400">
            Latest 100 shown
          </div>
        )}
      </div>

      {sortedRecipients.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-500">
            <Mail size={24} />
          </div>

          <h3 className="mt-4 font-black text-white">
            No recipients prepared
          </h3>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">
            Use the Prepare recipients button to build the recipient list for
            this campaign.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/10">
          {sortedRecipients.map((recipient) => (
            <article
              key={recipient.id}
              className="grid gap-4 px-6 py-5 transition hover:bg-white/[0.025] lg:grid-cols-[1fr_auto_180px]"
            >
              <div className="min-w-0">
                <div className="truncate font-black text-white">
                  {recipient.name?.trim() || 'Guest'}
                </div>

                <div className="mt-1 truncate text-sm text-zinc-500">
                  {recipient.email}
                </div>

                {recipient.errorMessage && (
                  <div className="mt-3 flex items-start gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs leading-5 text-red-300">
                    <AlertTriangle
                      size={14}
                      className="mt-0.5 shrink-0"
                    />
                    <span>{recipient.errorMessage}</span>
                  </div>
                )}
              </div>

              <div className="flex items-start lg:justify-center">
                <StatusBadge status={recipient.status} />
              </div>

              <div className="text-sm text-zinc-500 lg:text-right">
                <div>
                  {formatDate(getRecipientEventDate(recipient))}
                </div>

                <div className="mt-1 text-xs text-zinc-700">
                  Attempts: {recipient.attempts ?? 0}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}