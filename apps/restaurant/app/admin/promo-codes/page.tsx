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
} from '../../../components/account/AccountProvider';

type CustomerRole = 'CUSTOMER' | 'ADMIN' | 'OWNER';

type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

type AppliesTo =
  | 'ALL'
  | 'RESERVATION'
  | 'DINE_IN'
  | 'TAKEAWAY'
  | 'DELIVERY';

type StatusFilter =
  | 'all'
  | 'active'
  | 'inactive'
  | 'expired';

type PromoCode = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  maximumDiscount: number | null;
  minimumOrderAmount: number | null;
  appliesTo: AppliesTo;
  startsAt: string | null;
  expiresAt: string | null;
  usageLimit: number | null;
  usageLimitPerCustomer: number;
  usageCount: number;
  firstOrderOnly: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role: CustomerRole;
  } | null;
  _count?: {
    usages: number;
  };
};

type PromoUsage = {
  id: string;
  usedAt: string;
  orderAmount: number;
  discountAmount: number;
  email: string | null;
  phone: string | null;
  customer?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

type PromoDetails = PromoCode & {
  usages: PromoUsage[];
  statistics: {
    totalUses: number;
    totalDiscount: number;
    generatedRevenue: number;
    averageOrder: number;
  };
};

type PromoListResponse = {
  promoCodes: PromoCode[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type PromoForm = {
  code: string;
  name: string;
  description: string;
  discountType: DiscountType;
  discountValue: string;
  maximumDiscount: string;
  minimumOrderAmount: string;
  appliesTo: AppliesTo;
  startsAt: string;
  expiresAt: string;
  usageLimit: string;
  usageLimitPerCustomer: string;
  firstOrderOnly: boolean;
  isActive: boolean;
};

const API_URL = '/api/promo-codes/admin';

const EMPTY_FORM: PromoForm = {
  code: '',
  name: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  maximumDiscount: '',
  minimumOrderAmount: '',
  appliesTo: 'ALL',
  startsAt: '',
  expiresAt: '',
  usageLimit: '',
  usageLimitPerCustomer: '1',
  firstOrderOnly: false,
  isActive: true,
};

export default function PromoCodesPage() {
  const {
    customer,
    loading: accountLoading,
  } = useAccount();

  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [form, setForm] = useState<PromoForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editorError, setEditorError] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState<PromoDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const hasAdminAccess =
    customer?.role === 'ADMIN' ||
    customer?.role === 'OWNER';

  const loadPromoCodes = useCallback(async () => {
    setListLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      });

      if (search) {
        params.set('search', search);
      }

      if (status !== 'all') {
        params.set('status', status);
      }

      const response = await fetch(
        `${API_URL}?${params.toString()}`,
        {
          credentials: 'include',
          cache: 'no-store',
        },
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, 'Could not load promo codes'),
        );
      }

      const result = data as PromoListResponse;

      setPromoCodes(
        Array.isArray(result.promoCodes)
          ? result.promoCodes
          : [],
      );

      setTotal(result.pagination?.total || 0);
      setTotalPages(result.pagination?.totalPages || 1);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Could not load promo codes',
      );
    } finally {
      setListLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    if (accountLoading) {
      return;
    }

    if (!hasAdminAccess) {
      setLoading(false);
      return;
    }

    void loadPromoCodes().finally(() => {
      setLoading(false);
    });
  }, [
    accountLoading,
    hasAdminAccess,
    loadPromoCodes,
  ]);

  const loadDetails = useCallback(async (id: string) => {
    setDetailsLoading(true);
    setDetailsError('');
    setDetails(null);

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            'Could not load promo code details',
          ),
        );
      }

      setDetails(data as PromoDetails);
    } catch (loadError) {
      setDetailsError(
        loadError instanceof Error
          ? loadError.message
          : 'Could not load promo code details',
      );
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  async function openDetails(id: string) {
    setSelectedId(id);
    await loadDetails(id);
  }

  function closeDetails() {
    setSelectedId(null);
    setDetails(null);
    setDetailsError('');
  }

  function openCreate() {
    setEditingPromo(null);
    setForm(EMPTY_FORM);
    setEditorError('');
    setEditorOpen(true);
  }

  function openEdit(promoCode: PromoCode) {
    setEditingPromo(promoCode);
    setForm({
      code: promoCode.code,
      name: promoCode.name,
      description: promoCode.description || '',
      discountType: promoCode.discountType,
      discountValue: String(promoCode.discountValue),
      maximumDiscount:
        promoCode.maximumDiscount === null
          ? ''
          : String(promoCode.maximumDiscount),
      minimumOrderAmount:
        promoCode.minimumOrderAmount === null
          ? ''
          : String(promoCode.minimumOrderAmount),
      appliesTo: promoCode.appliesTo,
      startsAt: toDateTimeLocal(promoCode.startsAt),
      expiresAt: toDateTimeLocal(promoCode.expiresAt),
      usageLimit:
        promoCode.usageLimit === null
          ? ''
          : String(promoCode.usageLimit),
      usageLimitPerCustomer: String(
        promoCode.usageLimitPerCustomer,
      ),
      firstOrderOnly: promoCode.firstOrderOnly,
      isActive: promoCode.isActive,
    });
    setEditorError('');
    setEditorOpen(true);
  }

  function closeEditor() {
    if (saving) {
      return;
    }

    setEditorOpen(false);
    setEditingPromo(null);
    setEditorError('');
  }

  async function submitPromo(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    setEditorError('');
    setSuccess('');

    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maximumDiscount:
          form.maximumDiscount === ''
            ? null
            : Number(form.maximumDiscount),
        minimumOrderAmount:
          form.minimumOrderAmount === ''
            ? null
            : Number(form.minimumOrderAmount),
        appliesTo: form.appliesTo,
        startsAt:
          form.startsAt === ''
            ? null
            : new Date(form.startsAt).toISOString(),
        expiresAt:
          form.expiresAt === ''
            ? null
            : new Date(form.expiresAt).toISOString(),
        usageLimit:
          form.usageLimit === ''
            ? null
            : Number(form.usageLimit),
        usageLimitPerCustomer: Number(
          form.usageLimitPerCustomer,
        ),
        firstOrderOnly: form.firstOrderOnly,
        isActive: form.isActive,
      };

      const response = await fetch(
        editingPromo
          ? `${API_URL}/${editingPromo.id}`
          : API_URL,
        {
          method: editingPromo ? 'PATCH' : 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            editingPromo
              ? 'Could not update promo code'
              : 'Could not create promo code',
          ),
        );
      }

      setEditorOpen(false);
      setEditingPromo(null);
      setSuccess(
        editingPromo
          ? 'Promo code updated successfully.'
          : 'Promo code created successfully.',
      );

      await loadPromoCodes();

      if (selectedId) {
        await loadDetails(selectedId);
      }
    } catch (saveError) {
      setEditorError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not save promo code',
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePromo(
    promoCode: PromoCode,
  ) {
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${API_URL}/${promoCode.id}/toggle`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isActive: !promoCode.isActive,
          }),
        },
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            'Could not change promo code status',
          ),
        );
      }

      setSuccess(
        promoCode.isActive
          ? 'Promo code disabled.'
          : 'Promo code enabled.',
      );

      await loadPromoCodes();

      if (selectedId === promoCode.id) {
        await loadDetails(promoCode.id);
      }
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : 'Could not change promo code status',
      );
    }
  }

  async function deletePromo(
    promoCode: PromoCode,
  ) {
    const confirmed = window.confirm(
      `Delete promo code ${promoCode.code}? Usage history will remain stored.`,
    );

    if (!confirmed) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${API_URL}/${promoCode.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            'Could not delete promo code',
          ),
        );
      }

      setSuccess('Promo code deleted.');
      closeDetails();
      await loadPromoCodes();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Could not delete promo code',
      );
    }
  }

  function submitSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  const statistics = useMemo(() => {
    const active = promoCodes.filter(
      (promoCode) =>
        promoCode.isActive &&
        !isExpired(promoCode.expiresAt),
    ).length;

    const inactive = promoCodes.filter(
      (promoCode) => !promoCode.isActive,
    ).length;

    const uses = promoCodes.reduce(
      (sum, promoCode) =>
        sum +
        (promoCode._count?.usages ??
          promoCode.usageCount ??
          0),
      0,
    );

    return [
      {
        label: 'Total Codes',
        value: total,
        description: 'Available in Promo Center',
      },
      {
        label: 'Active',
        value: active,
        description: 'Active on this page',
      },
      {
        label: 'Inactive',
        value: inactive,
        description: 'Disabled on this page',
      },
      {
        label: 'Uses',
        value: uses,
        description: 'Uses on this page',
      },
    ];
  }, [promoCodes, total]);

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
        <AdminSidebar customer={customer} />

        <div className="min-w-0 flex-1 lg:pl-[280px]">
          <AdminMobileHeader
            customer={customer}
            onMenuOpen={() => setMobileMenuOpen(true)}
          />

          <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-10">
            <header className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.32em] text-amber-300">
                  DaWu Control Center
                </p>

                <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                  Promo Center
                </h1>

                <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
                  Create and manage discount codes, usage
                  limits, validity periods and campaign
                  performance.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void loadPromoCodes()}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] px-6 text-sm font-black uppercase tracking-[0.14em] transition hover:bg-white/[0.07]"
                >
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-amber-300 px-6 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:bg-amber-200"
                >
                  + New Promo Code
                </button>
              </div>
            </header>

            {error && (
              <Notice type="error" message={error} />
            )}

            {success && (
              <Notice type="success" message={success} />
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
                      Promo Codes
                    </h2>

                    <p className="mt-2 text-sm text-zinc-500">
                      {total} {total === 1 ? 'code' : 'codes'} match
                      the current filters.
                    </p>
                  </div>

                  <form
                    onSubmit={submitSearch}
                    className="flex w-full max-w-xl gap-2"
                  >
                    <input
                      value={searchInput}
                      onChange={(event) =>
                        setSearchInput(event.target.value)
                      }
                      placeholder="Search code or campaign name..."
                      className="h-12 min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/50 px-4 text-sm outline-none transition placeholder:text-zinc-700 focus:border-amber-300"
                    />

                    <button
                      type="submit"
                      className="h-12 rounded-2xl bg-white px-5 text-sm font-black text-black transition hover:bg-zinc-200"
                    >
                      Search
                    </button>
                  </form>
                </div>

                <div className="mt-5 flex gap-2 overflow-x-auto">
                  {(
                    [
                      ['all', 'All'],
                      ['active', 'Active'],
                      ['inactive', 'Inactive'],
                      ['expired', 'Expired'],
                    ] as Array<[StatusFilter, string]>
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setPage(1);
                        setStatus(value);
                      }}
                      className={[
                        'min-h-10 whitespace-nowrap rounded-full px-4 text-xs font-black uppercase tracking-[0.12em] transition',
                        status === value
                          ? 'bg-amber-300 text-black'
                          : 'border border-white/10 bg-white/[0.025] text-zinc-500 hover:text-white',
                      ].join(' ')}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <PromoTable
                promoCodes={promoCodes}
                loading={listLoading}
                onOpen={openDetails}
                onEdit={openEdit}
                onToggle={togglePromo}
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
        onClose={() => setMobileMenuOpen(false)}
      />

      {editorOpen && (
        <PromoEditor
          form={form}
          setForm={setForm}
          editing={Boolean(editingPromo)}
          saving={saving}
          error={editorError}
          onClose={closeEditor}
          onSubmit={submitPromo}
        />
      )}

      {selectedId && (
        <PromoDetailsDrawer
          details={details}
          loading={detailsLoading}
          error={detailsError}
          onClose={closeDetails}
          onRefresh={() => void loadDetails(selectedId)}
          onEdit={() => {
            if (details) {
              closeDetails();
              openEdit(details);
            }
          }}
          onToggle={() => {
            if (details) {
              void togglePromo(details);
            }
          }}
          onDelete={() => {
            if (details) {
              void deletePromo(details);
            }
          }}
        />
      )}
    </main>
  );
}

function PromoTable({
  promoCodes,
  loading,
  onOpen,
  onEdit,
  onToggle,
}: {
  promoCodes: PromoCode[];
  loading: boolean;
  onOpen: (id: string) => void;
  onEdit: (promoCode: PromoCode) => void;
  onToggle: (promoCode: PromoCode) => void;
}) {
  if (loading) {
    return (
      <div className="flex min-h-[340px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (promoCodes.length === 0) {
    return (
      <div className="flex min-h-[340px] flex-col items-center justify-center px-6 text-center">
        <h3 className="text-xl font-black">
          No promo codes found
        </h3>

        <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">
          Create a new promo code or change the current
          search and filters.
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
              <TableHeading>Promo</TableHeading>
              <TableHeading>Discount</TableHeading>
              <TableHeading>Applies To</TableHeading>
              <TableHeading>Status</TableHeading>
              <TableHeading>Uses</TableHeading>
              <TableHeading>Validity</TableHeading>
              <TableHeading align="right">Actions</TableHeading>
            </tr>
          </thead>

          <tbody>
            {promoCodes.map((promoCode) => (
              <tr
                key={promoCode.id}
                onClick={() => onOpen(promoCode.id)}
                className="cursor-pointer border-b border-white/[0.055] transition last:border-0 hover:bg-white/[0.035]"
              >
                <td className="px-6 py-5">
                  <p className="font-black text-amber-200">
                    {promoCode.code}
                  </p>
                  <p className="mt-1 text-sm font-bold text-zinc-300">
                    {promoCode.name}
                  </p>
                </td>

                <td className="px-6 py-5">
                  <p className="font-black">
                    {formatDiscount(promoCode)}
                  </p>
                  {promoCode.minimumOrderAmount !== null && (
                    <p className="mt-1 text-xs text-zinc-600">
                      Min. {formatMoney(promoCode.minimumOrderAmount)}
                    </p>
                  )}
                </td>

                <td className="px-6 py-5 text-sm font-bold text-zinc-400">
                  {formatAppliesTo(promoCode.appliesTo)}
                </td>

                <td className="px-6 py-5">
                  <PromoStatus promoCode={promoCode} />
                </td>

                <td className="px-6 py-5 text-sm font-bold text-zinc-400">
                  {promoCode._count?.usages ??
                    promoCode.usageCount ??
                    0}
                  {promoCode.usageLimit !== null
                    ? ` / ${promoCode.usageLimit}`
                    : ''}
                </td>

                <td className="px-6 py-5 text-sm text-zinc-500">
                  {formatValidity(promoCode)}
                </td>

                <td
                  className="px-6 py-5"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(promoCode)}
                      className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black transition hover:text-amber-300"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => void onToggle(promoCode)}
                      className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black transition hover:text-white"
                    >
                      {promoCode.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-4 md:hidden">
        {promoCodes.map((promoCode) => (
          <article
            key={promoCode.id}
            className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-4"
          >
            <button
              type="button"
              onClick={() => onOpen(promoCode.id)}
              className="w-full text-left"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-black text-amber-200">
                    {promoCode.code}
                  </p>
                  <p className="mt-1 font-bold text-zinc-300">
                    {promoCode.name}
                  </p>
                </div>

                <PromoStatus promoCode={promoCode} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-4">
                <DetailCard
                  label="Discount"
                  value={formatDiscount(promoCode)}
                />
                <DetailCard
                  label="Uses"
                  value={String(
                    promoCode._count?.usages ??
                      promoCode.usageCount ??
                      0,
                  )}
                />
              </div>
            </button>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onEdit(promoCode)}
                className="rounded-2xl border border-white/10 py-3 text-sm font-black"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => void onToggle(promoCode)}
                className="rounded-2xl border border-white/10 py-3 text-sm font-black"
              >
                {promoCode.isActive ? 'Disable' : 'Enable'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function PromoEditor({
  form,
  setForm,
  editing,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  form: PromoForm;
  setForm: React.Dispatch<React.SetStateAction<PromoForm>>;
  editing: boolean;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  useLockBody(onClose);

  function update<K extends keyof PromoForm>(
    key: K,
    value: PromoForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <div className="fixed inset-0 z-[110]">
      <button
        type="button"
        aria-label="Close promo editor"
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />

      <aside className="absolute inset-y-0 right-0 w-full max-w-[720px] overflow-y-auto border-l border-white/10 bg-[#0b0908] shadow-[-30px_0_100px_rgba(0,0,0,0.55)]">
        <form onSubmit={onSubmit}>
          <div className="sticky top-0 z-10 border-b border-white/[0.08] bg-[#0b0908]/95 p-5 backdrop-blur-xl sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">
                  Promo Center
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  {editing
                    ? 'Edit Promo Code'
                    : 'Create Promo Code'}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-2xl text-zinc-500"
              >
                ×
              </button>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-7">
            {error && (
              <Notice type="error" message={error} />
            )}

            <FormSection
              title="Campaign"
              description="Code and customer-facing campaign details."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Promo code"
                  value={form.code}
                  onChange={(value) =>
                    update(
                      'code',
                      value
                        .toUpperCase()
                        .replace(/[^A-Z0-9_-]/g, ''),
                    )
                  }
                  placeholder="WELCOME10"
                  required
                />

                <FormField
                  label="Campaign name"
                  value={form.name}
                  onChange={(value) => update('name', value)}
                  placeholder="Welcome discount"
                  required
                />
              </div>

              <label className="block">
                <FieldLabel>Description</FieldLabel>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    update('description', event.target.value)
                  }
                  rows={4}
                  placeholder="Optional internal or customer-facing description..."
                  className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-700 focus:border-amber-300"
                />
              </label>
            </FormSection>

            <FormSection
              title="Discount"
              description="Configure the value and order threshold."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Discount type"
                  value={form.discountType}
                  onChange={(value) =>
                    update(
                      'discountType',
                      value as DiscountType,
                    )
                  }
                  options={[
                    {
                      value: 'PERCENTAGE',
                      label: 'Percentage',
                    },
                    {
                      value: 'FIXED_AMOUNT',
                      label: 'Fixed amount',
                    },
                  ]}
                />

                <FormField
                  label={
                    form.discountType === 'PERCENTAGE'
                      ? 'Discount percentage'
                      : 'Discount amount (€)'
                  }
                  type="number"
                  min="0.01"
                  max={
                    form.discountType === 'PERCENTAGE'
                      ? '100'
                      : undefined
                  }
                  step="0.01"
                  value={form.discountValue}
                  onChange={(value) =>
                    update('discountValue', value)
                  }
                  placeholder={
                    form.discountType === 'PERCENTAGE'
                      ? '10'
                      : '5.00'
                  }
                  required
                />

                <FormField
                  label="Maximum discount (€)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.maximumDiscount}
                  onChange={(value) =>
                    update('maximumDiscount', value)
                  }
                  placeholder="No maximum"
                />

                <FormField
                  label="Minimum order (€)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minimumOrderAmount}
                  onChange={(value) =>
                    update('minimumOrderAmount', value)
                  }
                  placeholder="No minimum"
                />
              </div>

              <SelectField
                label="Applies to"
                value={form.appliesTo}
                onChange={(value) =>
                  update('appliesTo', value as AppliesTo)
                }
                options={[
                  { value: 'ALL', label: 'Everything' },
                  {
                    value: 'RESERVATION',
                    label: 'Reservations',
                  },
                  {
                    value: 'DINE_IN',
                    label: 'Dine in',
                  },
                  {
                    value: 'TAKEAWAY',
                    label: 'Takeaway',
                  },
                  {
                    value: 'DELIVERY',
                    label: 'Delivery',
                  },
                ]}
              />
            </FormSection>

            <FormSection
              title="Validity and limits"
              description="Optional schedule and usage restrictions."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Starts at"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(value) =>
                    update('startsAt', value)
                  }
                  placeholder=""
                />

                <FormField
                  label="Expires at"
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(value) =>
                    update('expiresAt', value)
                  }
                  placeholder=""
                />

                <FormField
                  label="Total usage limit"
                  type="number"
                  min="1"
                  step="1"
                  value={form.usageLimit}
                  onChange={(value) =>
                    update('usageLimit', value)
                  }
                  placeholder="Unlimited"
                />

                <FormField
                  label="Limit per customer"
                  type="number"
                  min="1"
                  step="1"
                  value={form.usageLimitPerCustomer}
                  onChange={(value) =>
                    update('usageLimitPerCustomer', value)
                  }
                  placeholder="1"
                  required
                />
              </div>

              <ToggleField
                label="First order only"
                description="Only signed-in customers without an earlier linked reservation can use this code."
                checked={form.firstOrderOnly}
                onChange={(checked) =>
                  update('firstOrderOnly', checked)
                }
              />

              <ToggleField
                label="Active"
                description="The promo code can be validated and redeemed immediately."
                checked={form.isActive}
                onChange={(checked) =>
                  update('isActive', checked)
                }
              />
            </FormSection>

            <button
              type="submit"
              disabled={saving}
              className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-amber-300 px-6 text-sm font-black uppercase tracking-[0.12em] text-black transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? 'Saving...'
                : editing
                  ? 'Save Changes'
                  : 'Create Promo Code'}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

function PromoDetailsDrawer({
  details,
  loading,
  error,
  onClose,
  onRefresh,
  onEdit,
  onToggle,
  onDelete,
}: {
  details: PromoDetails | null;
  loading: boolean;
  error: string;
  onClose: () => void;
  onRefresh: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  useLockBody(onClose);

  return (
    <div className="fixed inset-0 z-[105]">
      <button
        type="button"
        aria-label="Close promo details"
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />

      <aside className="absolute inset-y-0 right-0 w-full max-w-[680px] overflow-y-auto border-l border-white/10 bg-[#0b0908] shadow-[-30px_0_100px_rgba(0,0,0,0.55)]">
        {loading ? (
          <div className="flex min-h-full items-center justify-center">
            <Spinner />
          </div>
        ) : error || !details ? (
          <div className="p-7">
            <Notice
              type="error"
              message={error || 'Promo code could not be loaded'}
            />
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl border border-white/10 py-3 font-black"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="sticky top-0 z-10 border-b border-white/[0.08] bg-[#0b0908]/95 p-5 backdrop-blur-xl sm:p-7">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl font-black text-amber-200">
                      {details.code}
                    </h2>
                    <PromoStatus promoCode={details} />
                  </div>
                  <p className="mt-2 font-bold text-zinc-300">
                    {details.name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-2xl text-zinc-500"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-6 p-5 sm:p-7">
              <section className="grid gap-3 sm:grid-cols-2">
                <StatisticCard
                  label="Total Uses"
                  value={details.statistics.totalUses}
                  description="Recorded redemptions"
                />
                <MoneyStatisticCard
                  label="Revenue"
                  value={details.statistics.generatedRevenue}
                  description="Order value before discount"
                />
                <MoneyStatisticCard
                  label="Discounts"
                  value={details.statistics.totalDiscount}
                  description="Total discount granted"
                />
                <MoneyStatisticCard
                  label="Average Order"
                  value={details.statistics.averageOrder}
                  description="Average redeemed order"
                />
              </section>

              <section className="rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-5">
                <h3 className="font-black">
                  Configuration
                </h3>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <DetailCard
                    label="Discount"
                    value={formatDiscount(details)}
                  />
                  <DetailCard
                    label="Applies to"
                    value={formatAppliesTo(details.appliesTo)}
                  />
                  <DetailCard
                    label="Minimum order"
                    value={
                      details.minimumOrderAmount === null
                        ? 'None'
                        : formatMoney(
                            details.minimumOrderAmount,
                          )
                    }
                  />
                  <DetailCard
                    label="Maximum discount"
                    value={
                      details.maximumDiscount === null
                        ? 'None'
                        : formatMoney(details.maximumDiscount)
                    }
                  />
                  <DetailCard
                    label="Usage limit"
                    value={
                      details.usageLimit === null
                        ? 'Unlimited'
                        : String(details.usageLimit)
                    }
                  />
                  <DetailCard
                    label="Per customer"
                    value={String(
                      details.usageLimitPerCustomer,
                    )}
                  />
                  <DetailCard
                    label="Starts"
                    value={
                      details.startsAt
                        ? formatDateTime(details.startsAt)
                        : 'Immediately'
                    }
                  />
                  <DetailCard
                    label="Expires"
                    value={
                      details.expiresAt
                        ? formatDateTime(details.expiresAt)
                        : 'Never'
                    }
                  />
                </div>

                {details.description && (
                  <p className="mt-5 rounded-2xl border border-white/[0.07] bg-black/30 p-4 text-sm leading-6 text-zinc-400">
                    {details.description}
                  </p>
                )}
              </section>

              <section className="rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-black">
                      Recent Uses
                    </h3>
                    <p className="mt-1 text-sm text-zinc-600">
                      The latest 100 redemptions.
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-black text-zinc-400">
                    {details.usages.length}
                  </span>
                </div>

                {details.usages.length === 0 ? (
                  <p className="mt-5 rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-zinc-600">
                    This promo code has not been used yet.
                  </p>
                ) : (
                  <div className="mt-5 space-y-3">
                    {details.usages.map((usage) => (
                      <article
                        key={usage.id}
                        className="rounded-2xl border border-white/[0.07] bg-black/25 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-black">
                              {usage.customer?.name ||
                                usage.email ||
                                'Guest customer'}
                            </p>
                            <p className="mt-1 text-xs text-zinc-600">
                              {formatDateTime(usage.usedAt)}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-black">
                              {formatMoney(usage.orderAmount)}
                            </p>
                            <p className="mt-1 text-xs font-bold text-amber-300">
                              -{formatMoney(
                                usage.discountAmount,
                              )}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={onEdit}
                  className="rounded-2xl bg-white py-4 font-black text-black"
                >
                  Edit Promo Code
                </button>

                <button
                  type="button"
                  onClick={onToggle}
                  className="rounded-2xl border border-white/10 py-4 font-black"
                >
                  {details.isActive ? 'Disable' : 'Enable'}
                </button>
              </div>

              <button
                type="button"
                onClick={onRefresh}
                className="w-full rounded-2xl border border-white/10 py-4 font-black"
              >
                Refresh Details
              </button>

              <button
                type="button"
                onClick={onDelete}
                className="w-full rounded-2xl border border-red-500/20 bg-red-500/[0.08] py-4 font-black text-red-300"
              >
                Delete Promo Code
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
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
        <SidebarLink href="/admin" title="Customers" />
        <SidebarLink
          href="/admin/promo-codes"
          title="Promo Center"
          active
          badge="Live"
        />
        <SidebarLink
          href="/admin/restaurant-settings"
          title="Restaurant Settings"
          badge="Live"
        />

        {customer.role === 'OWNER' && (
          <SidebarLink
            href="/admin/audit-log"
            title="Audit Log"
            badge="Owner"
          />
        )}
      </nav>

      <div className="mt-auto rounded-[24px] border border-white/10 bg-white/[0.025] p-4">
        <p className="truncate font-black">
          {customer.name}
        </p>
        <p className="mt-1 truncate text-xs text-zinc-600">
          {customer.email}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <RoleBadge role={customer.role as CustomerRole} />
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
      <button
        type="button"
        onClick={onMenuOpen}
        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035]"
      >
        ☰
      </button>

      <Link
        href="/admin"
        className="font-black tracking-[0.22em]"
      >
        DAWU
      </Link>

      <RoleBadge role={customer.role as CustomerRole} />
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

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  return (
    <div
      className={[
        'fixed inset-0 z-[120] lg:hidden',
        open
          ? 'pointer-events-auto'
          : 'pointer-events-none',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={onClose}
        className={[
          'absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity',
          open ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      />

      <aside
        className={[
          'absolute inset-y-0 left-0 flex w-[88%] max-w-[340px] flex-col border-r border-white/10 bg-[#090807] p-5 transition-transform',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between">
          <p className="text-2xl font-black tracking-[0.28em]">
            DAWU
          </p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-xl"
          >
            ×
          </button>
        </div>

        <nav className="mt-8 space-y-2">
          <MobileLink
            href="/admin"
            title="Customers"
            onClick={onClose}
          />
          <MobileLink
            href="/admin/promo-codes"
            title="Promo Center"
            badge="Live"
            active
            onClick={onClose}
          />
          <MobileLink
            href="/admin/restaurant-settings"
            title="Restaurant Settings"
            badge="Live"
            onClick={onClose}
          />

          {customer.role === 'OWNER' && (
            <MobileLink
              href="/admin/audit-log"
              title="Audit Log"
              badge="Owner"
              onClick={onClose}
            />
          )}
        </nav>

        <div className="mt-auto rounded-[24px] border border-white/10 bg-white/[0.025] p-4">
          <p className="truncate font-black">
            {customer.name}
          </p>
          <p className="mt-1 truncate text-xs text-zinc-600">
            {customer.email}
          </p>
        </div>
      </aside>
    </div>
  );
}

function SidebarLink({
  href,
  title,
  active = false,
  badge,
}: {
  href: string;
  title: string;
  active?: boolean;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className={[
        'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-black transition',
        active
          ? 'bg-white text-black'
          : 'text-zinc-500 hover:bg-white/[0.05] hover:text-white',
      ].join(' ')}
    >
      {title}
      {badge && (
        <span className="text-[9px] uppercase tracking-[0.14em] opacity-60">
          {badge}
        </span>
      )}
    </Link>
  );
}

function MobileLink({
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
        'flex min-h-[52px] items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-black',
        active
          ? 'bg-white text-black'
          : 'text-zinc-400',
      ].join(' ')}
    >
      {title}
      {badge && (
        <span className="text-[9px] uppercase tracking-[0.14em] opacity-60">
          {badge}
        </span>
      )}
    </Link>
  );
}

function FormSection({
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
      <h3 className="font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        {description}
      </p>
      <div className="mt-5 space-y-4">
        {children}
      </div>
    </section>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  min,
  max,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        required={required}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm outline-none transition placeholder:text-zinc-700 focus:border-amber-300"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
  }>;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm outline-none focus:border-amber-300"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-white/[0.08] bg-black/25 p-4">
      <div>
        <p className="font-black">{label}</p>
        <p className="mt-1 text-sm leading-6 text-zinc-600">
          {description}
        </p>
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="mt-1 h-5 w-5 accent-amber-300"
      />
    </label>
  );
}

function FieldLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
      {children}
    </span>
  );
}

function StatisticCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <article className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
      <p className="text-4xl font-black tracking-tight">
        {value}
      </p>
      <p className="mt-2 font-black">{label}</p>
      <p className="mt-1 text-sm text-zinc-600">
        {description}
      </p>
    </article>
  );
}

function MoneyStatisticCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <article className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
      <p className="text-3xl font-black tracking-tight">
        {formatMoney(value)}
      </p>
      <p className="mt-2 font-black">{label}</p>
      <p className="mt-1 text-sm text-zinc-600">
        {description}
      </p>
    </article>
  );
}

function PromoStatus({
  promoCode,
}: {
  promoCode: PromoCode;
}) {
  if (isExpired(promoCode.expiresAt)) {
    return (
      <StatusPill
        label="Expired"
        className="border-orange-500/20 bg-orange-500/10 text-orange-300"
      />
    );
  }

  if (!promoCode.isActive) {
    return (
      <StatusPill
        label="Inactive"
        className="border-zinc-500/20 bg-zinc-500/10 text-zinc-400"
      />
    );
  }

  if (
    promoCode.startsAt &&
    new Date(promoCode.startsAt).getTime() > Date.now()
  ) {
    return (
      <StatusPill
        label="Scheduled"
        className="border-blue-500/20 bg-blue-500/10 text-blue-300"
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

function RoleBadge({
  role,
}: {
  role: CustomerRole;
}) {
  return (
    <span className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/[0.08] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-amber-200">
      {role}
    </span>
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
          className="h-10 rounded-xl border border-white/10 px-4 text-sm font-black disabled:opacity-30"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="h-10 rounded-xl border border-white/10 px-4 text-sm font-black disabled:opacity-30"
        >
          Next
        </button>
      </div>
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
        'mt-7 rounded-2xl border p-4 text-sm',
        type === 'error'
          ? 'border-red-500/20 bg-red-500/[0.08] text-red-200'
          : 'border-green-500/20 bg-green-500/[0.08] text-green-200',
      ].join(' ')}
    >
      {message}
    </div>
  );
}

function Spinner() {
  return (
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-amber-300" />
  );
}

function AdminLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070504]">
      <Spinner />
    </main>
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
        <Link
          href="/"
          className="mt-7 inline-flex rounded-full bg-white px-6 py-3 font-black text-black"
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}

function useLockBody(onClose: () => void) {
  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow =
        previousOverflow;
      window.removeEventListener(
        'keydown',
        handleEscape,
      );
    };
  }, [onClose]);
}

async function readResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function getErrorMessage(
  data: unknown,
  fallback: string,
) {
  if (
    data &&
    typeof data === 'object' &&
    'message' in data
  ) {
    const message = (
      data as { message?: unknown }
    ).message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (typeof message === 'string') {
      return message;
    }
  }

  return fallback;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value) || 0);
}

function formatDiscount(promoCode: PromoCode) {
  return promoCode.discountType === 'PERCENTAGE'
    ? `${promoCode.discountValue}%`
    : formatMoney(promoCode.discountValue);
}

function formatAppliesTo(value: AppliesTo) {
  const labels: Record<AppliesTo, string> = {
    ALL: 'Everything',
    RESERVATION: 'Reservations',
    DINE_IN: 'Dine in',
    TAKEAWAY: 'Takeaway',
    DELIVERY: 'Delivery',
  };

  return labels[value];
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('nl-NL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatValidity(promoCode: PromoCode) {
  if (!promoCode.startsAt && !promoCode.expiresAt) {
    return 'Always';
  }

  if (promoCode.expiresAt) {
    return `Until ${new Date(
      promoCode.expiresAt,
    ).toLocaleDateString('nl-NL')}`;
  }

  return `From ${new Date(
    promoCode.startsAt as string,
  ).toLocaleDateString('nl-NL')}`;
}

function toDateTimeLocal(value: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(
    date.getTime() - offset * 60 * 1000,
  );

  return local.toISOString().slice(0, 16);
}

function isExpired(value: string | null) {
  return Boolean(
    value &&
      new Date(value).getTime() < Date.now(),
  );
}