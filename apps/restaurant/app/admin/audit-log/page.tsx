'use client';

import Link from 'next/link';
import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';

import { useAccount } from '../../../components/account/AccountProvider';

type CustomerRole = 'CUSTOMER' | 'ADMIN' | 'OWNER';

type AuditActor = {
  id: string;
  name: string;
  email: string;
  role: CustomerRole;
};

type AuditLog = {
  id: string;
  actorId: string;
  targetCustomerId: string | null;
  action: string;
  beforeData: unknown;
  afterData: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  actor: AuditActor;
};

type AuditResponse = {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const API_URL = '/api/customer-admin';

export default function AuditLogPage() {
  const { customer, loading: accountLoading } = useAccount();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadLogs = useCallback(
    async (silent = false) => {
      if (customer?.role !== 'OWNER') {
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
        const params = new URLSearchParams({
          page: String(page),
          limit: '30',
        });

        if (search) {
          params.set('search', search);
        }

        const response = await fetch(
          `${API_URL}/audit-logs?${params.toString()}`,
          {
            credentials: 'include',
            cache: 'no-store',
          },
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            getErrorMessage(
              data,
              'Could not load the audit log.',
            ),
          );
        }

        const result = data as AuditResponse;

        setLogs(Array.isArray(result.logs) ? result.logs : []);
        setTotal(result.pagination?.total || 0);
        setTotalPages(result.pagination?.totalPages || 1);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Could not load the audit log.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [customer?.role, page, search],
  );

  useEffect(() => {
    if (accountLoading) {
      return;
    }

    void loadLogs();
  }, [accountLoading, loadLogs]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  if (accountLoading || loading) {
    return <LoadingScreen />;
  }

  if (!customer || customer.role !== 'OWNER') {
    return <AccessDenied />;
  }

  return (
    <main className="min-h-screen bg-[#070504] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-14rem] top-[-14rem] h-[34rem] w-[34rem] rounded-full bg-amber-300/[0.045] blur-[150px]" />
        <div className="absolute bottom-[-18rem] right-[-14rem] h-[40rem] w-[40rem] rounded-full bg-orange-500/[0.035] blur-[170px]" />
      </div>

      <div className="relative mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        <header className="flex flex-col justify-between gap-6 border-b border-white/[0.08] pb-8 xl:flex-row xl:items-end">
          <div>
            <Link
              href="/admin"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 text-sm font-black transition hover:bg-white/[0.07]"
            >
              <ArrowLeftIcon />
              Back to customers
            </Link>

            <p className="mt-8 text-xs font-black uppercase tracking-[0.32em] text-amber-300">
              DaWu Control Center
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Audit Log
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
              A permanent security history of support actions,
              administrator changes and account-management events.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void loadLogs(true)}
              disabled={refreshing}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-6 text-sm font-black uppercase tracking-[0.14em] transition hover:bg-white/[0.07] disabled:opacity-50"
            >
              <RefreshIcon spinning={refreshing} />
              {refreshing ? 'Refreshing' : 'Refresh'}
            </button>

            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-5 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
                Protected access
              </p>

              <p className="mt-1 font-black">
                OWNER
              </p>
            </div>
          </div>
        </header>

        <section className="mt-8 overflow-hidden rounded-[30px] border border-white/10 bg-[#0d0b0a] shadow-[0_30px_100px_rgba(0,0,0,0.32)]">
          <div className="border-b border-white/[0.08] p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
              <div>
                <h2 className="text-2xl font-black">
                  Administrative activity
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  {total} recorded {total === 1 ? 'event' : 'events'}.
                </p>
              </div>

              <form
                onSubmit={submitSearch}
                className="flex w-full max-w-xl gap-2"
              >
                <div className="relative flex-1">
                  <SearchIcon />

                  <input
                    value={searchInput}
                    onChange={(event) =>
                      setSearchInput(event.target.value)
                    }
                    placeholder="Search action or administrator email..."
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/50 pl-11 pr-4 text-sm outline-none transition placeholder:text-zinc-700 focus:border-amber-300"
                  />
                </div>

                <button
                  type="submit"
                  className="h-12 rounded-2xl bg-white px-5 text-sm font-black text-black transition hover:bg-zinc-200"
                >
                  Search
                </button>
              </form>
            </div>
          </div>

          {error ? (
            <div className="p-6">
              <ErrorNotice
                message={error}
                onRetry={() => void loadLogs()}
              />
            </div>
          ) : logs.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y divide-white/[0.065]">
              {logs.map((log) => (
                <AuditLogCard
                  key={log.id}
                  log={log}
                />
              ))}
            </div>
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={setPage}
          />
        </section>
      </div>
    </main>
  );
}

function AuditLogCard({ log }: { log: AuditLog }) {
  const details = getActionDetails(log.action);

  return (
    <article className="p-5 transition hover:bg-white/[0.025] sm:p-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${details.iconClass}`}
          >
            <ActivityIcon />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-black text-white">
                {details.label}
              </h3>

              <ActionBadge
                action={log.action}
              />
            </div>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Performed by{' '}
              <span className="font-bold text-zinc-300">
                {log.actor.name}
              </span>{' '}
              ({log.actor.email})
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <RoleBadge role={log.actor.role} />

              {log.targetCustomerId && (
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500">
                  Target {log.targetCustomerId.slice(-8).toUpperCase()}
                </span>
              )}

              {log.ip && (
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500">
                  IP {log.ip}
                </span>
              )}
            </div>
          </div>
        </div>

        <time
          dateTime={log.createdAt}
          className="shrink-0 text-sm font-bold text-zinc-600"
        >
          {formatDateTime(log.createdAt)}
        </time>
      </div>

     {Boolean(log.beforeData || log.afterData) && (
  <div className="mt-5 grid gap-3 lg:grid-cols-2">
    <DataPanel
      title="Before"
      data={log.beforeData}
    />

    <DataPanel
      title="After"
      data={log.afterData}
    />
  </div>
)}

      {log.userAgent && (
        <p className="mt-4 break-words border-t border-white/[0.06] pt-4 text-xs leading-5 text-zinc-700">
          {log.userAgent}
        </p>
      )}
    </article>
  );
}

function DataPanel({
  title,
  data,
}: {
  title: string;
  data: unknown;
}) {
  if (!data) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-black/25 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700">
          {title}
        </p>

        <p className="mt-3 text-sm text-zinc-700">
          No recorded data
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-black/25">
      <p className="border-b border-white/[0.06] px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
        {title}
      </p>

      <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words p-4 text-xs leading-6 text-zinc-400">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  return (
    <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.08] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-amber-200">
      {action.replaceAll('_', ' ')}
    </span>
  );
}

function RoleBadge({ role }: { role: CustomerRole }) {
  const styles: Record<CustomerRole, string> = {
    CUSTOMER:
      'border-white/10 bg-white/[0.04] text-zinc-400',
    ADMIN:
      'border-blue-500/20 bg-blue-500/10 text-blue-300',
    OWNER:
      'border-amber-300/25 bg-amber-300/10 text-amber-200',
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${styles[role]}`}
    >
      {role}
    </span>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-white/[0.08] px-5 py-4 sm:px-6">
      <p className="text-sm text-zinc-600">
        Page {page} of {totalPages}
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="h-10 rounded-xl border border-white/10 px-4 text-sm font-black transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-30"
        >
          Previous
        </button>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="h-10 rounded-xl border border-white/10 px-4 text-sm font-black transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-amber-300">
        <ActivityIcon />
      </div>

      <h3 className="mt-5 text-xl font-black">
        No audit events found
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">
        Administrative account changes will appear here automatically.
      </p>
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
    <div className="flex flex-col justify-between gap-4 rounded-[24px] border border-red-500/20 bg-red-500/[0.08] p-5 sm:flex-row sm:items-center">
      <div>
        <p className="font-black text-red-200">
          Could not load audit events
        </p>

        <p className="mt-1 text-sm text-red-300/70">
          {message}
        </p>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="rounded-full border border-red-300/20 px-5 py-2 text-sm font-black text-red-200"
      >
        Try Again
      </button>
    </div>
  );
}

function AccessDenied() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070504] px-5 text-white">
      <div className="w-full max-w-lg rounded-[34px] border border-white/10 bg-white/[0.035] p-9 text-center">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-red-300">
          Access denied
        </p>

        <h1 className="mt-4 text-4xl font-black">
          OWNER access required
        </h1>

        <p className="mt-4 leading-7 text-zinc-400">
          The administrative audit log is restricted to the DaWu OWNER.
        </p>

        <Link
          href="/admin"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 font-black text-black"
        >
          Back to admin
        </Link>
      </div>
    </main>
  );
}

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070504] text-white">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-amber-300/20 border-t-amber-300" />

        <p className="mt-5 text-sm font-bold text-zinc-600">
          Loading audit log...
        </p>
      </div>
    </main>
  );
}

function getActionDetails(action: string) {
  const labels: Record<string, string> = {
    CUSTOMER_PROFILE_UPDATED: 'Customer profile updated',
    CUSTOMER_BLOCKED: 'Customer account blocked',
    CUSTOMER_UNBLOCKED: 'Customer account unblocked',
    CUSTOMER_PASSWORD_RESET: 'Customer password reset',
    CUSTOMER_SESSIONS_REVOKED: 'Customer sessions revoked',
    CUSTOMER_ROLE_CHANGED: 'Customer role changed',
    CUSTOMER_SOFT_DELETED: 'Customer account deactivated',
    CUSTOMER_RESTORED: 'Customer account restored',
  };

  return {
    label: labels[action] || action.replaceAll('_', ' '),
    iconClass:
      action.includes('BLOCKED') ||
      action.includes('DELETED')
        ? 'border-red-500/20 bg-red-500/10 text-red-300'
        : action.includes('UNBLOCKED') ||
            action.includes('RESTORED')
          ? 'border-green-500/20 bg-green-500/10 text-green-300'
          : 'border-amber-300/20 bg-amber-300/10 text-amber-200',
  };
}

function getErrorMessage(data: any, fallback: string) {
  if (typeof data?.message === 'string') {
    return data.message;
  }

  if (Array.isArray(data?.message)) {
    return data.message.join(', ');
  }

  return fallback;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-700"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 ${spinning ? 'animate-spin' : ''}`}
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

function ActivityIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M3 12h4l2-7 4 14 2-7h6" />
    </svg>
  );
}