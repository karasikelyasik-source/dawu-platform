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

const DEFAULT_START_TIME = '16:00';
const DEFAULT_END_TIME = '22:00';
const DEFAULT_INTERVAL = 15;

export default function RestaurantSettingsPage() {
  const {
    customer,
    loading: accountLoading,
  } = useAccount();

  const {
    restaurantOpen,
    closedMessage,
    reservationStartTime,
    reservationEndTime,
    reservationInterval,
    loading: settingsLoading,
    error: settingsError,
    refreshSettings,
  } = useRestaurantSettings();

  const [open, setOpen] = useState(false);

  const [message, setMessage] = useState(
    DEFAULT_CLOSED_MESSAGE,
  );

  const [startTime, setStartTime] =
    useState(DEFAULT_START_TIME);

  const [endTime, setEndTime] =
    useState(DEFAULT_END_TIME);

  const [interval, setInterval] =
    useState(String(DEFAULT_INTERVAL));

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
      closedMessage ||
        DEFAULT_CLOSED_MESSAGE,
    );

    setStartTime(
      reservationStartTime ||
        DEFAULT_START_TIME,
    );

    setEndTime(
      reservationEndTime ||
        DEFAULT_END_TIME,
    );

    setInterval(
      String(
        reservationInterval ||
          DEFAULT_INTERVAL,
      ),
    );
  }, [
    restaurantOpen,
    closedMessage,
    reservationStartTime,
    reservationEndTime,
    reservationInterval,
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
    const numericInterval = Number(interval);

    if (!cleanMessage) {
      setErrorMessage(
        'Closed message is required.',
      );
      return;
    }

    if (!startTime || !endTime) {
      setErrorMessage(
        'Reservation start and end times are required.',
      );
      return;
    }

    if (
      !Number.isInteger(numericInterval) ||
      numericInterval < 5 ||
      numericInterval > 60
    ) {
      setErrorMessage(
        'Reservation interval must be between 5 and 60 minutes.',
      );
      return;
    }

    if (
      timeToMinutes(startTime) >=
      timeToMinutes(endTime)
    ) {
      setErrorMessage(
        'Reservation end time must be later than the start time.',
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
            reservationStartTime: startTime,
            reservationEndTime: endTime,
            reservationInterval:
              numericInterval,
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
        'Restaurant and reservation schedule settings saved successfully.',
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
    closedMessage ||
    DEFAULT_CLOSED_MESSAGE;

  const savedStartTime =
    reservationStartTime ||
    DEFAULT_START_TIME;

  const savedEndTime =
    reservationEndTime ||
    DEFAULT_END_TIME;

  const savedInterval =
    String(
      reservationInterval ||
        DEFAULT_INTERVAL,
    );

  const settingsChanged =
    open !== restaurantOpen ||
    message.trim() !==
      savedMessage.trim() ||
    startTime !== savedStartTime ||
    endTime !== savedEndTime ||
    interval !== savedInterval;

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
            configure the reservation schedule.
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

            <div className="mt-7 rounded-[24px] border border-white/10 bg-black/20 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">
                Reservation schedule
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                    Start time
                  </span>

                  <input
                    required
                    type="time"
                    value={startTime}
                    onChange={(event) => {
                      setStartTime(
                        event.target.value,
                      );
                      setSuccessMessage('');
                      setErrorMessage('');
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-white outline-none transition focus:border-amber-300"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                    End time
                  </span>

                  <input
                    required
                    type="time"
                    value={endTime}
                    onChange={(event) => {
                      setEndTime(
                        event.target.value,
                      );
                      setSuccessMessage('');
                      setErrorMessage('');
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-white outline-none transition focus:border-amber-300"
                  />
                </label>
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                  Interval in minutes
                </span>

                <select
                  value={interval}
                  onChange={(event) => {
                    setInterval(
                      event.target.value,
                    );
                    setSuccessMessage('');
                    setErrorMessage('');
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-white outline-none transition focus:border-amber-300"
                >
                  <option value="5">
                    Every 5 minutes
                  </option>

                  <option value="10">
                    Every 10 minutes
                  </option>

                  <option value="15">
                    Every 15 minutes
                  </option>

                  <option value="20">
                    Every 20 minutes
                  </option>

                  <option value="30">
                    Every 30 minutes
                  </option>

                  <option value="45">
                    Every 45 minutes
                  </option>

                  <option value="60">
                    Every 60 minutes
                  </option>
                </select>
              </label>

              <div className="mt-4 rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] px-5 py-4 text-sm leading-6 text-zinc-400">
                Reservations will be available from{' '}
                <strong className="text-white">
                  {startTime}
                </strong>{' '}
                until{' '}
                <strong className="text-white">
                  {endTime}
                </strong>{' '}
                every{' '}
                <strong className="text-white">
                  {interval} minutes
                </strong>
                .
              </div>
            </div>

            <label className="mt-7 block">
              <span className="mb-3 block text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                Closed message
              </span>

              <textarea
                value={message}
                onChange={(event) => {
                  setMessage(
                    event.target.value,
                  );
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
                disabled={
                  saving ||
                  !settingsChanged
                }
                onClick={() => {
                  setOpen(
                    restaurantOpen,
                  );

                  setMessage(
                    savedMessage,
                  );

                  setStartTime(
                    savedStartTime,
                  );

                  setEndTime(
                    savedEndTime,
                  );

                  setInterval(
                    savedInterval,
                  );

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
                    ? `Customers can reserve from ${startTime} until ${endTime}, every ${interval} minutes.`
                    : message ||
                      DEFAULT_CLOSED_MESSAGE}
                </p>
              </div>
            </section>

            <section className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                Current reservation slots
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {generateTimeSlots(
                  startTime,
                  endTime,
                  Number(interval),
                )
                  .slice(0, 12)
                  .map((time) => (
                    <div
                      key={time}
                      className="rounded-xl border border-white/[0.07] bg-black/20 px-3 py-2 text-center text-sm font-bold text-zinc-300"
                    >
                      {time}
                    </div>
                  ))}
              </div>

              {generateTimeSlots(
                startTime,
                endTime,
                Number(interval),
              ).length > 12 && (
                <p className="mt-4 text-xs text-zinc-600">
                  More time slots will appear on the
                  reservation form.
                </p>
              )}
            </section>
          </aside>
        </form>
      </div>
    </main>
  );
}

function timeToMinutes(value: string) {
  const [hours, minutes] =
    value.split(':').map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(
    totalMinutes / 60,
  );

  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(
    2,
    '0',
  )}:${String(minutes).padStart(
    2,
    '0',
  )}`;
}

function generateTimeSlots(
  startTime: string,
  endTime: string,
  interval: number,
) {
  if (
    !startTime ||
    !endTime ||
    !Number.isInteger(interval) ||
    interval < 1
  ) {
    return [];
  }

  const startMinutes =
    timeToMinutes(startTime);

  const endMinutes =
    timeToMinutes(endTime);

  if (startMinutes >= endMinutes) {
    return [];
  }

  const slots: string[] = [];

  for (
    let current = startMinutes;
    current <= endMinutes;
    current += interval
  ) {
    slots.push(
      minutesToTime(current),
    );
  }

  return slots;
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

    if (
      typeof message === 'string'
    ) {
      return message;
    }

    if (
      Array.isArray(message)
    ) {
      return message.join(', ');
    }
  }

  return fallback;
}