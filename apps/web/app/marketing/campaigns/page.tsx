'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarClock,
  Eye,
  Loader2,
  Mail,
  MousePointerClick,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Users,
} from 'lucide-react';

type CampaignStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'QUEUED'
  | 'SENDING'
  | 'SENT'
  | 'FAILED'
  | 'CANCELLED';

type PromoCode = {
  id: string;
  code: string;
  name: string;
  discountType: string;
  discountValue: number;
  isActive: boolean;
};

type Campaign = {
  id: string;
  name: string;
  subject: string;
  previewText?: string | null;
  status: CampaignStatus;
  audienceType?: string | null;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  failedCount: number;
  scheduledAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  promoCode?: PromoCode | null;
  _count?: {
    recipients: number;
  };
};

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat('en-NL').format(value ?? 0);
}

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

function calculateRate(value: number, sentCount: number) {
  if (sentCount <= 0) {
    return '0%';
  }

  return `${((value / sentCount) * 100).toFixed(1)}%`;
}

function getStatusClasses(status: CampaignStatus) {
  switch (status) {
    case 'SENT':
      return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';

    case 'SENDING':
      return 'border-sky-500/20 bg-sky-500/10 text-sky-300';

    case 'QUEUED':
      return 'border-blue-500/20 bg-blue-500/10 text-blue-300';

    case 'SCHEDULED':
      return 'border-violet-500/20 bg-violet-500/10 text-violet-300';

    case 'FAILED':
      return 'border-red-500/20 bg-red-500/10 text-red-300';

    case 'CANCELLED':
      return 'border-zinc-500/20 bg-zinc-500/10 text-zinc-400';

    default:
      return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
  }
}

export default function MarketingCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState('');

  async function loadCampaigns(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const response = await fetch('/api-proxy/marketing/campaigns', {
        cache: 'no-store',
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = Array.isArray(data?.message)
          ? data.message.join(', ')
          : data?.message;

        throw new Error(
          message || `Marketing API returned ${response.status}`,
        );
      }

      setCampaigns(Array.isArray(data) ? data : []);
    } catch (requestError) {
      console.error(requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not load campaigns.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadCampaigns();
  }, []);

  const filteredCampaigns = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return campaigns.filter((campaign) => {
      const matchesStatus =
        statusFilter === 'ALL' || campaign.status === statusFilter;

      const matchesSearch =
        !normalizedSearch ||
        campaign.name.toLowerCase().includes(normalizedSearch) ||
        campaign.subject.toLowerCase().includes(normalizedSearch) ||
        campaign.promoCode?.code
          ?.toLowerCase()
          .includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [campaigns, search, statusFilter]);

  async function deleteCampaign(campaign: Campaign) {
    const confirmed = window.confirm(
      `Delete campaign "${campaign.name}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(campaign.id);
      setError('');

      const response = await fetch(
        `/api-proxy/marketing/campaigns/${campaign.id}`,
        {
          method: 'DELETE',
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = Array.isArray(data?.message)
          ? data.message.join(', ')
          : data?.message;

        throw new Error(
          message || `Delete API returned ${response.status}`,
        );
      }

      setCampaigns((current) =>
        current.filter((item) => item.id !== campaign.id),
      );
    } catch (requestError) {
      console.error(requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not delete campaign.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="space-y-8">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <a
            href="/marketing"
            className="mb-4 inline-flex items-center gap-2 text-sm font-black text-zinc-500 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Marketing
          </a>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
            <Mail size={14} />
            Campaign Management
          </div>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
            Campaigns
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400 md:text-base">
            View, manage and analyse all DaWu email campaigns.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadCampaigns(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/70 px-5 py-3 font-black text-zinc-300 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              size={18}
              className={refreshing ? 'animate-spin' : ''}
            />
            Refresh
          </button>

          <a
            href="/marketing/new"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500 px-5 py-3 font-black text-zinc-950 shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-400"
          >
            <Plus size={18} />
            New Campaign
          </a>
        </div>
      </section>

      {error && (
        <section className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5">
          <div className="font-black text-red-300">
            Something went wrong
          </div>
          <div className="mt-1 text-sm text-red-200/70">{error}</div>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-xl">
          <div className="text-sm font-bold text-zinc-500">
            Total campaigns
          </div>
          <div className="mt-3 text-3xl font-black text-white">
            {loading ? '—' : formatNumber(campaigns.length)}
          </div>
        </article>

        <article className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-xl">
          <div className="text-sm font-bold text-zinc-500">Sent</div>
          <div className="mt-3 text-3xl font-black text-emerald-300">
            {loading
              ? '—'
              : formatNumber(
                  campaigns.filter((item) => item.status === 'SENT')
                    .length,
                )}
          </div>
        </article>

        <article className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-xl">
          <div className="text-sm font-bold text-zinc-500">Drafts</div>
          <div className="mt-3 text-3xl font-black text-amber-300">
            {loading
              ? '—'
              : formatNumber(
                  campaigns.filter((item) => item.status === 'DRAFT')
                    .length,
                )}
          </div>
        </article>

        <article className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-xl">
          <div className="text-sm font-bold text-zinc-500">
            Total recipients
          </div>
          <div className="mt-3 text-3xl font-black text-white">
            {loading
              ? '—'
              : formatNumber(
                  campaigns.reduce(
                    (total, campaign) =>
                      total + (campaign.totalRecipients ?? 0),
                    0,
                  ),
                )}
          </div>
        </article>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-5 shadow-2xl backdrop-blur-xl">
        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <label className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by campaign name, subject or promo code..."
              className="w-full rounded-2xl border border-white/10 bg-black/30 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500/40"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none focus:border-emerald-500/40"
          >
            <option value="ALL">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="QUEUED">Queued</option>
            <option value="SENDING">Sending</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-5 shadow-2xl backdrop-blur-xl">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]"
              />
            ))}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-400">
              <Mail size={28} />
            </div>

            <h2 className="mt-5 text-xl font-black text-white">
              {campaigns.length === 0
                ? 'No campaigns yet'
                : 'No matching campaigns'}
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">
              {campaigns.length === 0
                ? 'Create your first email campaign to reach DaWu customers.'
                : 'Try changing the search text or status filter.'}
            </p>

            {campaigns.length === 0 && (
              <a
                href="/marketing/new"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-black text-zinc-950 transition hover:bg-emerald-400"
              >
                <Plus size={18} />
                Create Campaign
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => (
              <article
                key={campaign.id}
                className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-white/20 hover:bg-white/[0.045]"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <a
                        href={`/marketing/campaigns/${campaign.id}`}
                        className="truncate text-lg font-black text-white transition hover:text-emerald-300"
                      >
                        {campaign.name}
                      </a>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${getStatusClasses(
                          campaign.status,
                        )}`}
                      >
                        {campaign.status}
                      </span>

                      {campaign.promoCode && (
                        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-black text-amber-300">
                          {campaign.promoCode.code}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 truncate text-sm text-zinc-400">
                      {campaign.subject}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-600">
                      <span>Created: {formatDate(campaign.createdAt)}</span>

                      {campaign.scheduledAt && (
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarClock size={13} />
                          Scheduled: {formatDate(campaign.scheduledAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[470px]">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-600">
                        <Users size={13} />
                        Recipients
                      </div>
                      <div className="mt-2 font-black text-white">
                        {formatNumber(
                          campaign.totalRecipients ||
                            campaign._count?.recipients,
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-600">
                        <Send size={13} />
                        Sent
                      </div>
                      <div className="mt-2 font-black text-white">
                        {formatNumber(campaign.sentCount)}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-600">
                        <Eye size={13} />
                        Open rate
                      </div>
                      <div className="mt-2 font-black text-white">
                        {calculateRate(
                          campaign.openedCount ?? 0,
                          campaign.sentCount ?? 0,
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-600">
                        <MousePointerClick size={13} />
                        Click rate
                      </div>
                      <div className="mt-2 font-black text-white">
                        {calculateRate(
                          campaign.clickedCount ?? 0,
                          campaign.sentCount ?? 0,
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={`/marketing/campaigns/${campaign.id}`}
                      className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]"
                    >
                      Open
                    </a>

                    <button
                      type="button"
                      onClick={() => void deleteCampaign(campaign)}
                      disabled={
                        deletingId === campaign.id ||
                        campaign.status === 'SENDING'
                      }
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                      title="Delete campaign"
                    >
                      {deletingId === campaign.id ? (
                        <Loader2 size={17} className="animate-spin" />
                      ) : (
                        <Trash2 size={17} />
                      )}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}