'use client';

import { useEffect, useMemo, useState } from 'react';
import Nav from './menu/components/nav';

type SelectedPackageItem = {
  name: string;
  guests: number;
  price: number;
};

type Table = {
  id: string;
  number: number;
  seats: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';
  selectedPackage?: string | null;
  selectedGuests?: number | null;
  selectedPackages?: SelectedPackageItem[] | null;
};

const tableNames = [
  'A1', 'A2', 'A3', 'A4', 'A5',
  'A6', 'A7', 'A8', 'A9', 'A10',
  'B1', 'B2', 'B3', 'B4', 'B5', 'B6',
  'A15', 'A16', 'A17', 'A18',
  'C1', 'C2', 'C3', 'C4', 'C5', 'C6',
  'C7', 'C8', 'C9', 'C9a', 'C10', 'C10a',
  'C15', 'C16', 'C17', 'C18', 'C19',
];

const groups = [
  {
    title: 'A Tables',
    color: 'green',
    names: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10'],
  },
  {
    title: 'B Tables',
    color: 'red',
    names: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'],
  },
  {
    title: 'A15 - A18 Tables',
    color: 'green',
    names: ['A15', 'A16', 'A17', 'A18'],
  },
  {
    title: 'C Tables',
    color: 'blue',
    names: [
      'C1', 'C2', 'C3', 'C4', 'C5', 'C6',
      'C7', 'C8', 'C9', 'C9a', 'C10', 'C10a',
      'C15', 'C16', 'C17', 'C18', 'C19',
    ],
  },
];

export default function TablesDashboard() {
  const [tables, setTables] = useState<Table[]>([]);
  const [transferFromId, setTransferFromId] = useState<string | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);

  async function loadTables() {
    try {
      const res = await fetch('http://31.57.201.45:3000/tables', {
        cache: 'no-store',
      });

      const data = await res.json();

      setTables(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log(e);
    }
  }

  useEffect(() => {
    setTransferFromId(sessionStorage.getItem('dawu-transfer-from-table-id'));

    loadTables();

    const interval = setInterval(loadTables, 2000);

    return () => clearInterval(interval);
  }, []);

  function getTableByName(name: string) {
    const index = tableNames.indexOf(name);
    return tables[index];
  }

  function getTableDisplayName(tableId: string | null) {
    if (!tableId) return '';

    const index = tables.findIndex((table) => table.id === tableId);

    if (index < 0) return '';

    return tableNames[index] || `Table ${tables[index].number}`;
  }

  function getGuests(table?: Table) {
    if (!table) return 0;

    if (table.selectedGuests) {
      return table.selectedGuests;
    }

    if (table.selectedPackages?.length) {
      return table.selectedPackages.reduce(
        (sum, pkg) => sum + (pkg.guests || 0),
        0,
      );
    }

    return 0;
  }

  const totalPeople = useMemo(() => {
    return tables.reduce((sum, table) => {
      return sum + getGuests(table);
    }, 0);
  }, [tables]);

  const occupiedTables = useMemo(() => {
    return tables.filter(
      (table) =>
        table.status === 'OCCUPIED' ||
        table.status === 'RESERVED',
    ).length;
  }, [tables]);

  async function openTable(table?: Table) {
    if (!table?.id) return;

    const fromTableId = sessionStorage.getItem('dawu-transfer-from-table-id');

    if (fromTableId) {
      if (fromTableId === table.id) return;

      try {
        setTransferLoading(true);

       const res = await fetch(`http://31.57.201.45:3000/tables/${fromTableId}/transfer`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    toTableId: table.id,
  }),
});

const result = await res.json();

console.log('TRANSFER RESULT:', result);

if (!res.ok || result?.success !== true) {
  alert(result?.message || 'Transfer failed');
  setTransferLoading(false);
  return;
}

        sessionStorage.removeItem('dawu-transfer-from-table-id');
        setTransferFromId(null);

        window.location.href = `/tables/${table.id}`;
      } finally {
        setTransferLoading(false);
      }

      return;
    }

    if (table.selectedPackage) {
      window.location.href = `/tables/${table.id}`;
    } else {
      window.location.href = `/tables/${table.id}/start`;
    }
  }

  function cancelTransfer() {
    sessionStorage.removeItem('dawu-transfer-from-table-id');
    setTransferFromId(null);
  }

  function statusStyle(status?: Table['status']) {
    if (status === 'OCCUPIED') {
      return {
        card: 'border-red-500/40 bg-red-500/[0.08]',
        badge: 'bg-red-500/15 text-red-400 border border-red-500/20',
        text: 'text-red-400',
        glow: 'hover:shadow-red-500/20',
        label: 'Occupied',
      };
    }

    if (status === 'CLEANING') {
      return {
        card: 'border-yellow-500/40 bg-yellow-500/[0.08]',
        badge: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
        text: 'text-yellow-400',
        glow: 'hover:shadow-yellow-500/20',
        label: 'Cleaning',
      };
    }

    if (status === 'RESERVED') {
      return {
        card: 'border-blue-500/40 bg-blue-500/[0.08]',
        badge: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
        text: 'text-blue-400',
        glow: 'hover:shadow-blue-500/20',
        label: 'Reserved',
      };
    }

    return {
      card: 'border-emerald-500/30 bg-emerald-500/[0.06]',
      badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
      text: 'text-emerald-400',
      glow: 'hover:shadow-emerald-500/20',
      label: 'Available',
    };
  }

  function groupStyle(color: string) {
    if (color === 'red') {
      return 'border-red-500/10 bg-zinc-950/80';
    }

    if (color === 'blue') {
      return 'border-blue-500/10 bg-zinc-950/80';
    }

    return 'border-emerald-500/10 bg-zinc-950/80';
  }

  function TableCard({
    name,
    compact = false,
  }: {
    name: string;
    compact?: boolean;
  }) {
    const table = getTableByName(name);
    const style = statusStyle(table?.status);
    const isSource = transferFromId === table?.id;

    return (
      <button
        onClick={() => openTable(table)}
        disabled={transferLoading || isSource}
        className={`
          relative overflow-hidden rounded-2xl border
          backdrop-blur-xl
          p-4 text-left
          transition-all duration-300
          hover:-translate-y-1
          hover:scale-[1.015]
          active:scale-[0.98]
          shadow-2xl
          disabled:cursor-not-allowed
          disabled:opacity-50
          ${
            transferFromId && !isSource
              ? 'ring-2 ring-purple-500/40 hover:shadow-purple-500/30'
              : ''
          }
          ${
            isSource
              ? 'border-purple-500/50 bg-purple-500/10'
              : style.card
          }
          ${style.glow}
          ${compact ? 'min-h-[118px]' : 'min-h-[132px]'}
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />

        {transferFromId && !isSource && (
          <div className="absolute right-3 top-3 z-20 rounded-full bg-purple-500 px-3 py-1 text-[10px] font-black uppercase text-white">
            Transfer here
          </div>
        )}

        {isSource && (
          <div className="absolute right-3 top-3 z-20 rounded-full bg-purple-500/20 px-3 py-1 text-[10px] font-black uppercase text-purple-300">
            From here
          </div>
        )}

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-2">
            <div className="text-3xl font-black tracking-tight">
              {name}
            </div>

            {!transferFromId && (
              <div
                className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${style.badge}`}
              >
                {table?.status || 'AVAILABLE'}
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm text-zinc-300">
            <span className="text-base">👥</span>

            <span className="font-semibold">
              {getGuests(table)} people
            </span>
          </div>

          {table?.selectedPackage && (
            <div className="mt-3 inline-flex max-w-full truncate rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5 text-xs font-bold text-yellow-300">
              {table.selectedPackage}
            </div>
          )}

          <div className={`mt-4 text-sm font-bold ${style.text}`}>
            {isSource ? 'Transfer source' : style.label}
          </div>
        </div>
      </button>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto w-full max-w-[1850px] px-4 py-5 lg:px-6">
        <Nav />

        <div className="mb-6 mt-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1 text-sm font-bold text-emerald-400">
              LIVE RESTAURANT STATUS
            </div>

            <h1 className="text-4xl font-black tracking-tight lg:text-5xl">
              DaWu POS Dashboard
            </h1>

            <p className="mt-2 text-zinc-400">
              Real-time restaurant tables overview
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 px-5 py-4 backdrop-blur-xl">
              <div className="text-sm text-zinc-500">Total Tables</div>
              <div className="mt-1 text-3xl font-black">{tables.length}</div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 px-5 py-4 backdrop-blur-xl">
              <div className="text-sm text-zinc-500">Total People</div>
              <div className="mt-1 text-3xl font-black text-emerald-400">
                {totalPeople}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 px-5 py-4 backdrop-blur-xl">
              <div className="text-sm text-zinc-500">Live Status</div>
              <div className="mt-1 text-2xl font-black text-red-400">
                {occupiedTables} Active
              </div>
            </div>
          </div>
        </div>

        {transferFromId && (
          <div className="mb-5 rounded-3xl border border-purple-500/30 bg-purple-500/10 p-5 text-purple-300 shadow-2xl shadow-purple-500/10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xl font-black">
                  Transfer mode active
                </div>

                <div className="mt-1 text-sm text-purple-200/80">
                  From {getTableDisplayName(transferFromId)}. Click any target table to move all menus and orders.
                </div>
              </div>

              <button
                onClick={cancelTransfer}
                className="rounded-xl bg-purple-500 px-4 py-2 font-bold text-white"
              >
                Cancel transfer
              </button>
            </div>

            {transferLoading && (
              <div className="mt-4 text-sm font-bold text-purple-200">
                Transferring...
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1fr_0.58fr]">
            {groups.slice(0, 2).map((group) => (
              <section
                key={group.title}
                className={`rounded-3xl border p-4 backdrop-blur-xl ${groupStyle(group.color)}`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-black">
                    {group.title}
                  </h2>

                  <div className="text-sm text-zinc-500">
                    {group.names.length} tables
                  </div>
                </div>

                <div
                  className={
                    group.title === 'B Tables'
                      ? 'grid grid-cols-2 gap-3'
                      : 'grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5'
                  }
                >
                  {group.names.map((name) => (
                    <TableCard key={name} name={name} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {groups.slice(2).map((group) => (
            <section
              key={group.title}
              className={`rounded-3xl border p-4 backdrop-blur-xl ${groupStyle(group.color)}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black">
                  {group.title}
                </h2>

                <div className="text-sm text-zinc-500">
                  {group.names.length} tables
                </div>
              </div>

              <div
                className={
                  group.title === 'C Tables'
                    ? 'grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6'
                    : 'grid grid-cols-2 gap-3 md:grid-cols-4'
                }
              >
                {group.names.map((name) => (
                  <TableCard
                    key={name}
                    name={name}
                    compact
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}