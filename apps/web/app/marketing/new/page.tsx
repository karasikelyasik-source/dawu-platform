'use client';

import { FormEvent, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Mail,
  Save,
  Send,
  Tag,
  Users,
} from 'lucide-react';

type AudienceType =
  | 'ALL_CUSTOMERS'
  | 'ACTIVE_CUSTOMERS'
  | 'INACTIVE_CUSTOMERS'
  | 'MANUAL';

type CampaignForm = {
  name: string;
  subject: string;
  previewText: string;
  title: string;
  subtitle: string;
  body: string;
  buttonText: string;
  buttonUrl: string;
  imageUrl: string;
  audienceType: AudienceType;
  promoCodeId: string;
  senderName: string;
  senderEmail: string;
  scheduledAt: string;
};

type CreatedCampaign = {
  id: string;
  name: string;
  subject: string;
  status: string;
};

const initialForm: CampaignForm = {
  name: '',
  subject: '',
  previewText: '',
  title: 'A special offer from DaWu',
  subtitle: 'Enjoy something special during your next visit.',
  body:
    'We have prepared a special offer for you. Visit DaWu Sushi Fusion and enjoy your favourite dishes.',
  buttonText: 'View offer',
  buttonUrl: 'https://dawubeverijk.nl',
  imageUrl: '',
  audienceType: 'ALL_CUSTOMERS',
  promoCodeId: '',
  senderName: 'DaWu Sushi Fusion',
  senderEmail: '',
  scheduledAt: '',
};

function inputClasses() {
  return 'w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500/40 focus:bg-black/50 focus:ring-4 focus:ring-emerald-500/5';
}

function labelClasses() {
  return 'mb-2 block text-sm font-black text-zinc-300';
}

function optionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export default function NewMarketingCampaignPage() {
  const [form, setForm] = useState<CampaignForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdCampaign, setCreatedCampaign] =
    useState<CreatedCampaign | null>(null);

  const previewTitle = useMemo(
    () => form.title.trim() || 'Your campaign title',
    [form.title],
  );

  const previewSubtitle = useMemo(
    () =>
      form.subtitle.trim() ||
      'Add a short subtitle to support your campaign message.',
    [form.subtitle],
  );

  const previewBody = useMemo(
    () =>
      form.body.trim() ||
      'Your email content will appear here while you build the campaign.',
    [form.body],
  );

  function updateField<K extends keyof CampaignForm>(
    key: K,
    value: CampaignForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setError('');
    setSuccess('');
  }

  function validateForm() {
    if (form.name.trim().length < 2) {
      return 'Campaign name must contain at least 2 characters.';
    }

    if (form.subject.trim().length < 2) {
      return 'Email subject must contain at least 2 characters.';
    }

    if (form.body.trim().length < 1) {
      return 'Email body is required.';
    }

    if (form.buttonUrl.trim() && !form.buttonUrl.startsWith('http')) {
      return 'Button URL must start with http:// or https://';
    }

    if (form.imageUrl.trim() && !form.imageUrl.startsWith('http')) {
      return 'Image URL must start with http:// or https://';
    }

    if (
      form.senderEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.senderEmail.trim())
    ) {
      return 'Sender email is invalid.';
    }

    return '';
  }

  function buildPayload() {
    return {
      name: form.name.trim(),
      subject: form.subject.trim(),
      previewText: optionalValue(form.previewText),
      title: optionalValue(form.title),
      subtitle: optionalValue(form.subtitle),
      body: form.body,
      buttonText: optionalValue(form.buttonText),
      buttonUrl: optionalValue(form.buttonUrl),
      imageUrl: optionalValue(form.imageUrl),
      audienceType: form.audienceType,
      promoCodeId: optionalValue(form.promoCodeId),
      senderName: optionalValue(form.senderName),
      senderEmail: optionalValue(form.senderEmail),
      scheduledAt: form.scheduledAt
        ? new Date(form.scheduledAt).toISOString()
        : undefined,
    };
  }

  async function createCampaign() {
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return null;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api-proxy/marketing/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildPayload()),
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

      const campaign = data as CreatedCampaign;

      setCreatedCampaign(campaign);
      setSuccess(
        form.scheduledAt
          ? 'Campaign scheduled successfully.'
          : 'Campaign draft saved successfully.',
      );

      return campaign;
    } catch (requestError) {
      console.error(requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not create campaign.',
      );

      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    await createCampaign();
  }

  async function handlePrepareAndSend() {
    let campaign = createdCampaign;

    if (!campaign) {
      campaign = await createCampaign();
    }

    if (!campaign) {
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    try {
      const prepareResponse = await fetch(
        `/api-proxy/marketing/campaigns/${campaign.id}/prepare`,
        {
          method: 'POST',
        },
      );

      const prepareData = await prepareResponse.json().catch(() => null);

      if (!prepareResponse.ok) {
        const message = Array.isArray(prepareData?.message)
          ? prepareData.message.join(', ')
          : prepareData?.message;

        throw new Error(
          message || `Prepare API returned ${prepareResponse.status}`,
        );
      }

      const sendResponse = await fetch(
        `/api-proxy/marketing/campaigns/${campaign.id}/send`,
        {
          method: 'POST',
        },
      );

      const sendData = await sendResponse.json().catch(() => null);

      if (!sendResponse.ok) {
        const message = Array.isArray(sendData?.message)
          ? sendData.message.join(', ')
          : sendData?.message;

        throw new Error(
          message || `Send API returned ${sendResponse.status}`,
        );
      }

      setSuccess(
        `Campaign sent. Successful: ${sendData?.sentCount ?? 0}, failed: ${
          sendData?.failedCount ?? 0
        }.`,
      );

      setCreatedCampaign({
        ...campaign,
        status: 'SENT',
      });
    } catch (requestError) {
      console.error(requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not send campaign.',
      );
    } finally {
      setSending(false);
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
            Campaign Builder
          </div>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
            Create Campaign
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
            Build a marketing email, choose the audience and save it as a draft
            or send it directly to DaWu customers.
          </p>
        </div>

        {createdCampaign && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm">
            <div className="font-black text-emerald-300">
              Campaign created
            </div>
            <div className="mt-1 text-emerald-100/60">
              Status: {createdCampaign.status}
            </div>
          </div>
        )}
      </section>

      {error && (
        <section className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5">
          <div className="font-black text-red-300">Something went wrong</div>
          <div className="mt-1 text-sm text-red-200/70">{error}</div>
        </section>
      )}

      {success && (
        <section className="flex items-start gap-3 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
          <CheckCircle2
            size={21}
            className="mt-0.5 shrink-0 text-emerald-300"
          />

          <div>
            <div className="font-black text-emerald-300">Success</div>
            <div className="mt-1 text-sm text-emerald-100/70">
              {success}
            </div>
          </div>
        </section>
      )}

      <form
        onSubmit={handleSave}
        className="grid gap-6 xl:grid-cols-[1fr_0.9fr]"
      >
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-emerald-300">
                <Mail size={20} />
              </div>

              <div>
                <h2 className="text-xl font-black text-white">
                  Campaign details
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Internal name and email subject.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label>
                <span className={labelClasses()}>Campaign name</span>
                <input
                  value={form.name}
                  onChange={(event) =>
                    updateField('name', event.target.value)
                  }
                  placeholder="Summer sushi promotion"
                  maxLength={150}
                  className={inputClasses()}
                />
              </label>

              <label>
                <span className={labelClasses()}>Email subject</span>
                <input
                  value={form.subject}
                  onChange={(event) =>
                    updateField('subject', event.target.value)
                  }
                  placeholder="A special offer from DaWu"
                  maxLength={200}
                  className={inputClasses()}
                />
              </label>
            </div>

            <label className="mt-5 block">
              <span className={labelClasses()}>Preview text</span>
              <input
                value={form.previewText}
                onChange={(event) =>
                  updateField('previewText', event.target.value)
                }
                placeholder="Shown next to the subject in the inbox"
                maxLength={250}
                className={inputClasses()}
              />
            </label>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-emerald-300">
                <ImageIcon size={20} />
              </div>

              <div>
                <h2 className="text-xl font-black text-white">
                  Email content
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Main campaign content and call to action.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <label className="block">
                <span className={labelClasses()}>Image URL</span>
                <input
                  value={form.imageUrl}
                  onChange={(event) =>
                    updateField('imageUrl', event.target.value)
                  }
                  placeholder="https://example.com/campaign-image.jpg"
                  className={inputClasses()}
                />
              </label>

              <label className="block">
                <span className={labelClasses()}>Title</span>
                <input
                  value={form.title}
                  onChange={(event) =>
                    updateField('title', event.target.value)
                  }
                  maxLength={200}
                  className={inputClasses()}
                />
              </label>

              <label className="block">
                <span className={labelClasses()}>Subtitle</span>
                <input
                  value={form.subtitle}
                  onChange={(event) =>
                    updateField('subtitle', event.target.value)
                  }
                  maxLength={300}
                  className={inputClasses()}
                />
              </label>

              <label className="block">
                <span className={labelClasses()}>Message</span>
                <textarea
                  value={form.body}
                  onChange={(event) =>
                    updateField('body', event.target.value)
                  }
                  rows={7}
                  className={`${inputClasses()} resize-y leading-6`}
                />
              </label>

              <div className="grid gap-5 md:grid-cols-2">
                <label>
                  <span className={labelClasses()}>Button text</span>
                  <input
                    value={form.buttonText}
                    onChange={(event) =>
                      updateField('buttonText', event.target.value)
                    }
                    maxLength={100}
                    className={inputClasses()}
                  />
                </label>

                <label>
                  <span className={labelClasses()}>Button URL</span>
                  <input
                    value={form.buttonUrl}
                    onChange={(event) =>
                      updateField('buttonUrl', event.target.value)
                    }
                    placeholder="https://dawubeverijk.nl"
                    className={inputClasses()}
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-emerald-300">
                <Users size={20} />
              </div>

              <div>
                <h2 className="text-xl font-black text-white">
                  Audience and delivery
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Choose recipients, promo code and delivery time.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label>
                <span className={labelClasses()}>Audience</span>
                <select
                  value={form.audienceType}
                  onChange={(event) =>
                    updateField(
                      'audienceType',
                      event.target.value as AudienceType,
                    )
                  }
                  className={inputClasses()}
                >
                  <option value="ALL_CUSTOMERS">All customers</option>
                  <option value="ACTIVE_CUSTOMERS">
                    Active customers
                  </option>
                  <option value="INACTIVE_CUSTOMERS">
                    Inactive customers
                  </option>
                  <option value="MANUAL">Manual audience</option>
                </select>
              </label>

              <label>
                <span className={labelClasses()}>Promo code ID</span>
                <div className="relative">
                  <Tag
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
                  />

                  <input
                    value={form.promoCodeId}
                    onChange={(event) =>
                      updateField('promoCodeId', event.target.value)
                    }
                    placeholder="Optional database ID"
                    className={`${inputClasses()} pl-11`}
                  />
                </div>
              </label>

              <label>
                <span className={labelClasses()}>Sender name</span>
                <input
                  value={form.senderName}
                  onChange={(event) =>
                    updateField('senderName', event.target.value)
                  }
                  maxLength={100}
                  className={inputClasses()}
                />
              </label>

              <label>
                <span className={labelClasses()}>Sender email</span>
                <input
                  type="email"
                  value={form.senderEmail}
                  onChange={(event) =>
                    updateField('senderEmail', event.target.value)
                  }
                  placeholder="marketing@dawubeverijk.nl"
                  className={inputClasses()}
                />
              </label>

              <label className="md:col-span-2">
                <span className={labelClasses()}>
                  Schedule date and time
                </span>

                <div className="relative">
                  <CalendarClock
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
                  />

                  <input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(event) =>
                      updateField('scheduledAt', event.target.value)
                    }
                    className={`${inputClasses()} pl-11`}
                  />
                </div>

                <p className="mt-2 text-xs text-zinc-600">
                  Leave empty to save the campaign as a draft.
                </p>
              </label>
            </div>
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/70 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h2 className="font-black text-white">Live preview</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Approximate email appearance
                </p>
              </div>

              <ExternalLink size={18} className="text-zinc-600" />
            </div>

            <div className="bg-zinc-200 p-4 sm:p-6">
              <div className="mx-auto max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="bg-zinc-950 px-6 py-5 text-center">
                  <div className="text-lg font-black tracking-[0.18em] text-white">
                    DAWU
                  </div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-amber-400">
                    Sushi Fusion
                  </div>
                </div>

                {form.imageUrl.trim() ? (
                  <img
                    src={form.imageUrl}
                    alt=""
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-zinc-100 text-zinc-400">
                    <div className="text-center">
                      <ImageIcon size={30} className="mx-auto" />
                      <div className="mt-2 text-xs font-bold">
                        Campaign image
                      </div>
                    </div>
                  </div>
                )}

                <div className="px-7 py-8 text-center sm:px-10">
                  <div className="text-3xl font-black leading-tight text-zinc-950">
                    {previewTitle}
                  </div>

                  <div className="mt-3 text-base leading-6 text-zinc-500">
                    {previewSubtitle}
                  </div>

                  <div className="mt-6 whitespace-pre-line text-sm leading-7 text-zinc-600">
                    {previewBody}
                  </div>

                  {form.buttonText.trim() && (
                    <div className="mt-8">
                      <span className="inline-flex rounded-xl bg-zinc-950 px-6 py-3 text-sm font-black text-white">
                        {form.buttonText}
                      </span>
                    </div>
                  )}

                  {form.promoCodeId.trim() && (
                    <div className="mt-7 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 px-5 py-4">
                      <div className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">
                        Promo code selected
                      </div>
                      <div className="mt-2 font-mono text-sm font-black text-zinc-900">
                        {form.promoCodeId}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-5 text-center text-[11px] leading-5 text-zinc-400">
                  DaWu Sushi Fusion · Beverwijk, Netherlands
                  <br />
                  You received this email because you are a DaWu customer.
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-5 shadow-2xl">
            <button
              type="submit"
              disabled={saving || sending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 font-black text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}

              {form.scheduledAt ? 'Schedule Campaign' : 'Save Draft'}
            </button>

            <button
              type="button"
              onClick={() => void handlePrepareAndSend()}
              disabled={saving || sending || Boolean(form.scheduledAt)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500 px-5 py-3.5 font-black text-zinc-950 shadow-lg shadow-emerald-500/15 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}

              Prepare & Send Now
            </button>

            {form.scheduledAt && (
              <p className="mt-3 text-center text-xs leading-5 text-zinc-600">
                Remove the scheduled date to enable immediate sending.
              </p>
            )}
          </section>
        </aside>
      </form>
    </main>
  );
}