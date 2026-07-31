'use client';

import {
  FormEvent,
  useEffect,
  useState,
} from 'react';

import {
  Loader2,
  Mail,
  Send,
  UserRound,
  X,
} from 'lucide-react';

type Props = {
  open: boolean;
  campaignName: string;
  sending: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name?: string;
    email: string;
  }) => Promise<void>;
};

export default function SendToContactModal({
  open,
  campaignName,
  sending,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setName('');
    setEmail('');
    setValidationError(null);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !sending) {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, [open, sending, onClose]);

  if (!open) {
    return null;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedEmail =
      email.toLowerCase().trim();

    const normalizedName = name.trim();

    if (!normalizedEmail) {
      setValidationError(
        'Enter the recipient email address.',
      );

      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      setValidationError(
        'Enter a valid email address.',
      );

      return;
    }

    setValidationError(null);

    await onSubmit({
      email: normalizedEmail,
      name: normalizedName || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Close modal"
        disabled={sending}
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-md disabled:cursor-not-allowed"
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-300">
                <Mail size={18} />
              </div>

              <div>
                <h2 className="text-lg font-black text-white">
                  Send to contact
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Send this campaign to one email address.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              Campaign
            </div>

            <div className="mt-1 truncate text-sm font-black text-zinc-200">
              {campaignName}
            </div>
          </div>

          <label className="block">
            <div className="mb-2 text-sm font-black text-zinc-300">
              Contact name
            </div>

            <div className="relative">
              <UserRound
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
              />

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                disabled={sending}
                maxLength={120}
                placeholder="Optional"
                autoComplete="name"
                className="w-full rounded-2xl border border-white/10 bg-black/30 py-3.5 pl-12 pr-4 text-sm font-bold text-white outline-none transition placeholder:text-zinc-700 focus:border-violet-400/50 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </label>

          <label className="block">
            <div className="mb-2 text-sm font-black text-zinc-300">
              Email address
            </div>

            <div className="relative">
              <Mail
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
              />

              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);

                  if (validationError) {
                    setValidationError(null);
                  }
                }}
                disabled={sending}
                maxLength={320}
                required
                placeholder="customer@example.com"
                autoComplete="email"
                autoFocus
                className="w-full rounded-2xl border border-white/10 bg-black/30 py-3.5 pl-12 pr-4 text-sm font-bold text-white outline-none transition placeholder:text-zinc-700 focus:border-violet-400/50 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </label>

          {validationError && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
              {validationError}
            </div>
          )}

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100/80">
            This sends one real email through the queue.
            Campaign recipients, status and statistics will
            not be changed.
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-zinc-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={sending || !email.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-400/30 bg-violet-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/15 transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Queuing email
                </>
              ) : (
                <>
                  <Send size={17} />
                  Send email
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}