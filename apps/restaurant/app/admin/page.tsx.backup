'use client';

import Link from 'next/link';
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Customer,
  useAccount,
} from '../../components/account/AccountProvider';

type CustomerRole =
  | 'CUSTOMER'
  | 'ADMIN'
  | 'OWNER';

type CustomerStatusFilter =
  | 'all'
  | 'active'
  | 'blocked'
  | 'deleted';

type RoleFilter =
  | 'ALL'
  | CustomerRole;

type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: CustomerRole;

  isBlocked: boolean;
  blockedAt: string | null;
  blockedReason: string | null;

  deletedAt: string | null;
  mustChangePassword: boolean;

  createdAt: string;
  updatedAt: string;

  _count?: {
    sessions: number;
    reservations: number;
  };
};

type CustomerSession = {
  id: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string | null;
};

type CustomerReservationLink = {
  id: string;
  createdAt: string;
  reservation: {
    id: string;
    guests: number;
    startTime: string;
    endTime: string;
    status: string;
    checkedInAt?: string | null;
    table?: {
      id: string;
      number: number;
      label?: string | null;
    } | null;
  };
};

type CustomerDetails = AdminCustomer & {
  sessions: CustomerSession[];
  reservations: CustomerReservationLink[];

  _count: {
    sessions: number;
    reservations: number;
  };
};

type DashboardResponse = {
  actor: {
    id: string;
    name: string;
    email: string;
    role: CustomerRole;
  };

  statistics: {
    totalCustomers: number;
    blockedCustomers: number;
    deletedCustomers: number;
    admins: number;
    activeSessions: number;
  };

  recentCustomers: AdminCustomer[];
};

type CustomersResponse = {
  customers: AdminCustomer[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type DrawerTab =
  | 'overview'
  | 'profile'
  | 'reservations'
  | 'sessions'
  | 'support';

const API_URL = '/api/customer-admin';

export default function AdminPage() {
  const {
    customer,
    loading: accountLoading,
  } = useAccount();

  const [dashboard, setDashboard] =
    useState<DashboardResponse | null>(null);

  const [customers, setCustomers] =
    useState<AdminCustomer[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [customersLoading, setCustomersLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [searchInput, setSearchInput] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState<CustomerStatusFilter>('all');

  const [roleFilter, setRoleFilter] =
    useState<RoleFilter>('ALL');

  const [page, setPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const [totalCustomers, setTotalCustomers] =
    useState(0);

  const [
    selectedCustomerId,
    setSelectedCustomerId,
  ] = useState<string | null>(null);

  const [
    selectedCustomer,
    setSelectedCustomer,
  ] = useState<CustomerDetails | null>(null);

  const [drawerLoading, setDrawerLoading] =
    useState(false);

  const [drawerTab, setDrawerTab] =
    useState<DrawerTab>('overview');

  const [actionError, setActionError] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const hasAdminAccess =
    customer?.role === 'OWNER' ||
    customer?.role === 'ADMIN';

  const loadDashboard = useCallback(async () => {
    const response = await fetch(
      `${API_URL}/dashboard`,
      {
        credentials: 'include',
        cache: 'no-store',
      },
    );

    const data = await readResponse(response);

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          data,
          'Could not load administration dashboard',
        ),
      );
    }

    setDashboard(data as DashboardResponse);
  }, []);

  const loadCustomers = useCallback(async () => {
    setCustomersLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      });

      if (search) {
        params.set('search', search);
      }

      if (roleFilter !== 'ALL') {
        params.set('role', roleFilter);
      }

      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const response = await fetch(
        `${API_URL}/customers?${params.toString()}`,
        {
          credentials: 'include',
          cache: 'no-store',
        },
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            'Could not load customers',
          ),
        );
      }

      const result = data as CustomersResponse;

      setCustomers(
        Array.isArray(result.customers)
          ? result.customers
          : [],
      );

      setTotalPages(
        result.pagination?.totalPages || 1,
      );

      setTotalCustomers(
        result.pagination?.total || 0,
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Could not load customers',
      );
    } finally {
      setCustomersLoading(false);
    }
  }, [
    page,
    roleFilter,
    search,
    statusFilter,
  ]);

  const initialiseAdmin = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      await Promise.all([
        loadDashboard(),
        loadCustomers(),
      ]);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Could not load administration panel',
      );
    } finally {
      setLoading(false);
    }
  }, [
    loadCustomers,
    loadDashboard,
  ]);

  useEffect(() => {
    if (accountLoading) {
      return;
    }

    if (!hasAdminAccess) {
      setLoading(false);
      return;
    }

    void initialiseAdmin();
  }, [
    accountLoading,
    hasAdminAccess,
    initialiseAdmin,
  ]);

  useEffect(() => {
    if (
      accountLoading ||
      loading ||
      !hasAdminAccess
    ) {
      return;
    }

    void loadCustomers();
  }, [
    accountLoading,
    hasAdminAccess,
    loadCustomers,
    loading,
  ]);

  const loadCustomerDetails =
    useCallback(
      async (customerId: string) => {
        setDrawerLoading(true);
        setActionError('');
        setSuccessMessage('');

        try {
          const response = await fetch(
            `${API_URL}/customers/${customerId}`,
            {
              credentials: 'include',
              cache: 'no-store',
            },
          );

          const data = await readResponse(response);

          if (!response.ok) {
            throw new Error(
              getErrorMessage(
                data,
                'Could not load customer',
              ),
            );
          }

          setSelectedCustomer(
            data as CustomerDetails,
          );
        } catch (loadError) {
          setActionError(
            loadError instanceof Error
              ? loadError.message
              : 'Could not load customer',
          );
        } finally {
          setDrawerLoading(false);
        }
      },
      [],
    );

  async function openCustomer(
    customerId: string,
  ) {
    setSelectedCustomerId(customerId);
    setSelectedCustomer(null);
    setDrawerTab('overview');

    await loadCustomerDetails(customerId);
  }

  function closeDrawer() {
    setSelectedCustomerId(null);
    setSelectedCustomer(null);
    setActionError('');
    setSuccessMessage('');
  }

  function submitSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput.trim());
  }

  async function refreshAll() {
    setSuccessMessage('');

    await Promise.all([
      loadDashboard(),
      loadCustomers(),
    ]);

    if (selectedCustomerId) {
      await loadCustomerDetails(
        selectedCustomerId,
      );
    }
  }

  async function performCustomerAction(
    request: () => Promise<Response>,
    success: string,
  ) {
    if (!selectedCustomerId) {
      return;
    }

    setActionError('');
    setSuccessMessage('');

    try {
      const response = await request();
      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            'The action could not be completed',
          ),
        );
      }

      setSuccessMessage(success);

      await Promise.all([
        loadCustomerDetails(
          selectedCustomerId,
        ),
        loadDashboard(),
        loadCustomers(),
      ]);
    } catch (actionFailure) {
      setActionError(
        actionFailure instanceof Error
          ? actionFailure.message
          : 'The action could not be completed',
      );
    }
  }

  const statistics = useMemo(
    () => [
      {
        label: 'Customers',
        value:
          dashboard?.statistics.totalCustomers ??
          0,
        description:
          'Active customer accounts',
        icon: <UsersIcon />,
      },
      {
        label: 'Administrators',
        value:
          dashboard?.statistics.admins ?? 0,
        description:
          'Owner and support access',
        icon: <ShieldIcon />,
      },
      {
        label: 'Blocked',
        value:
          dashboard?.statistics.blockedCustomers ??
          0,
        description:
          'Restricted customer accounts',
        icon: <BlockedIcon />,
      },
      {
        label: 'Active Sessions',
        value:
          dashboard?.statistics.activeSessions ??
          0,
        description:
          'Signed-in customer devices',
        icon: <SessionIcon />,
      },
    ],
    [dashboard],
  );

  if (accountLoading || loading) {
    return <AdminLoading />;
  }

  if (!customer || !hasAdminAccess) {
    return <AccessDenied />;
  }

  return (
    <main className="min-h-screen bg-[#070504] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-16rem] top-[-16rem] h-[38rem] w-[38rem] rounded-full bg-amber-300/[0.045] blur-[150px]" />
        <div className="absolute bottom-[-20rem] right-[-16rem] h-[42rem] w-[42rem] rounded-full bg-orange-500/[0.035] blur-[170px]" />
      </div>

      <div className="relative flex min-h-screen">
        <AdminSidebar
          customer={customer}
        />

        <div className="min-w-0 flex-1 lg:pl-[280px]">
          <AdminMobileHeader
            customer={customer}
            onMenuOpen={() =>
              setMobileMenuOpen(true)
            }
          />

          <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-10">
            <header className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.32em] text-amber-300">
                  DaWu Control Center
                </p>

                <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                  Customer Management
                </h1>

                <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
                  Manage customer accounts,
                  support requests, access roles,
                  sessions and account security.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void refreshAll()}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-6 text-sm font-black uppercase tracking-[0.14em] transition hover:border-white/20 hover:bg-white/[0.07]"
                >
                  <RefreshIcon />
                  Refresh
                </button>

                <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-5 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
                    Current Access
                  </p>

                  <p className="mt-1 font-black">
                    {customer.role}
                  </p>
                </div>
              </div>
            </header>

            {error && (
              <ErrorBanner
                message={error}
                onRetry={() =>
                  void initialiseAdmin()
                }
              />
            )}

            <section className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statistics.map((statistic) => (
                <StatisticCard
                  key={statistic.label}
                  {...statistic}
                />
              ))}
            </section>

            <section className="mt-9 overflow-hidden rounded-[30px] border border-white/10 bg-[#0d0b0a] shadow-[0_30px_100px_rgba(0,0,0,0.32)]">
              <div className="border-b border-white/[0.08] p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
                  <div>
                    <h2 className="text-2xl font-black">
                      Customer Accounts
                    </h2>

                    <p className="mt-2 text-sm text-zinc-500">
                      {totalCustomers}{' '}
                      {totalCustomers === 1
                        ? 'account'
                        : 'accounts'}{' '}
                      match the current filters.
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
                          setSearchInput(
                            event.target.value,
                          )
                        }
                        placeholder="Search name, email or phone..."
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

                <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <StatusFilters
                    value={statusFilter}
                    onChange={(value) => {
                      setPage(1);
                      setStatusFilter(value);
                    }}
                  />

                  <RoleFilters
                    value={roleFilter}
                    onChange={(value) => {
                      setPage(1);
                      setRoleFilter(value);
                    }}
                    owner={
                      customer.role === 'OWNER'
                    }
                  />
                </div>
              </div>

              <CustomerTable
                customers={customers}
                loading={customersLoading}
                onOpen={openCustomer}
              />

              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={setPage}
              />
            </section>
          </div>
        </div>
      </div>

      <AdminMobileMenu
        customer={customer}
        open={mobileMenuOpen}
        onClose={() =>
          setMobileMenuOpen(false)
        }
      />

      {selectedCustomerId && (
        <CustomerDrawer
          currentCustomer={customer}
          customer={selectedCustomer}
          loading={drawerLoading}
          activeTab={drawerTab}
          onTabChange={setDrawerTab}
          onClose={closeDrawer}
          error={actionError}
          success={successMessage}
          onRefresh={() =>
            void loadCustomerDetails(
              selectedCustomerId,
            )
          }
          onUpdateProfile={(profile) =>
            performCustomerAction(
              () =>
                fetch(
                  `${API_URL}/customers/${selectedCustomerId}/profile`,
                  {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: {
                      'Content-Type':
                        'application/json',
                    },
                    body: JSON.stringify(profile),
                  },
                ),
              'Customer profile updated successfully.',
            )
          }
          onResetPassword={(password) =>
            performCustomerAction(
              () =>
                fetch(
                  `${API_URL}/customers/${selectedCustomerId}/reset-password`,
                  {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                      'Content-Type':
                        'application/json',
                    },
                    body: JSON.stringify({
                      password,
                    }),
                  },
                ),
              'Temporary password set. The customer must change it after login.',
            )
          }
          onBlock={(reason) =>
            performCustomerAction(
              () =>
                fetch(
                  `${API_URL}/customers/${selectedCustomerId}/block`,
                  {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                      'Content-Type':
                        'application/json',
                    },
                    body: JSON.stringify({
                      reason,
                    }),
                  },
                ),
              'Customer account blocked successfully.',
            )
          }
          onUnblock={() =>
            performCustomerAction(
              () =>
                fetch(
                  `${API_URL}/customers/${selectedCustomerId}/unblock`,
                  {
                    method: 'POST',
                    credentials: 'include',
                  },
                ),
              'Customer account unblocked.',
            )
          }
          onRevokeSessions={() =>
            performCustomerAction(
              () =>
                fetch(
                  `${API_URL}/customers/${selectedCustomerId}/revoke-sessions`,
                  {
                    method: 'POST',
                    credentials: 'include',
                  },
                ),
              'All customer sessions were revoked.',
            )
          }
          onRoleChange={(role) =>
            performCustomerAction(
              () =>
                fetch(
                  `${API_URL}/customers/${selectedCustomerId}/role`,
                  {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: {
                      'Content-Type':
                        'application/json',
                    },
                    body: JSON.stringify({
                      role,
                    }),
                  },
                ),
              `Customer role changed to ${role}.`,
            )
          }
          onDelete={() =>
            performCustomerAction(
              () =>
                fetch(
                  `${API_URL}/customers/${selectedCustomerId}`,
                  {
                    method: 'DELETE',
                    credentials: 'include',
                  },
                ),
              'Customer account was deactivated.',
            )
          }
          onRestore={() =>
            performCustomerAction(
              () =>
                fetch(
                  `${API_URL}/customers/${selectedCustomerId}/restore`,
                  {
                    method: 'POST',
                    credentials: 'include',
                  },
                ),
              'Customer account was restored.',
            )
          }
        />
      )}
    </main>
  );
}

function AdminSidebar({
  customer,
}: {
  customer: Customer;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] border-r border-white/[0.08] bg-[#090807] p-5 lg:flex lg:flex-col">
      <Link
        href="/"
        className="rounded-[24px] border border-white/10 bg-white/[0.025] p-5"
      >
        <p className="text-2xl font-black tracking-[0.28em]">
          DAWU
        </p>

        <p className="mt-2 text-[10px] font-black uppercase tracking-[0.32em] text-amber-300">
          Control Center
        </p>
      </Link>

      <nav className="mt-8 space-y-2">
        <SidebarItem
          title="Dashboard"
          active={false}
        />

        <SidebarItem
          title="Customers"
          active
        />

        <SidebarItem
          title="Administrators"
          active={false}
          ownerOnly
        />
        <Link
  href="/admin/restaurant-settings"
  className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-black text-zinc-500 transition hover:bg-white/[0.05] hover:text-white"
>
  Restaurant Settings

  <span className="text-[9px] uppercase tracking-[0.14em] opacity-60">
    Live
  </span>
</Link>

        {customer.role === 'OWNER' && (
          <Link
            href="/admin/audit-log"
            className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-black text-zinc-500 transition hover:bg-white/[0.05] hover:text-white"
          >
            Audit Log
            <span className="text-[9px] uppercase tracking-[0.14em] opacity-60">
              Owner
            </span>
          </Link>
        )}

        <SidebarItem
          title="Security"
          active={false}
        />
      </nav>

      <div className="mt-auto rounded-[24px] border border-white/10 bg-white/[0.025] p-4">
        <div className="flex items-center gap-3">
          <Avatar
            name={customer.name}
            size="small"
          />

          <div className="min-w-0">
            <p className="truncate font-black">
              {customer.name}
            </p>

            <p className="truncate text-xs text-zinc-600">
              {customer.email}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <RoleBadge role={customer.role} />

          <Link
            href="/"
            className="text-xs font-black text-zinc-500 transition hover:text-white"
          >
            Exit
          </Link>
        </div>
      </div>
    </aside>
  );
}

function AdminMobileHeader({
  customer,
  onMenuOpen,
}: {
  customer: Customer;
  onMenuOpen: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.08] bg-[#090807]/95 px-4 backdrop-blur-xl lg:hidden">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open administration menu"
          onClick={onMenuOpen}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] text-white transition active:scale-95"
        >
          <MenuIcon />
        </button>

        <Link
          href="/admin"
          className="font-black tracking-[0.22em]"
        >
          DAWU
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <RoleBadge role={customer.role} />

        <Avatar
          name={customer.name}
          size="small"
        />
      </div>
    </header>
  );
}

function AdminMobileMenu({
  customer,
  open,
  onClose,
}: {
  customer: Customer;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    function handleEscape(
      event: KeyboardEvent,
    ) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener(
      'keydown',
      handleEscape,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        'keydown',
        handleEscape,
      );
    };
  }, [open, onClose]);

  return (
    <div
      className={[
        'fixed inset-0 z-[90] lg:hidden',
        open
          ? 'pointer-events-auto'
          : 'pointer-events-none',
      ].join(' ')}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close administration menu"
        onClick={onClose}
        className={[
          'absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300',
          open
            ? 'opacity-100'
            : 'opacity-0',
        ].join(' ')}
      />

      <aside
        className={[
          'absolute inset-y-0 left-0 flex w-[88%] max-w-[340px] flex-col border-r border-white/10 bg-[#090807] p-5 shadow-[30px_0_100px_rgba(0,0,0,0.65)] transition-transform duration-300 ease-out',
          open
            ? 'translate-x-0'
            : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-4">
          <Link
            href="/"
            onClick={onClose}
            className="min-w-0 flex-1 rounded-[24px] border border-white/10 bg-white/[0.025] p-5"
          >
            <p className="text-2xl font-black tracking-[0.28em]">
              DAWU
            </p>

            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.32em] text-amber-300">
              Control Center
            </p>
          </Link>

          <button
            type="button"
            aria-label="Close administration menu"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="mt-8 space-y-2">
          <MobileAdminButton
            title="Dashboard"
          />

          <MobileAdminLink
            href="/admin"
            title="Customers"
            active
            onClick={onClose}
          />

          <MobileAdminButton
            title="Administrators"
            badge="Owner"
          />

          <MobileAdminLink
            href="/admin/restaurant-settings"
            title="Restaurant Settings"
            badge="Live"
            onClick={onClose}
          />

          {customer.role === 'OWNER' && (
            <MobileAdminLink
              href="/admin/audit-log"
              title="Audit Log"
              badge="Owner"
              onClick={onClose}
            />
          )}

          <MobileAdminButton
            title="Security"
          />
        </nav>

        <div className="mt-auto rounded-[24px] border border-white/10 bg-white/[0.025] p-4">
          <div className="flex items-center gap-3">
            <Avatar
              name={customer.name}
              size="small"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate font-black">
                {customer.name}
              </p>

              <p className="mt-1 truncate text-xs text-zinc-600">
                {customer.email}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <RoleBadge role={customer.role} />

            <Link
              href="/"
              onClick={onClose}
              className="text-xs font-black text-zinc-500 transition hover:text-white"
            >
              Exit
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}

function MobileAdminLink({
  href,
  title,
  active = false,
  badge,
  onClick,
}: {
  href: string;
  title: string;
  active?: boolean;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        'flex min-h-[52px] w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-sm font-black transition',
        active
          ? 'bg-white text-black'
          : 'text-zinc-400 hover:bg-white/[0.05] hover:text-white',
      ].join(' ')}
    >
      <span>{title}</span>

      {badge && (
        <span
          className={[
            'text-[9px] uppercase tracking-[0.14em]',
            active
              ? 'text-black/45'
              : 'text-zinc-700',
          ].join(' ')}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

function MobileAdminButton({
  title,
  badge,
}: {
  title: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      disabled
      className="flex min-h-[52px] w-full cursor-not-allowed items-center justify-between rounded-2xl px-4 py-3.5 text-left text-sm font-black text-zinc-700"
    >
      <span>{title}</span>

      {badge && (
        <span className="text-[9px] uppercase tracking-[0.14em] text-zinc-800">
          {badge}
        </span>
      )}
    </button>
  );
}

function SidebarItem({
  title,
  active,
  ownerOnly = false,
}: {
  title: string;
  active: boolean;
  ownerOnly?: boolean;
}) {
  return (
    <button
      type="button"
      className={[
        'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-black transition',
        active
          ? 'bg-white text-black'
          : 'text-zinc-500 hover:bg-white/[0.05] hover:text-white',
      ].join(' ')}
    >
      {title}

      {ownerOnly && (
        <span className="text-[9px] uppercase tracking-[0.14em] opacity-60">
          Owner
        </span>
      )}
    </button>
  );
}

function StatisticCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5 transition hover:border-amber-300/20 hover:bg-white/[0.045]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-amber-300">
          {icon}
        </div>

        <span className="rounded-full border border-white/[0.08] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-600">
          Live
        </span>
      </div>

      <p className="mt-6 text-4xl font-black tracking-tight">
        {value}
      </p>

      <p className="mt-2 font-black">
        {label}
      </p>

      <p className="mt-1 text-sm text-zinc-600">
        {description}
      </p>
    </article>
  );
}

function StatusFilters({
  value,
  onChange,
}: {
  value: CustomerStatusFilter;
  onChange: (
    value: CustomerStatusFilter,
  ) => void;
}) {
  const options: Array<{
    value: CustomerStatusFilter;
    label: string;
  }> = [
    {
      value: 'all',
      label: 'All',
    },
    {
      value: 'active',
      label: 'Active',
    },
    {
      value: 'blocked',
      label: 'Blocked',
    },
    {
      value: 'deleted',
      label: 'Deleted',
    },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() =>
            onChange(option.value)
          }
          className={[
            'min-h-10 whitespace-nowrap rounded-full px-4 text-xs font-black uppercase tracking-[0.12em] transition',
            value === option.value
              ? 'bg-amber-300 text-black'
              : 'border border-white/10 bg-white/[0.025] text-zinc-500 hover:text-white',
          ].join(' ')}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function RoleFilters({
  value,
  onChange,
  owner,
}: {
  value: RoleFilter;
  onChange: (value: RoleFilter) => void;
  owner: boolean;
}) {
  const roles: RoleFilter[] = [
    'ALL',
    'CUSTOMER',
    'ADMIN',
  ];

  if (owner) {
    roles.push('OWNER');
  }

  return (
    <select
      value={value}
      onChange={(event) =>
        onChange(
          event.target.value as RoleFilter,
        )
      }
      className="h-11 rounded-2xl border border-white/10 bg-black/50 px-4 text-sm font-bold text-white outline-none focus:border-amber-300"
    >
      {roles.map((role) => (
        <option
          key={role}
          value={role}
        >
          {role === 'ALL'
            ? 'All roles'
            : role}
        </option>
      ))}
    </select>
  );
}

function CustomerTable({
  customers,
  loading,
  onOpen,
}: {
  customers: AdminCustomer[];
  loading: boolean;
  onOpen: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex min-h-[340px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="flex min-h-[340px] flex-col items-center justify-center px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-amber-300">
          <UsersIcon />
        </div>

        <h3 className="mt-5 text-xl font-black">
          No customer accounts found
        </h3>

        <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">
          Try changing the search term or
          selecting a different filter.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/[0.07] text-left">
              <TableHeading>
                Customer
              </TableHeading>
              <TableHeading>
                Role
              </TableHeading>
              <TableHeading>
                Status
              </TableHeading>
              <TableHeading>
                Reservations
              </TableHeading>
              <TableHeading>
                Sessions
              </TableHeading>
              <TableHeading>
                Created
              </TableHeading>
              <TableHeading align="right">
                Action
              </TableHeading>
            </tr>
          </thead>

          <tbody>
            {customers.map((customer) => (
              <tr
                key={customer.id}
                onClick={() =>
                  onOpen(customer.id)
                }
                className="cursor-pointer border-b border-white/[0.055] transition last:border-0 hover:bg-white/[0.035]"
              >
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <Avatar
                      name={customer.name}
                      size="medium"
                    />

                    <div className="min-w-0">
                      <p className="truncate font-black">
                        {customer.name}
                      </p>

                      <p className="mt-1 truncate text-sm text-zinc-600">
                        {customer.email}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-5">
                  <RoleBadge
                    role={customer.role}
                  />
                </td>

                <td className="px-6 py-5">
                  <CustomerStatusBadge
                    customer={customer}
                  />
                </td>

                <td className="px-6 py-5 text-sm font-bold text-zinc-400">
                  {customer._count
                    ?.reservations ?? 0}
                </td>

                <td className="px-6 py-5 text-sm font-bold text-zinc-400">
                  {customer._count
                    ?.sessions ?? 0}
                </td>

                <td className="px-6 py-5 text-sm text-zinc-500">
                  {formatShortDate(
                    customer.createdAt,
                  )}
                </td>

                <td className="px-6 py-5 text-right">
                  <button
                    type="button"
                    className="rounded-xl border border-white/10 px-4 py-2 text-xs font-black transition hover:border-amber-300/30 hover:text-amber-300"
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-4 md:hidden">
        {customers.map((customer) => (
          <button
            key={customer.id}
            type="button"
            onClick={() =>
              onOpen(customer.id)
            }
            className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-4 text-left transition hover:border-amber-300/20"
          >
            <div className="flex items-start gap-3">
              <Avatar
                name={customer.name}
                size="medium"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate font-black">
                  {customer.name}
                </p>

                <p className="mt-1 truncate text-sm text-zinc-600">
                  {customer.email}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <RoleBadge
                    role={customer.role}
                  />

                  <CustomerStatusBadge
                    customer={customer}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/[0.07] pt-4">
              <MiniStatistic
                label="Reservations"
                value={
                  customer._count
                    ?.reservations ?? 0
                }
              />

              <MiniStatistic
                label="Sessions"
                value={
                  customer._count
                    ?.sessions ?? 0
                }
              />
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

function CustomerDrawer({
  currentCustomer,
  customer,
  loading,
  activeTab,
  onTabChange,
  onClose,
  error,
  success,
  onRefresh,
  onUpdateProfile,
  onResetPassword,
  onBlock,
  onUnblock,
  onRevokeSessions,
  onRoleChange,
  onDelete,
  onRestore,
}: {
  currentCustomer: Customer;
  customer: CustomerDetails | null;
  loading: boolean;
  activeTab: DrawerTab;
  onTabChange: (tab: DrawerTab) => void;
  onClose: () => void;
  error: string;
  success: string;
  onRefresh: () => void;
  onUpdateProfile: (profile: {
    name: string;
    email: string;
    phone: string | null;
  }) => Promise<void>;
  onResetPassword: (password: string) => Promise<void>;
  onBlock: (reason: string) => Promise<void>;
  onUnblock: () => Promise<void>;
  onRevokeSessions: () => Promise<void>;
  onRoleChange: (
    role: 'CUSTOMER' | 'ADMIN',
  ) => Promise<void>;
  onDelete: () => Promise<void>;
  onRestore: () => Promise<void>;
}) {
  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      'hidden';

    function handleEscape(
      event: KeyboardEvent,
    ) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener(
      'keydown',
      handleEscape,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        'keydown',
        handleEscape,
      );
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Close customer details"
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />

      <aside className="absolute inset-y-0 right-0 w-full max-w-[620px] overflow-y-auto border-l border-white/10 bg-[#0b0908] shadow-[-30px_0_100px_rgba(0,0,0,0.55)]">
        {loading || !customer ? (
          <div className="flex min-h-full items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div>
            <div className="sticky top-0 z-10 border-b border-white/[0.08] bg-[#0b0908]/95 p-5 backdrop-blur-xl sm:p-7">
              <div className="flex items-start justify-between gap-5">
                <div className="flex min-w-0 items-center gap-4">
                  <Avatar
                    name={customer.name}
                    size="large"
                  />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-2xl font-black">
                        {customer.name}
                      </h2>

                      <RoleBadge
                        role={customer.role}
                      />
                    </div>

                    <p className="mt-1 truncate text-sm text-zinc-500">
                      {customer.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 text-2xl text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="mt-6 flex gap-2 overflow-x-auto">
                {(
                  [
                    'overview',
                    'profile',
                    'reservations',
                    'sessions',
                    'support',
                  ] as DrawerTab[]
                ).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() =>
                      onTabChange(tab)
                    }
                    className={[
                      'min-h-10 whitespace-nowrap rounded-full px-4 text-xs font-black uppercase tracking-[0.12em] transition',
                      activeTab === tab
                        ? 'bg-white text-black'
                        : 'border border-white/10 text-zinc-500 hover:text-white',
                    ].join(' ')}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 sm:p-7">
              {error && (
                <Notice
                  type="error"
                  message={error}
                />
              )}

              {success && (
                <Notice
                  type="success"
                  message={success}
                />
              )}

              {activeTab === 'overview' && (
                <CustomerOverview
                  customer={customer}
                />
              )}

              {activeTab === 'profile' && (
                <CustomerProfileEditor
                  currentCustomer={currentCustomer}
                  customer={customer}
                  onUpdateProfile={onUpdateProfile}
                  onResetPassword={onResetPassword}
                />
              )}

              {activeTab ===
                'reservations' && (
                <CustomerReservations
                  reservations={
                    customer.reservations
                  }
                />
              )}

              {activeTab === 'sessions' && (
                <CustomerSessions
                  sessions={customer.sessions}
                  onRevoke={
                    onRevokeSessions
                  }
                />
              )}

              {activeTab === 'support' && (
                <CustomerSupportActions
                  currentCustomer={
                    currentCustomer
                  }
                  customer={customer}
                  onBlock={onBlock}
                  onUnblock={onUnblock}
                  onRevokeSessions={
                    onRevokeSessions
                  }
                  onRoleChange={
                    onRoleChange
                  }
                  onDelete={onDelete}
                  onRestore={onRestore}
                />
              )}

              <button
                type="button"
                onClick={onRefresh}
                className="mt-7 w-full rounded-2xl border border-white/10 py-3 text-sm font-black transition hover:bg-white/[0.05]"
              >
                Refresh Customer
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function CustomerOverview({
  customer,
}: {
  customer: CustomerDetails;
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-5">
        <h3 className="font-black">
          Account Status
        </h3>

        <div className="mt-4 flex flex-wrap gap-2">
          <CustomerStatusBadge
            customer={customer}
          />

          {customer.mustChangePassword && (
            <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-orange-300">
              Password Change Required
            </span>
          )}
        </div>

        {customer.blockedReason && (
          <div className="mt-4 rounded-2xl border border-red-500/15 bg-red-500/[0.07] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-red-300">
              Block reason
            </p>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {customer.blockedReason}
            </p>
          </div>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <DetailCard
          label="Full name"
          value={customer.name}
        />

        <DetailCard
          label="Email"
          value={customer.email}
        />

        <DetailCard
          label="Phone"
          value={
            customer.phone ||
            'Not provided'
          }
        />

        <DetailCard
          label="Created"
          value={formatDateTime(
            customer.createdAt,
          )}
        />

        <DetailCard
          label="Reservations"
          value={String(
            customer._count.reservations,
          )}
        />

        <DetailCard
          label="Active sessions"
          value={String(
            customer._count.sessions,
          )}
        />
      </div>
    </div>
  );
}

function CustomerReservations({
  reservations,
}: {
  reservations: CustomerReservationLink[];
}) {
  if (reservations.length === 0) {
    return (
      <EmptyDrawerState
        title="No reservations"
        description="This customer has no linked reservations."
      />
    );
  }

  return (
    <div className="space-y-3">
      {reservations.map((link) => {
        const reservation =
          link.reservation;

        const table =
          reservation.table?.label ||
          reservation.table?.number;

        return (
          <article
            key={link.id}
            className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-black capitalize">
                  {new Date(
                    reservation.startTime,
                  ).toLocaleDateString(
                    'nl-NL',
                    {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    },
                  )}
                </p>

                <p className="mt-2 text-sm text-zinc-500">
                  {new Date(
                    reservation.startTime,
                  ).toLocaleTimeString(
                    'nl-NL',
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                    },
                  )}
                  {' · '}
                  {reservation.guests}{' '}
                  guests
                </p>
              </div>

              <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">
                {reservation.status}
              </span>
            </div>

            <p className="mt-4 text-sm font-bold text-zinc-400">
              {table
                ? `Table ${table}`
                : 'Table not assigned'}
            </p>
          </article>
        );
      })}
    </div>
  );
}

function CustomerSessions({
  sessions,
  onRevoke,
}: {
  sessions: CustomerSession[];
  onRevoke: () => Promise<void>;
}) {
  if (sessions.length === 0) {
    return (
      <EmptyDrawerState
        title="No active sessions"
        description="This customer is not currently signed in."
      />
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {sessions.map((session) => (
          <article
            key={session.id}
            className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-5"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="font-black">
                Active device
              </p>

              <span className="h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_18px_rgba(74,222,128,0.65)]" />
            </div>

            <p className="mt-3 break-words text-sm leading-6 text-zinc-500">
              {session.userAgent ||
                'Unknown browser'}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <DetailCard
                label="IP address"
                value={
                  session.ip || 'Unknown'
                }
              />

              <DetailCard
                label="Last active"
                value={formatDateTime(
                  session.lastSeenAt,
                )}
              />
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={() => void onRevoke()}
        className="mt-5 w-full rounded-2xl border border-orange-500/20 bg-orange-500/[0.08] py-4 text-sm font-black text-orange-300 transition hover:bg-orange-500/[0.14]"
      >
        Revoke All Sessions
      </button>
    </div>
  );
}


function CustomerProfileEditor({
  currentCustomer,
  customer,
  onUpdateProfile,
  onResetPassword,
}: {
  currentCustomer: Customer;
  customer: CustomerDetails;
  onUpdateProfile: (profile: {
    name: string;
    email: string;
    phone: string | null;
  }) => Promise<void>;
  onResetPassword: (password: string) => Promise<void>;
}) {
  const [name, setName] = useState(customer.name);
  const [email, setEmail] = useState(customer.email);
  const [phone, setPhone] = useState(customer.phone || '');
  const [temporaryPassword, setTemporaryPassword] =
    useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');
  const [savingProfile, setSavingProfile] =
    useState(false);
  const [resettingPassword, setResettingPassword] =
    useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    setName(customer.name);
    setEmail(customer.email);
    setPhone(customer.phone || '');
    setTemporaryPassword('');
    setConfirmPassword('');
    setLocalError('');
  }, [customer]);

  const protectedAccount =
    currentCustomer.id === customer.id ||
    customer.role === 'OWNER';

  async function submitProfile(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (protectedAccount || savingProfile) {
      return;
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setLocalError('Name is required.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setLocalError('Enter a valid email address.');
      return;
    }

    setSavingProfile(true);
    setLocalError('');

    try {
      await onUpdateProfile({
        name: cleanName,
        email: cleanEmail,
        phone: phone.trim() || null,
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function submitPasswordReset(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (protectedAccount || resettingPassword) {
      return;
    }

    if (temporaryPassword.length < 8) {
      setLocalError(
        'Temporary password must contain at least 8 characters.',
      );
      return;
    }

    if (temporaryPassword !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    const confirmed = window.confirm(
      `Set a temporary password for ${customer.email} and sign the customer out from every device?`,
    );

    if (!confirmed) {
      return;
    }

    setResettingPassword(true);
    setLocalError('');

    try {
      await onResetPassword(temporaryPassword);
      setTemporaryPassword('');
      setConfirmPassword('');
    } finally {
      setResettingPassword(false);
    }
  }

  return (
    <div className="space-y-5">
      {localError && (
        <Notice
          type="error"
          message={localError}
        />
      )}

      <form
        onSubmit={submitProfile}
        className="rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-black">
              Customer profile
            </h3>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Update the customer name, email address and phone number.
              Every change is recorded in the audit log.
            </p>
          </div>

          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-blue-300">
            Support
          </span>
        </div>

        <div className="mt-5 space-y-4">
          <AdminField
            label="Full name"
            value={name}
            onChange={setName}
            placeholder="Customer name"
            autoComplete="name"
            disabled={protectedAccount || savingProfile}
          />

          <AdminField
            label="Email address"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="customer@example.com"
            autoComplete="email"
            disabled={protectedAccount || savingProfile}
          />

          <AdminField
            label="Phone number"
            type="tel"
            value={phone}
            onChange={setPhone}
            placeholder="+31..."
            autoComplete="tel"
            required={false}
            disabled={protectedAccount || savingProfile}
          />
        </div>

        <button
          type="submit"
          disabled={protectedAccount || savingProfile}
          className="mt-5 flex min-h-12 w-full items-center justify-center rounded-2xl bg-white px-5 text-sm font-black text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {savingProfile
            ? 'Saving profile...'
            : 'Save profile changes'}
        </button>
      </form>

      <form
        onSubmit={submitPasswordReset}
        className="rounded-[24px] border border-orange-500/15 bg-orange-500/[0.045] p-5"
      >
        <h3 className="font-black text-orange-200">
          Temporary password
        </h3>

        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Set a temporary password for account recovery. This immediately
          revokes every active session and requires the customer to change
          the password after the next login.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <AdminField
            label="Temporary password"
            type="password"
            value={temporaryPassword}
            onChange={setTemporaryPassword}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            disabled={protectedAccount || resettingPassword}
          />

          <AdminField
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Repeat password"
            autoComplete="new-password"
            disabled={protectedAccount || resettingPassword}
          />
        </div>

        <button
          type="submit"
          disabled={
            protectedAccount ||
            resettingPassword ||
            !temporaryPassword ||
            !confirmPassword
          }
          className="mt-5 flex min-h-12 w-full items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-400/10 px-5 text-sm font-black text-orange-200 transition hover:bg-orange-400/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {resettingPassword
            ? 'Resetting password...'
            : 'Set temporary password'}
        </button>
      </form>

      {protectedAccount && (
        <p className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] p-4 text-sm leading-6 text-amber-100/70">
          The OWNER account and your currently signed-in account are
          protected from support profile and password changes.
        </p>
      )}
    </div>
  );
}

function AdminField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete,
  required = true,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
        {label}
      </span>

      <input
        required={required}
        disabled={disabled}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
      />
    </label>
  );
}

function CustomerSupportActions({
  currentCustomer,
  customer,
  onBlock,
  onUnblock,
  onRevokeSessions,
  onRoleChange,
  onDelete,
  onRestore,
}: {
  currentCustomer: Customer;
  customer: CustomerDetails;
  onBlock: (reason: string) => Promise<void>;
  onUnblock: () => Promise<void>;
  onRevokeSessions: () => Promise<void>;
  onRoleChange: (
    role: 'CUSTOMER' | 'ADMIN',
  ) => Promise<void>;
  onDelete: () => Promise<void>;
  onRestore: () => Promise<void>;
}) {
  const [blockReason, setBlockReason] =
    useState('');

  const owner =
    currentCustomer.role === 'OWNER';

  const self =
    currentCustomer.id === customer.id;

  const protectedAccount =
    customer.role === 'OWNER' || self;

  return (
    <div className="space-y-5">
      <SupportSection
        title="Account access"
        description="Manage sessions and account restrictions."
      >
        <button
          type="button"
          disabled={protectedAccount}
          onClick={() =>
            void onRevokeSessions()
          }
          className="w-full rounded-2xl border border-white/10 px-5 py-4 text-left font-black transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Revoke all sessions
        </button>

        {customer.isBlocked ? (
          <button
            type="button"
            disabled={protectedAccount}
            onClick={() =>
              void onUnblock()
            }
            className="w-full rounded-2xl border border-green-500/20 bg-green-500/[0.08] px-5 py-4 text-left font-black text-green-300 transition hover:bg-green-500/[0.14] disabled:opacity-40"
          >
            Unblock account
          </button>
        ) : (
          <>
            <textarea
              value={blockReason}
              onChange={(event) =>
                setBlockReason(
                  event.target.value,
                )
              }
              placeholder="Reason for blocking..."
              rows={3}
              disabled={protectedAccount}
              className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-red-400 disabled:opacity-40"
            />

            <button
              type="button"
              disabled={
                protectedAccount ||
                !blockReason.trim()
              }
              onClick={() =>
                void onBlock(
                  blockReason.trim(),
                )
              }
              className="w-full rounded-2xl border border-red-500/20 bg-red-500/[0.08] px-5 py-4 text-left font-black text-red-300 transition hover:bg-red-500/[0.14] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Block account
            </button>
          </>
        )}
      </SupportSection>

      {owner && (
        <SupportSection
          title="Administrator access"
          description="Only the OWNER can grant or remove administrator access."
        >
          {customer.role === 'ADMIN' ? (
            <button
              type="button"
              disabled={protectedAccount}
              onClick={() =>
                void onRoleChange(
                  'CUSTOMER',
                )
              }
              className="w-full rounded-2xl border border-orange-500/20 bg-orange-500/[0.08] px-5 py-4 text-left font-black text-orange-300 transition hover:bg-orange-500/[0.14] disabled:opacity-40"
            >
              Remove administrator role
            </button>
          ) : customer.role ===
            'CUSTOMER' ? (
            <button
              type="button"
              disabled={protectedAccount}
              onClick={() =>
                void onRoleChange('ADMIN')
              }
              className="w-full rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] px-5 py-4 text-left font-black text-amber-200 transition hover:bg-amber-300/[0.14] disabled:opacity-40"
            >
              Promote to administrator
            </button>
          ) : null}
        </SupportSection>
      )}

      <SupportSection
        title="Account lifecycle"
        description="Deactivate or restore this customer account."
      >
        {customer.deletedAt ? (
          <button
            type="button"
            disabled={protectedAccount}
            onClick={() =>
              void onRestore()
            }
            className="w-full rounded-2xl border border-green-500/20 bg-green-500/[0.08] px-5 py-4 text-left font-black text-green-300 transition hover:bg-green-500/[0.14] disabled:opacity-40"
          >
            Restore account
          </button>
        ) : (
          <button
            type="button"
            disabled={protectedAccount}
            onClick={() => {
              const confirmed =
                window.confirm(
                  `Deactivate ${customer.email}?`,
                );

              if (confirmed) {
                void onDelete();
              }
            }}
            className="w-full rounded-2xl border border-red-500/20 bg-red-500/[0.08] px-5 py-4 text-left font-black text-red-300 transition hover:bg-red-500/[0.14] disabled:opacity-40"
          >
            Deactivate account
          </button>
        )}
      </SupportSection>

      {protectedAccount && (
        <p className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] p-4 text-sm leading-6 text-amber-100/70">
          This account is protected and
          cannot be modified through
          support actions.
        </p>
      )}
    </div>
  );
}

function SupportSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-5">
      <h3 className="font-black">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-zinc-600">
        {description}
      </p>

      <div className="mt-5 space-y-3">
        {children}
      </div>
    </section>
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
          onClick={() =>
            onChange(page - 1)
          }
          className="h-10 rounded-xl border border-white/10 px-4 text-sm font-black transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-30"
        >
          Previous
        </button>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() =>
            onChange(page + 1)
          }
          className="h-10 rounded-xl border border-white/10 px-4 text-sm font-black transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function RoleBadge({
  role,
}: {
  role: CustomerRole;
}) {
  const styles: Record<
    CustomerRole,
    string
  > = {
    CUSTOMER:
      'border-white/10 bg-white/[0.04] text-zinc-400',
    ADMIN:
      'border-blue-500/20 bg-blue-500/10 text-blue-300',
    OWNER:
      'border-amber-300/25 bg-amber-300/10 text-amber-200',
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${styles[role]}`}
    >
      {role}
    </span>
  );
}

function CustomerStatusBadge({
  customer,
}: {
  customer: AdminCustomer;
}) {
  if (customer.deletedAt) {
    return (
      <StatusPill
        label="Deleted"
        className="border-zinc-500/20 bg-zinc-500/10 text-zinc-400"
      />
    );
  }

  if (customer.isBlocked) {
    return (
      <StatusPill
        label="Blocked"
        className="border-red-500/20 bg-red-500/10 text-red-300"
      />
    );
  }

  return (
    <StatusPill
      label="Active"
      className="border-green-500/20 bg-green-500/10 text-green-300"
    />
  );
}

function StatusPill({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${className}`}
    >
      {label}
    </span>
  );
}

function Avatar({
  name,
  size,
}: {
  name: string;
  size:
    | 'small'
    | 'medium'
    | 'large';
}) {
  const initial =
    name.trim().charAt(0).toUpperCase() ||
    '?';

  const sizeClass = {
    small:
      'h-10 w-10 text-sm',
    medium:
      'h-12 w-12 text-base',
    large:
      'h-16 w-16 text-xl',
  }[size];

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-amber-300 font-black text-black ${sizeClass}`}
    >
      {initial}
    </div>
  );
}

function TableHeading({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      className={[
        'px-6 py-4 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700',
        align === 'right'
          ? 'text-right'
          : 'text-left',
      ].join(' ')}
    >
      {children}
    </th>
  );
}

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/[0.07] bg-black/25 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-700">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-bold text-zinc-300">
        {value}
      </p>
    </div>
  );
}

function MiniStatistic({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-700">
        {label}
      </p>

      <p className="mt-1 font-black">
        {value}
      </p>
    </div>
  );
}

function EmptyDrawerState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-12 text-center">
      <h3 className="font-black">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-zinc-600">
        {description}
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
        'mb-5 rounded-2xl border p-4 text-sm',
        type === 'error'
          ? 'border-red-500/20 bg-red-500/[0.08] text-red-200'
          : 'border-green-500/20 bg-green-500/[0.08] text-green-200',
      ].join(' ')}
    >
      {message}
    </div>
  );
}

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mt-7 flex flex-col justify-between gap-4 rounded-[24px] border border-red-500/20 bg-red-500/[0.08] p-5 sm:flex-row sm:items-center">
      <div>
        <p className="font-black text-red-200">
          Administration error
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
          Admin access required
        </h1>

        <p className="mt-4 leading-7 text-zinc-400">
          This area is only available to
          authorised DaWu administrators.
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

function AdminLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070504] text-white">
      <div className="text-center">
        <Spinner />

        <p className="mt-5 text-sm font-bold text-zinc-600">
          Loading DaWu Control Center...
        </p>
      </div>
    </main>
  );
}

function Spinner() {
  return (
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-300/20 border-t-amber-300" />
  );
}

async function readResponse(
  response: Response,
) {
  return response
    .json()
    .catch(() => null);
}

function getErrorMessage(
  data: any,
  fallback: string,
) {
  if (
    typeof data?.message === 'string'
  ) {
    return data.message;
  }

  if (Array.isArray(data?.message)) {
    return data.message.join(', ');
  }

  return fallback;
}

function formatShortDate(
  value: string,
) {
  return new Date(value).toLocaleDateString(
    'nl-NL',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  );
}

function formatDateTime(
  value: string,
) {
  return new Date(value).toLocaleString(
    'nl-NL',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  );
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
    >
      <circle
        cx="11"
        cy="11"
        r="7"
      />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M20 11a8 8 0 1 0-2.34 5.66" />
      <path d="M20 4v7h-7" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle
        cx="9"
        cy="7"
        r="4"
      />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  );
}

function BlockedIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function SessionIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="14"
        rx="2"
      />
      <path d="M8 22h8M12 18v4" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-5 w-5"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-5 w-5"
    >
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}