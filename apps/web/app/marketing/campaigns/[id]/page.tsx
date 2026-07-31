'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
  Tag,
  UserRound,
} from 'lucide-react';

import CampaignActions from '../../components/CampaignActions';
import CampaignHeader from '../../components/CampaignHeader';
import CampaignRecipients from '../../components/CampaignRecipients';
import CampaignStats from '../../components/CampaignStats';
import CampaignTimeline from '../../components/CampaignTimeline';
import EmailPreview from '../../components/EmailPreview';
import SendToContactModal from '../../components/SendToContactModal';

import {
  deleteCampaign,
  getCampaign,
  prepareCampaignRecipients,
  sendCampaign,
  sendCampaignToContact,
} from '../../lib/marketing-api';

import type { MarketingCampaign } from '../../lib/marketing-types';

type Notice = {
  type: 'success' | 'error';
  message: string;
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

function formatAudience(value?: string | null) {
  if (!value) {
    return 'All customers';
  }

  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getOpenRate(campaign: MarketingCampaign) {
  if (campaign.sentCount <= 0) {
    return 0;
  }

  return Math.round(
    (campaign.openedCount / campaign.sentCount) * 100,
  );
}

function getClickRate(campaign: MarketingCampaign) {
  if (campaign.sentCount <= 0) {
    return 0;
  }

  return Math.round(
    (campaign.clickedCount / campaign.sentCount) * 100,
  );
}

export default function CampaignDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const campaignId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [campaign, setCampaign] =
    useState<MarketingCampaign | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const [sendingToContact, setSendingToContact] =
    useState(false);

  const [
    sendToContactModalOpen,
    setSendToContactModalOpen,
  ] = useState(false);

  const loadCampaign = useCallback(
    async (silent = false) => {
      if (!campaignId) {
        setError('Campaign ID is missing.');
        setLoading(false);
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const result = await getCampaign(campaignId);
        setCampaign(result);
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load campaign.';

        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [campaignId],
  );

  useEffect(() => {
    void loadCampaign();
  }, [loadCampaign]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setNotice(null);
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  async function handlePrepare() {
    if (!campaign) {
      return;
    }

    const confirmed = window.confirm(
      'Prepare the recipient list for this campaign? Existing recipients may be recalculated.',
    );

    if (!confirmed) {
      return;
    }

    setPreparing(true);
    setNotice(null);

    try {
      const result = await prepareCampaignRecipients(
        campaign.id,
      );

      setCampaign(result);

      setNotice({
        type: 'success',
        message: `Recipients prepared successfully. Total recipients: ${
          result.totalRecipients ?? 0
        }.`,
      });
    } catch (prepareError) {
      setNotice({
        type: 'error',
        message:
          prepareError instanceof Error
            ? prepareError.message
            : 'Failed to prepare recipients.',
      });
    } finally {
      setPreparing(false);
    }
  }

  async function handleSend() {
    if (!campaign) {
      return;
    }

    if (campaign.totalRecipients <= 0) {
      setNotice({
        type: 'error',
        message:
          'Prepare the recipient list before sending the campaign.',
      });

      return;
    }

    const confirmed = window.confirm(
      `Send "${campaign.name}" to ${campaign.totalRecipients} recipients?\n\nThis action will start sending real emails.`,
    );

    if (!confirmed) {
      return;
    }

    setSending(true);
    setNotice(null);

    try {
      const result = await sendCampaign(campaign.id);

      setCampaign(result.campaign);

      setNotice({
        type: result.failedCount > 0 ? 'error' : 'success',
        message:
          result.failedCount > 0
            ? `Campaign completed. Sent: ${result.sentCount}. Failed: ${result.failedCount}.`
            : `Campaign sent successfully to ${result.sentCount} recipients.`,
      });
    } catch (sendError) {
      setNotice({
        type: 'error',
        message:
          sendError instanceof Error
            ? sendError.message
            : 'Failed to send campaign.',
      });

      await loadCampaign(true);
    } finally {
      setSending(false);
    }
  }

  async function handleSendToContact(data: {
    name?: string;
    email: string;
  }) {
    if (!campaign) {
      return;
    }

    setSendingToContact(true);
    setNotice(null);

    try {
      const result = await sendCampaignToContact(
        campaign.id,
        data,
      );

      setSendToContactModalOpen(false);

      setNotice({
        type: 'success',
        message:
          result.message ||
          `Email was queued successfully for ${result.email}.`,
      });
    } catch (sendError) {
      setNotice({
        type: 'error',
        message:
          sendError instanceof Error
            ? sendError.message
            : 'Failed to send email to contact.',
      });
    } finally {
      setSendingToContact(false);
    }
  }

  async function handleDelete() {
    if (!campaign) {
      return;
    }

    const confirmed = window.confirm(
      `Delete campaign "${campaign.name}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setNotice(null);

    try {
      await deleteCampaign(campaign.id);
      router.push('/marketing/campaigns');
      router.refresh();
    } catch (deleteError) {
      setNotice({
        type: 'error',
        message:
          deleteError instanceof Error
            ? deleteError.message
            : 'Failed to delete campaign.',
      });

      setDeleting(false);
    }
  }

  async function handleRefresh() {
    await loadCampaign(true);

    setNotice({
      type: 'success',
      message: 'Campaign data refreshed.',
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#09090b] px-5 py-8 text-white sm:px-8 lg:px-10">
        <div className="mx-auto flex min-h-[70vh] max-w-[1600px] items-center justify-center">
          <div className="text-center">
            <Loader2
              size={34}
              className="mx-auto animate-spin text-emerald-300"
            />

            <div className="mt-4 font-black text-white">
              Loading campaign
            </div>

            <div className="mt-2 text-sm text-zinc-500">
              Fetching campaign details and recipients...
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !campaign) {
    return (
      <main className="min-h-screen bg-[#09090b] px-5 py-8 text-white sm:px-8 lg:px-10">
        <div className="mx-auto flex min-h-[70vh] max-w-[1600px] items-center justify-center">
          <div className="w-full max-w-xl rounded-[2rem] border border-red-500/20 bg-red-500/10 p-8 text-center">
            <AlertCircle
              size={34}
              className="mx-auto text-red-300"
            />

            <h1 className="mt-4 text-xl font-black text-white">
              Campaign could not be loaded
            </h1>

            <p className="mt-2 text-sm leading-6 text-red-200/70">
              {error || 'The campaign does not exist.'}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => void loadCampaign()}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-zinc-200"
              >
                <RefreshCw size={17} />
                Try again
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push('/marketing/campaigns')
                }
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.08]"
              >
                Back to campaigns
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const openRate = getOpenRate(campaign);
  const clickRate = getClickRate(campaign);

  return (
    <main className="min-h-screen bg-[#09090b] px-5 py-8 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <CampaignHeader campaign={campaign} />

        {notice && (
          <div
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
              notice.type === 'success'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
                : 'border-red-500/20 bg-red-500/10 text-red-200'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle2
                size={19}
                className="mt-0.5 shrink-0"
              />
            ) : (
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0"
              />
            )}

            <div className="text-sm font-bold leading-6">
              {notice.message}
            </div>
          </div>
        )}

        <CampaignActions
          campaign={campaign}
          preparing={preparing}
          sending={sending}
          sendingToContact={sendingToContact}
          deleting={deleting}
          refreshing={refreshing}
          onPrepare={() => void handlePrepare()}
          onSend={() => void handleSend()}
          onSendToContact={() =>
            setSendToContactModalOpen(true)
          }
          onDelete={() => void handleDelete()}
          onRefresh={() => void handleRefresh()}
        />

        <CampaignStats campaign={campaign} />

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_420px]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/70 shadow-2xl backdrop-blur-xl">
              <div className="border-b border-white/10 px-6 py-5">
                <div className="flex items-center gap-2">
                  <Mail
                    size={19}
                    className="text-emerald-300"
                  />

                  <h2 className="text-lg font-black text-white">
                    Email preview
                  </h2>
                </div>

                <p className="mt-1 text-sm text-zinc-500">
                  Preview of the email your customers receive.
                </p>
              </div>

              <EmailPreview
                title={campaign.title}
                subtitle={campaign.subtitle}
                body={campaign.body}
                buttonText={campaign.buttonText}
                buttonUrl={campaign.buttonUrl}
                imageUrl={campaign.imageUrl}
                promoCode={campaign.promoCode}
              />
            </section>

            <CampaignRecipients
              recipients={campaign.recipients}
              totalRecipients={campaign.totalRecipients}
            />
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 shadow-2xl backdrop-blur-xl">
              <h2 className="text-lg font-black text-white">
                Campaign details
              </h2>

              <div className="mt-6 space-y-5">
                <DetailItem
                  icon={Mail}
                  label="Email subject"
                  value={campaign.subject}
                />

                <DetailItem
                  icon={UserRound}
                  label="Audience"
                  value={formatAudience(
                    campaign.audienceType,
                  )}
                />

                <DetailItem
                  icon={Tag}
                  label="Promo code"
                  value={
                    campaign.promoCode?.code ||
                    'No promo code'
                  }
                />

                <DetailItem
                  icon={Mail}
                  label="Sender"
                  value={
                    campaign.senderName ||
                    campaign.senderEmail ||
                    'Default sender'
                  }
                  secondaryValue={
                    campaign.senderName
                      ? campaign.senderEmail
                      : null
                  }
                />

                <DetailItem
                  icon={CalendarClock}
                  label="Created"
                  value={formatDate(campaign.createdAt)}
                />

                <DetailItem
                  icon={CalendarClock}
                  label="Last updated"
                  value={formatDate(campaign.updatedAt)}
                />

                {campaign.scheduledAt && (
                  <DetailItem
                    icon={CalendarClock}
                    label="Scheduled"
                    value={formatDate(
                      campaign.scheduledAt,
                    )}
                  />
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 shadow-2xl backdrop-blur-xl">
              <h2 className="text-lg font-black text-white">
                Performance
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Engagement based on sent emails.
              </p>

              <div className="mt-6 space-y-6">
                <PerformanceBar
                  label="Open rate"
                  value={openRate}
                  count={campaign.openedCount}
                />

                <PerformanceBar
                  label="Click rate"
                  value={clickRate}
                  count={campaign.clickedCount}
                />

                <PerformanceBar
                  label="Delivery progress"
                  value={
                    campaign.totalRecipients > 0
                      ? Math.round(
                          (campaign.sentCount /
                            campaign.totalRecipients) *
                            100,
                        )
                      : 0
                  }
                  count={campaign.sentCount}
                />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <SmallStat
                  label="Queued"
                  value={campaign.queuedCount}
                />

                <SmallStat
                  label="Delivered"
                  value={campaign.deliveredCount}
                />

                <SmallStat
                  label="Skipped"
                  value={campaign.skippedCount}
                />

                <SmallStat
                  label="Failed"
                  value={campaign.failedCount}
                />
              </div>
            </section>

            <CampaignTimeline campaign={campaign} />
          </aside>
        </section>
      </div>

      <SendToContactModal
        open={sendToContactModalOpen}
        campaignName={campaign.name}
        sending={sendingToContact}
        onClose={() => {
          if (!sendingToContact) {
            setSendToContactModalOpen(false);
          }
        }}
        onSubmit={handleSendToContact}
      />
    </main>
  );
}

type DetailItemProps = {
  icon: typeof Mail;
  label: string;
  value: string | number;
  secondaryValue?: string | null;
};

function DetailItem({
  icon: Icon,
  label,
  value,
  secondaryValue,
}: DetailItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-emerald-300">
        <Icon size={17} />
      </div>

      <div className="min-w-0">
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-600">
          {label}
        </div>

        <div className="mt-1 break-words text-sm font-black text-zinc-200">
          {value}
        </div>

        {secondaryValue && (
          <div className="mt-1 break-words text-xs text-zinc-500">
            {secondaryValue}
          </div>
        )}
      </div>
    </div>
  );
}

type PerformanceBarProps = {
  label: string;
  value: number;
  count: number;
};

function PerformanceBar({
  label,
  value,
  count,
}: PerformanceBarProps) {
  const safeValue = Math.max(0, Math.min(value, 100));

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-bold text-zinc-400">
          {label}
        </div>

        <div className="text-sm font-black text-white">
          {safeValue}%
        </div>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-emerald-400 transition-all duration-500"
          style={{
            width: `${safeValue}%`,
          }}
        />
      </div>

      <div className="mt-2 text-xs text-zinc-600">
        {count} emails
      </div>
    </div>
  );
}

type SmallStatProps = {
  label: string;
  value: number;
};

function SmallStat({
  label,
  value,
}: SmallStatProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs font-bold text-zinc-600">
        {label}
      </div>

      <div className="mt-2 text-xl font-black text-white">
        {value}
      </div>
    </div>
  );
}