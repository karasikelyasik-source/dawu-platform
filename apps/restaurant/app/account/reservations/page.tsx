'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAccount } from '../../../components/account/AccountProvider';

type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

type ReservationTable = {
  id: string;
  number: number;
  label?: string | null;
  status:
    | 'AVAILABLE'
    | 'OCCUPIED'
    | 'RESERVED'
    | 'CLEANING';
};

type CustomerReservation = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  message?: string | null;
  guests: number;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  qrToken?: string | null;
  checkedInAt?: string | null;
  tableId?: string | null;
  table?: ReservationTable | null;
  createdAt: string;
  updatedAt: string;
};

type ReservationFilter =
  | 'upcoming'
  | 'history'
  | 'all';

const API_URL = '/api';

export default function CustomerReservationsPage() {
  const {
    customer,
    loading: accountLoading,
  } = useAccount();

  const [
    reservations,
    setReservations,
  ] = useState<CustomerReservation[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  const [filter, setFilter] =
    useState<ReservationFilter>('upcoming');

  const loadReservations =
    useCallback(
      async (silent = false) => {
        if (!customer) {
          setReservations([]);
          setLoading(false);
          return;
        }

        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError('');

        try {
          const response = await fetch(
            `${API_URL}/customer/reservations`,
            {
              method: 'GET',
              credentials: 'include',
              cache: 'no-store',
            },
          );

          const data = await response
            .json()
            .catch(() => null);

          if (!response.ok) {
            const message =
              typeof data?.message === 'string'
                ? data.message
                : Array.isArray(data?.message)
                  ? data.message.join(', ')
                  : 'Could not load your reservations.';

            throw new Error(message);
          }

          setReservations(
            Array.isArray(data) ? data : [],
          );
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Could not load your reservations.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [customer],
    );

  useEffect(() => {
    if (accountLoading) {
      return;
    }

    void loadReservations();
  }, [
    accountLoading,
    loadReservations,
  ]);

  const groupedReservations =
    useMemo(() => {
      const now = Date.now();

      const upcoming =
        reservations
          .filter((reservation) => {
            const endTime =
              new Date(
                reservation.endTime,
              ).getTime();

            return (
              endTime >= now &&
              reservation.status !==
                'CANCELLED' &&
              reservation.status !==
                'COMPLETED' &&
              reservation.status !==
                'NO_SHOW'
            );
          })
          .sort(
            (a, b) =>
              new Date(
                a.startTime,
              ).getTime() -
              new Date(
                b.startTime,
              ).getTime(),
          );

      const history =
        reservations
          .filter((reservation) => {
            const endTime =
              new Date(
                reservation.endTime,
              ).getTime();

            return (
              endTime < now ||
              reservation.status ===
                'CANCELLED' ||
              reservation.status ===
                'COMPLETED' ||
              reservation.status ===
                'NO_SHOW'
            );
          })
          .sort(
            (a, b) =>
              new Date(
                b.startTime,
              ).getTime() -
              new Date(
                a.startTime,
              ).getTime(),
          );

      return {
        upcoming,
        history,
        all: [
          ...reservations,
        ].sort(
          (a, b) =>
            new Date(
              b.startTime,
            ).getTime() -
            new Date(
              a.startTime,
            ).getTime(),
        ),
      };
    }, [reservations]);

  const visibleReservations =
    groupedReservations[filter];

  if (accountLoading || loading) {
    return <ReservationsLoading />;
  }

  if (!customer) {
    return <LoginRequired />;
  }

  return (
    <main className="min-h-screen bg-[#070504] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10rem] top-[-10rem] h-[28rem] w-[28rem] rounded-full bg-amber-300/[0.05] blur-[120px]" />
        <div className="absolute bottom-[-12rem] right-[-10rem] h-[32rem] w-[32rem] rounded-full bg-orange-500/[0.04] blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-12 lg:px-8">
        <AccountTopBar
          customerName={customer.name}
        />

        <section className="mt-8 overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.035] shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
          <div className="relative overflow-hidden border-b border-white/[0.08] px-6 py-8 sm:px-8 sm:py-10">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-300/[0.07] via-transparent to-transparent" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.32em] text-amber-300">
                  DaWu Account
                </p>

                <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                  My Reservations
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
                  View upcoming visits,
                  assigned tables, check-in
                  status and your complete
                  reservation history.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    void loadReservations(true)
                  }
                  disabled={refreshing}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshIcon
                    spinning={refreshing}
                  />

                  {refreshing
                    ? 'Refreshing'
                    : 'Refresh'}
                </button>

                <Link
                  href="/#reservation"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-amber-300 px-7 text-sm font-black uppercase tracking-[0.16em] text-black transition hover:-translate-y-0.5 hover:bg-amber-200 hover:shadow-[0_16px_45px_rgba(252,211,77,0.16)]"
                >
                  New Reservation
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-px bg-white/[0.08] sm:grid-cols-3">
            <Statistic
              label="Upcoming"
              value={String(
                groupedReservations
                  .upcoming.length,
              )}
            />

            <Statistic
              label="History"
              value={String(
                groupedReservations
                  .history.length,
              )}
            />

            <Statistic
              label="Total"
              value={String(
                groupedReservations
                  .all.length,
              )}
            />
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-center sm:justify-between">
            <ReservationTabs
              activeFilter={filter}
              onChange={setFilter}
              counts={{
                upcoming:
                  groupedReservations
                    .upcoming.length,
                history:
                  groupedReservations
                    .history.length,
                all:
                  groupedReservations
                    .all.length,
              }}
            />

            <p className="text-sm text-zinc-500">
              {visibleReservations.length}{' '}
              {visibleReservations.length ===
              1
                ? 'reservation'
                : 'reservations'}
            </p>
          </div>

          {error && (
            <ErrorNotice
              message={error}
              onRetry={() =>
                void loadReservations()
              }
            />
          )}

          {!error &&
            visibleReservations.length ===
              0 && (
              <EmptyReservations
                filter={filter}
              />
            )}

          {!error &&
            visibleReservations.length >
              0 && (
              <div className="mt-6 grid gap-5">
                {visibleReservations.map(
                  (reservation) => (
                    <ReservationCard
                      key={reservation.id}
                      reservation={
                        reservation
                      }
                    />
                  ),
                )}
              </div>
            )}
        </section>

        <AccountFooter />
      </div>
    </main>
  );
}

function AccountTopBar({
  customerName,
}: {
  customerName: string;
}) {
  const initial =
    customerName
      .trim()
      .charAt(0)
      .toUpperCase() || 'D';

  return (
    <div className="flex items-center justify-between gap-4">
      <Link
        href="/account"
        className="inline-flex min-h-11 items-center gap-3 rounded-full border border-white/10 bg-white/[0.035] px-5 text-sm font-black text-white transition hover:border-white/20 hover:bg-white/[0.07]"
      >
        <ArrowLeftIcon />
        Back to account
      </Link>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-black text-white">
            {customerName}
          </p>

          <p className="text-xs text-zinc-500">
            DaWu customer
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-300 text-base font-black text-black">
          {initial}
        </div>
      </div>
    </div>
  );
}

function ReservationTabs({
  activeFilter,
  onChange,
  counts,
}: {
  activeFilter: ReservationFilter;
  onChange: (
    value: ReservationFilter,
  ) => void;
  counts: Record<
    ReservationFilter,
    number
  >;
}) {
  const tabs: Array<{
    id: ReservationFilter;
    label: string;
  }> = [
    {
      id: 'upcoming',
      label: 'Upcoming',
    },
    {
      id: 'history',
      label: 'History',
    },
    {
      id: 'all',
      label: 'All',
    },
  ];

  return (
    <div className="flex w-full gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-1.5 sm:w-auto">
      {tabs.map((tab) => {
        const active =
          tab.id === activeFilter;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() =>
              onChange(tab.id)
            }
            className={[
              'flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-xs font-black uppercase tracking-[0.14em] transition sm:flex-none',
              active
                ? 'bg-white text-black'
                : 'text-zinc-500 hover:bg-white/[0.05] hover:text-white',
            ].join(' ')}
          >
            {tab.label}

            <span
              className={[
                'rounded-full px-2 py-0.5 text-[10px]',
                active
                  ? 'bg-black/10 text-black'
                  : 'bg-white/[0.06] text-zinc-500',
              ].join(' ')}
            >
              {counts[tab.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ReservationCard({
  reservation,
}: {
  reservation: CustomerReservation;
}) {
  const startDate = new Date(
    reservation.startTime,
  );

  const endDate = new Date(
    reservation.endTime,
  );

  const dateText =
    startDate.toLocaleDateString(
      'nl-NL',
      {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      },
    );

  const startTimeText =
    startDate.toLocaleTimeString(
      'nl-NL',
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    );

  const endTimeText =
    endDate.toLocaleTimeString(
      'nl-NL',
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    );

  const tableName =
    reservation.table
      ? reservation.table.label ||
        String(
          reservation.table.number,
        )
      : null;

  const reference =
    reservation.id
      .slice(-8)
      .toUpperCase();

  const isUpcoming =
    endDate.getTime() >= Date.now() &&
    reservation.status !==
      'CANCELLED' &&
    reservation.status !==
      'COMPLETED' &&
    reservation.status !==
      'NO_SHOW';

  return (
    <article className="group overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.03] transition duration-300 hover:-translate-y-0.5 hover:border-amber-300/25 hover:bg-white/[0.045]">
      <div className="grid lg:grid-cols-[1fr_auto]">
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge
              status={reservation.status}
            />

            {reservation.checkedInAt && (
              <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-green-300">
                Checked in
              </span>
            )}

            {isUpcoming && (
              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-blue-300">
                Upcoming
              </span>
            )}
          </div>

          <h2 className="mt-5 text-2xl font-black capitalize tracking-tight sm:text-3xl">
            {dateText}
          </h2>

          <p className="mt-3 text-base font-bold text-zinc-300">
            {startTimeText} –{' '}
            {endTimeText}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ReservationInfo
              label="Guests"
              value={`${reservation.guests} ${
                reservation.guests === 1
                  ? 'guest'
                  : 'guests'
              }`}
            />

            <ReservationInfo
              label="Table"
              value={
                tableName
                  ? `Table ${tableName}`
                  : 'Not assigned'
              }
            />

            <ReservationInfo
              label="Booked for"
              value={reservation.name}
            />

            <ReservationInfo
              label="Reference"
              value={reference}
            />
          </div>

          {reservation.message && (
            <div className="mt-5 rounded-2xl border border-white/[0.07] bg-black/25 px-5 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600">
                Special request
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {reservation.message}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-white/[0.08] bg-black/20 p-5 lg:w-[240px] lg:border-l lg:border-t-0 lg:p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
            Reservation details
          </p>

          <div className="mt-5 space-y-4">
            <SideInfo
              label="Email"
              value={
                reservation.email ||
                'Not provided'
              }
            />

            <SideInfo
              label="Phone"
              value={reservation.phone}
            />

            <SideInfo
              label="Created"
              value={new Date(
                reservation.createdAt,
              ).toLocaleDateString(
                'nl-NL',
                {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                },
              )}
            />
          </div>

          {reservation.qrToken &&
            isUpcoming && (
              <div className="mt-6 rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] p-4">
                <p className="text-xs font-black text-amber-200">
                  QR confirmation ready
                </p>

                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  Your QR code was sent
                  to your email and can be
                  shown at the restaurant.
                </p>
              </div>
            )}
        </div>
      </div>
    </article>
  );
}

function ReservationInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/25 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-black text-zinc-200">
        {value}
      </p>
    </div>
  );
}

function SideInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-zinc-300">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: ReservationStatus;
}) {
  const styles: Record<
    ReservationStatus,
    string
  > = {
    PENDING:
      'border-orange-500/20 bg-orange-500/10 text-orange-300',
    CONFIRMED:
      'border-amber-300/20 bg-amber-300/10 text-amber-200',
    CANCELLED:
      'border-red-500/20 bg-red-500/10 text-red-300',
    COMPLETED:
      'border-green-500/20 bg-green-500/10 text-green-300',
    NO_SHOW:
      'border-zinc-500/20 bg-zinc-500/10 text-zinc-300',
  };

  return (
    <span
      className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${styles[status]}`}
    >
      {status.replaceAll('_', ' ')}
    </span>
  );
}

function Statistic({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#0c0a09] px-6 py-5 sm:px-8">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function EmptyReservations({
  filter,
}: {
  filter: ReservationFilter;
}) {
  const content: Record<
    ReservationFilter,
    {
      title: string;
      description: string;
    }
  > = {
    upcoming: {
      title:
        'No upcoming reservations',
      description:
        'Plan your next visit to DaWu. New reservations linked to your account will appear here automatically.',
    },
    history: {
      title:
        'No reservation history yet',
      description:
        'Completed, cancelled and previous reservations will appear here.',
    },
    all: {
      title: 'No reservations yet',
      description:
        'Create your first reservation and keep all your DaWu bookings in one place.',
    },
  };

  return (
    <div className="mt-6 rounded-[30px] border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-amber-300">
        <CalendarIcon />
      </div>

      <h2 className="mt-6 text-2xl font-black">
        {content[filter].title}
      </h2>

      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-zinc-500">
        {
          content[filter]
            .description
        }
      </p>

      <Link
        href="/#reservation"
        className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-black uppercase tracking-[0.15em] text-black transition hover:-translate-y-0.5"
      >
        Reserve a Table
      </Link>
    </div>
  );
}

function ErrorNotice({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mt-6 flex flex-col gap-4 rounded-[24px] border border-red-500/20 bg-red-500/[0.08] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-black text-red-200">
          Could not load reservations
        </p>

        <p className="mt-1 text-sm text-red-300/70">
          {message}
        </p>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="min-h-11 rounded-full border border-red-300/20 px-5 text-sm font-black text-red-200 transition hover:bg-red-300/10"
      >
        Try Again
      </button>
    </div>
  );
}

function LoginRequired() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070504] px-5 text-white">
      <div className="w-full max-w-lg rounded-[34px] border border-white/10 bg-white/[0.035] p-8 text-center shadow-2xl sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-300 text-black">
          <UserIcon />
        </div>

        <h1 className="mt-6 text-3xl font-black tracking-tight">
          Account required
        </h1>

        <p className="mt-4 leading-7 text-zinc-400">
          Log in through the account
          button on the DaWu website to
          view your reservations.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-black uppercase tracking-[0.15em] text-black"
        >
          Back to DaWu
        </Link>
      </div>
    </main>
  );
}

function ReservationsLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070504] text-white">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-amber-300/20 border-t-amber-300" />

        <p className="mt-5 text-sm font-bold text-zinc-500">
          Loading your reservations...
        </p>
      </div>
    </main>
  );
}

function AccountFooter() {
  return (
    <footer className="mt-14 border-t border-white/[0.08] py-8 text-center">
      <p className="text-xs uppercase tracking-[0.22em] text-zinc-700">
        DaWu Sushi Fusion ·
        Beverwijk
      </p>
    </footer>
  );
}

function RefreshIcon({
  spinning,
}: {
  spinning: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 ${
        spinning
          ? 'animate-spin'
          : ''
      }`}
      aria-hidden="true"
    >
      <path d="M20 11a8 8 0 1 0-2.34 5.66" />
      <path d="M20 4v7h-7" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
      />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}