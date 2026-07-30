'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Eye,
  Mail,
  MousePointerClick,
  Plus,
  Send,
  Tag,
  Users,
} from 'lucide-react';

type RecentCampaign = {
  id: string;
  name: string;
  subject: string;
  status: string;
  sentAt?: string | null;
  scheduledAt?: string | null;
  createdAt: string;
  totalRecipients?: number;
  sentCount?: number;
  openedCount?: number;
  clickedCount?: number;
};

type MarketingDashboard = {
  totalCustomers: number;
  totalCampaigns: number;
  activePromoCodes: number;
  totalRecipients: number;
  emailsSent: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  failedCount: number;
  openRate: number;
  clickRate: number;
  recentCampaigns: RecentCampaign[];
};

const emptyDashboard: MarketingDashboard = {
  totalCustomers: 0,
  totalCampaigns: 0,
  activePromoCodes: 0,
  totalRecipients: 0,
  emailsSent: 0,
  deliveredCount: 0,
  openedCount: 0,
  clickedCount: 0,
  failedCount: 0,
  openRate: 0,
  clickRate: 0,
  recentCampaigns: [],
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-NL').format(value);
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) {
    return '0%';
  }

  return `${value.toFixed(1)}%`;
}

function formatDate(value?: string | null) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getStatusClasses(status: string) {
  switch (status) {
    case 'SENT':
      return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';

    case 'SENDING':
    case 'QUEUED':
      return 'border-sky-500/20 bg-sky-500/10 text-sky-300';

    case 'SCHEDULED':
      return 'border-violet-500/20 bg-violet-500/10 text-violet-300';

    case 'FAILED':
      return 'border-red-500/20 bg-red-500/10 text-red-300';

    case 'CANCELLED':
    case 'ARCHIVED':
      return 'border-zinc-500/20 bg-zinc-500/10 text-zinc-300';

    default:
      return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
  }
}

export default function MarketingPage() {
  const [dashboard, setDashboard] =
    useState<MarketingDashboard>(emptyDashboard);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDashboard() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api-proxy/marketing/dashboard', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Marketing API returned ${response.status}`);
      }

      const data = (await response.json()) as MarketingDashboard;

      setDashboard({
        ...emptyDashboard,
        ...data,
        recentCampaigns: Array.isArray(data.recentCampaigns)
          ? data.recentCampaigns
          : [],
      });
    } catch (requestError) {
      console.error(requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not load marketing dashboard.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const statCards = [
    {
      label: 'Customers',
      value: formatNumber(dashboard.totalCustomers),
      description: 'Available marketing audience',
      icon: Users,
    },
    {
      label: 'Campaigns',
      value: formatNumber(dashboard.totalCampaigns),
      description: 'All email campaigns',
      icon: Mail,
    },
    {
      label: 'Active promo codes',
      value: formatNumber(dashboard.activePromoCodes),
      description: 'Ready to use in campaigns',
      icon: Tag,
    },
    {
      label: 'Emails sent',
      value: formatNumber(dashboard.emailsSent),
      description: `${formatNumber(dashboard.failedCount)} failed`,
      icon: Send,
    },
  ];

  const performanceCards = [
    {
      label: 'Open rate',
      value: formatPercent(dashboard.openRate),
      detail: `${formatNumber(dashboard.openedCount)} opened`,
      icon: Eye,
    },
    {
      label: 'Click rate',
      value: formatPercent(dashboard.clickRate),
      detail: `${formatNumber(dashboard.clickedCount)} clicked`,
      icon: MousePointerClick,
    },
    {
      label: 'Delivered',
      value: formatNumber(dashboard.deliveredCount),
      detail: `${formatNumber(dashboard.totalRecipients)} recipients`,
      icon: BarChart3,
    },
  ];

  return (
    <main className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 shadow-2xl backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
              <Mail size={14} />
              DaWu Marketing
            </div>

            <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
              Marketing Dashboard
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
              Create email campaigns, manage audiences, promote offers and
              measure customer engagement.
            </p>
          </div>

          <a
            href="/marketing/new"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500 px-5 py-3 font-black text-zinc-950 shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-400"
          >
            <Plus size={19} />
            New Campaign
          </a>
        </div>
      </section>

      {error && (
        <section className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5">
          <div className="font-black text-red-300">
            Could not load marketing data
          </div>

          <div className="mt-1 text-sm text-red-200/70">{error}</div>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-black text-red-200 transition hover:bg-red-500/20"
          >
            Try again
          </button>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-xl backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-zinc-400">
                    {card.label}
                  </div>

                  <div className="mt-3 text-3xl font-black text-white">
                    {loading ? '—' : card.value}
                  </div>

                  <div className="mt-2 text-xs leading-5 text-zinc-500">
                    {card.description}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-emerald-300">
                  <Icon size={21} />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
        <article className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-white">
                Recent Campaigns
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Latest marketing activity and performance.
              </p>
            </div>

            <a
              href="/marketing/campaigns"
              className="inline-flex items-center gap-2 text-sm font-black text-emerald-300 transition hover:text-emerald-200"
            >
              View all
              <ArrowRight size={16} />
            </a>
          </div>

          <div className="mt-6">
            {!loading && dashboard.recentCampaigns.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-400">
                  <Mail size={25} />
                </div>

                <h3 className="mt-5 text-lg font-black text-white">
                  No campaigns yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                  Create your first campaign to send promotions, announcements
                  or loyalty offers to DaWu customers.
                </p>

                <a
                  href="/marketing/new"
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]"
                >
                  <Plus size={17} />
                  Create campaign
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {loading
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-24 animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]"
                      />
                    ))
                  : dashboard.recentCampaigns.map((campaign) => (
                      <a
                        key={campaign.id}
                        href={`/marketing/${campaign.id}`}
                        className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-white/20 hover:bg-white/[0.05] md:flex-row md:items-center md:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="truncate font-black text-white">
                              {campaign.name}
                            </h3>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${getStatusClasses(
                                campaign.status,
                              )}`}
                            >
                              {campaign.status}
                            </span>
                          </div>

                          <div className="mt-1 truncate text-sm text-zinc-400">
                            {campaign.subject}
                          </div>

                          <div className="mt-2 text-xs text-zinc-600">
                            {formatDate(
                              campaign.sentAt ??
                                campaign.scheduledAt ??
                                campaign.createdAt,
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 text-left md:text-right">
                          <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                              Sent
                            </div>
                            <div className="mt-1 font-black text-zinc-200">
                              {formatNumber(campaign.sentCount ?? 0)}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                              Opened
                            </div>
                            <div className="mt-1 font-black text-zinc-200">
                              {formatNumber(campaign.openedCount ?? 0)}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                              Clicked
                            </div>
                            <div className="mt-1 font-black text-zinc-200">
                              {formatNumber(campaign.clickedCount ?? 0)}
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
              </div>
            )}
          </div>
        </article>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 shadow-2xl backdrop-blur-xl">
            <h2 className="text-xl font-black text-white">Performance</h2>

            <p className="mt-1 text-sm text-zinc-500">
              Overall campaign engagement.
            </p>

            <div className="mt-6 space-y-3">
              {performanceCards.map((card) => {
                const Icon = card.icon;

                return (
                  <div
                    key={card.label}
                    className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.025] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-emerald-300">
                        <Icon size={19} />
                      </div>

                      <div>
                        <div className="text-sm font-bold text-zinc-400">
                          {card.label}
                        </div>

                        <div className="mt-1 text-xs text-zinc-600">
                          {card.detail}
                        </div>
                      </div>
                    </div>

                    <div className="text-xl font-black text-white">
                      {loading ? '—' : card.value}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 to-zinc-950 p-6 shadow-2xl">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
              Quick action
            </div>

            <h2 className="mt-3 text-2xl font-black text-white">
              Reach your customers
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Send a promotion to all customers or create a targeted campaign
              for selected recipients.
            </p>

            <a
              href="/marketing/new"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-zinc-950 transition hover:bg-zinc-200"
            >
              <Plus size={18} />
              Create Campaign
            </a>
          </section>
        </aside>
      </section>
    </main>
  );
}