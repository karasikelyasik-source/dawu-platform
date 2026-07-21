'use client';

import Link from 'next/link';
import {
  FormEvent,
  useEffect,
  useState,
} from 'react';

import { useAccount } from '../../../components/account/AccountProvider';
import { useRestaurantSettings } from '../../../components/restaurant-settings/RestaurantSettingsProvider';

const DEFAULT_CLOSED_MESSAGE =
  'DaWu Sushi Fusion is temporarily closed. Reservations and online ordering are currently unavailable.';

export default function RestaurantSettingsPage() {
  const {
    customer,
    loading: accountLoading,
  } = useAccount();

  const {
    restaurantOpen,
    closedMessage,
    loading: settingsLoading,
    error: settingsError,
    refreshSettings,
  } = useRestaurantSettings();

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(
    DEFAULT_CLOSED_MESSAGE,
  );

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] =
    useState('');
  const [errorMessage, setErrorMessage] =
    useState('');

  const hasAdminAccess =
    customer?.role === 'ADMIN' ||
    customer?.role === 'OWNER';

  useEffect(() => {
    if (settingsLoading) {
      return;
    }

    setOpen(restaurantOpen);
    setMessage(
      closedMessage || DEFAULT_CLOSED_MESSAGE,
    );
  }, [
    restaurantOpen,
    closedMessage,
    settingsLoading,
  ]);

  async function saveSettings(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving || !hasAdminAccess) {
      return;
    }

    const cleanMessage = message.trim();

    if (!cleanMessage) {
      setErrorMessage(
        'Closed message is required.',
      );
      return;
    }

    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await fetch(
        '/api/restaurant-settings/admin',
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            restaurantOpen: open,
            closedMessage: cleanMessage,
          }),
        },
      );

      const responseBody = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            responseBody,
            'Could not save restaurant settings.',
          ),
        );
      }

      await refreshSettings();

      setSuccessMessage(
        open
          ? 'Restaurant opened successfully. Public reservations are now available.'
          : 'Restaurant closed successfully. Public reservations are now disabled.',
      );
    } catch (error) {
      console.error(
        'Restaurant settings save failed:',
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Could not save restaurant settings.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (accountLoading || settingsLoading) {
    return <LoadingScreen />;
  }

  if (!customer || !hasAdminAccess) {
    return <AccessDenied />;
  }

  const savedMessage =
    closedMessage || DEFAULT_CLOSED_MESSAGE;

  const settingsChanged =
    open !== restaurantOpen ||
    message.trim() !== savedMessage.trim();

  return (
    <main className="min-h-screen bg-[#070504] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-white/10 pb-8">
          <Link
            href="/admin"
            className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500 transition hover:text-white"
          >
            ← Control Center
          </Link>

          <p className="mt-7 text-xs font-black uppercase tracking-[0.28em] text-amber-300">
            DaWu Restaurant Control
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Restaurant Settings
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
            Open or close public reservations and
            configure the message displayed to customers.
          </p>
        </header>

        {settingsError && (
          <Notice
            type="error"
            message={settingsError}
          />
        )}

        {successMessage && (
          <Notice
            type="success"
            message={successMessage}
          />
        )}

        {errorMessage && (
          <Notice
            type="error"
            message={errorMessage}
          />
        )}

        <form
          onSubmit={saveSettings}
          className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"
        >
          <section className="rounded-[30px] border border-white/10 bg-[#0d0b0a] p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                  Current status
                </p>

                <h2 className="mt-3 text-3xl font-black">
                  {open
                    ? 'Restaurant Open'
                    : 'Restaurant Closed'}
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
                  {open
                    ? 'Customers can create reservations normally.'
                    : 'Public reservations are blocked. ADMIN and OWNER accounts can still test reservations.'}
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={open}
                aria-label="Change restaurant status"
                onClick={() => {
                  setOpen((current) => !current);
                  setSuccessMessage('');
                  setErrorMessage('');
                }}
                className={[
                  'relative h-14 w-28 shrink-0 rounded-full border p-1.5 transition',
                  open
                    ? 'border-green-400/30 bg-green-400/20'
                    : 'border-red-400/30 bg-red-400/10',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-10 w-10 items-center justify-center rounded-full font-black transition-transform duration-300',
                    open
                      ? 'translate-x-14 bg-green-300 text-green-950'
                      : 'translate-x-0 bg-red-300 text-red-950',
                  ].join(' ')}
                >
                  {open ? '✓' : '×'}
                </span>
              </button>
            </div>

            <div
              className={[
                'mt-7 rounded-2xl border p-5',
                open
                  ? 'border-green-500/20 bg-green-500/[0.06]'
                  : 'border-red-500/20 bg-red-500/[0.06]',
              ].join(' ')}
            >
              <p
                className={[
                  'text-sm font-black uppercase tracking-[0.17em]',
                  open
                    ? 'text-green-300'
                    : 'text-red-300',
                ].join(' ')}
              >
                {open
                  ? 'Public reservations enabled'
                  : 'Public reservations disabled'}
              </p>
            </div>

            <label className="mt-7 block">
              <span className="mb-3 block text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                Closed message
              </span>

              <textarea
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  setSuccessMessage('');
                  setErrorMessage('');
                }}
                rows={7}
                maxLength={500}
                placeholder={DEFAULT_CLOSED_MESSAGE}
                className="w-full resize-none rounded-[22px] border border-white/10 bg-black/40 px-5 py-4 leading-7 text-white outline-none transition placeholder:text-zinc-700 focus:border-amber-300"
              />

              <div className="mt-2 flex justify-between text-xs text-zinc-600">
                <span>
                  Displayed on the public website.
                </span>

                <span>
                  {message.length}/500
                </span>
              </div>
            </label>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={
                  saving ||
                  !message.trim() ||
                  !settingsChanged
                }
                className="min-h-14 flex-1 rounded-full bg-amber-300 px-8 text-sm font-black uppercase tracking-[0.17em] text-black transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving
                  ? 'Saving...'
                  : settingsChanged
                    ? 'Save Settings'
                    : 'Settings Saved'}
              </button>

              <button
                type="button"
                disabled={saving || !settingsChanged}
                onClick={() => {
                  setOpen(restaurantOpen);
                  setMessage(savedMessage);
                  setSuccessMessage('');
                  setErrorMessage('');
                }}
                className="min-h-14 rounded-full border border-white/10 px-7 text-sm font-black uppercase tracking-[0.14em] text-zinc-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                Reset
              </button>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">
                Website Preview
              </p>

              <div className="mt-5 rounded-[22px] border border-white/10 bg-black/40 p-5">
                <div className="flex items-center gap-3">
                  <span
                    className={[
                      'h-3 w-3 rounded-full',
                      open
                        ? 'bg-green-400'
                        : 'bg-red-500',
                    ].join(' ')}
                  />

                  <p
                    className={[
                      'text-xs font-black uppercase tracking-[0.18em]',
                      open
                        ? 'text-green-300'
                        : 'text-amber-300',
                    ].join(' ')}
                  >
                    {open
                      ? 'Reservations Open'
                      : 'Temporarily Closed'}
                  </p>
                </div>

                <p className="mt-4 text-sm leading-7 text-zinc-400">
                  {open
                    ? 'Customers can reserve a table through the DaWu website.'
                    : message ||
                      DEFAULT_CLOSED_MESSAGE}
                </p>
              </div>
            </section>

            <section className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                Updated sections
              </p>

              <div className="mt-5 space-y-3">
                <Info title="Hero" />
                <Info title="Header" />
                <Info title="Reservation form" />
                <Info title="Backend protection" />
              </div>
            </section>
          </aside>
        </form>
      </div>
    </main>
  );
}

function Info({
  title,
}: {
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
      <p className="font-black">
        {title}
      </p>
    </div>
  );
}

function Notice({
  type,
  message,
}: {
  type: 'error' | 'success';
  message: string;
}) {
  return (
    <div
      className={[
        'mt-7 rounded-2xl border p-5 text-sm',
        type === 'error'
          ? 'border-red-500/20 bg-red-500/[0.08] text-red-200'
          : 'border-green-500/20 bg-green-500/[0.08] text-green-200',
      ].join(' ')}
    >
      {message}
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070504] text-white">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-amber-300/20 border-t-amber-300" />

        <p className="mt-5 text-sm text-zinc-500">
          Loading restaurant settings...
        </p>
      </div>
    </main>
  );
}

function AccessDenied() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070504] px-5 text-white">
      <div className="w-full max-w-lg rounded-[30px] border border-white/10 bg-white/[0.03] p-9 text-center">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-red-300">
          Access denied
        </p>

        <h1 className="mt-4 text-4xl font-black">
          Admin access required
        </h1>

        <p className="mt-4 text-zinc-400">
          This page is only available to
          ADMIN and OWNER accounts.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 font-black text-black"
        >
          Back to DaWu
        </Link>
      </div>
    </main>
  );
}

function getErrorMessage(
  data: unknown,
  fallback: string,
) {
  if (
    typeof data === 'object' &&
    data !== null &&
    'message' in data
  ) {
    const message = (
      data as {
        message?: unknown;
      }
    ).message;

    if (typeof message === 'string') {
      return message;
    }

    if (Array.isArray(message)) {
      return message.join(', ');
    }
  }

  return fallback;
}