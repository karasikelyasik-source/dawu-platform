import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Mail,
  Send,
  Users,
} from 'lucide-react';

import type { MarketingCampaign } from '../lib/marketing-types';

type Props = {
  campaign: MarketingCampaign;
};

type TimelineItem = {
  label: string;
  description: string;
  date?: string | null;
  completed: boolean;
  icon: typeof Mail;
};

function formatDate(value?: string | null) {
  if (!value) {
    return 'Not completed';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat('en-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function CampaignTimeline({
  campaign,
}: Props) {
  const recipientsPrepared =
    campaign.totalRecipients > 0 ||
    campaign.status === 'QUEUED' ||
    campaign.status === 'SENDING' ||
    campaign.status === 'SENT';

  const sendingStarted =
    Boolean(campaign.startedAt) ||
    campaign.status === 'SENDING' ||
    campaign.status === 'SENT';

  const completed =
    Boolean(campaign.completedAt) ||
    campaign.status === 'SENT' ||
    campaign.status === 'FAILED';

  const timeline: TimelineItem[] = [
    {
      label: 'Campaign created',
      description: 'The campaign was created and saved.',
      date: campaign.createdAt,
      completed: true,
      icon: Mail,
    },
    {
      label: 'Recipients prepared',
      description:
        campaign.totalRecipients > 0
          ? `${campaign.totalRecipients} recipients were added.`
          : 'The recipient list has not been prepared yet.',
      date: recipientsPrepared
        ? campaign.updatedAt
        : null,
      completed: recipientsPrepared,
      icon: Users,
    },
    {
      label: 'Campaign scheduled',
      description: campaign.scheduledAt
        ? 'The campaign has a scheduled delivery time.'
        : 'No scheduled delivery time.',
      date: campaign.scheduledAt,
      completed: Boolean(campaign.scheduledAt),
      icon: CalendarClock,
    },
    {
      label: 'Sending started',
      description: sendingStarted
        ? 'Email delivery was started.'
        : 'Sending has not started.',
      date: campaign.startedAt,
      completed: sendingStarted,
      icon: Send,
    },
    {
      label: 'Campaign completed',
      description: completed
        ? campaign.status === 'FAILED'
          ? 'The campaign finished with errors.'
          : 'The campaign delivery was completed.'
        : 'The campaign has not been completed.',
      date: campaign.completedAt,
      completed,
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 shadow-2xl backdrop-blur-xl">
      <div>
        <div className="flex items-center gap-2">
          <Clock3 size={19} className="text-emerald-300" />

          <h2 className="text-lg font-black text-white">
            Timeline
          </h2>
        </div>

        <p className="mt-1 text-sm text-zinc-500">
          Campaign progress and important events.
        </p>
      </div>

      <div className="mt-7">
        {timeline.map((item, index) => {
          const Icon = item.icon;
          const isLast = index === timeline.length - 1;

          return (
            <div
              key={item.label}
              className="relative flex gap-4"
            >
              {!isLast && (
                <div
                  className={`absolute left-[19px] top-10 h-[calc(100%-8px)] w-px ${
                    item.completed
                      ? 'bg-emerald-500/40'
                      : 'bg-white/10'
                  }`}
                />
              )}

              <div
                className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                  item.completed
                    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                    : 'border-white/10 bg-white/[0.04] text-zinc-600'
                }`}
              >
                <Icon size={17} />
              </div>

              <div className={isLast ? '' : 'pb-7'}>
                <div
                  className={`font-black ${
                    item.completed
                      ? 'text-white'
                      : 'text-zinc-500'
                  }`}
                >
                  {item.label}
                </div>

                <div className="mt-1 text-sm leading-6 text-zinc-500">
                  {item.description}
                </div>

                <div className="mt-2 text-xs font-bold text-zinc-700">
                  {formatDate(item.date)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}