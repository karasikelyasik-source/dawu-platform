'use client';

import { useEffect, useMemo, useState } from 'react';
import Nav from '../menu/components/nav';
import { FileSpreadsheet, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

type Payment = {
  id: string;
  tableNumber: number;
  method: string;
  total: number;
  paid?: number;
  change?: number;
  tip?: number;
  discount?: number;
  createdAt: string;
};

type FilterType = 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'ALL';

export default function RevenuePage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [confirmText, setConfirmText] = useState('');
  const [filter, setFilter] = useState<FilterType>('TODAY');

  async function loadPayments() {
    const res = await fetch('http://31.57.201.45:3000/tables/payments/all');
    const data = await res.json();
    setPayments(Array.isArray(data) ? data : []);
  }

  async function deletePayment(id: string) {
    await fetch(`http://31.57.201.45:3000/tables/payments/${id}`, {
      method: 'DELETE',
    });

    await loadPayments();
  }

  async function deleteAllPayments() {
    if (confirmText !== 'Delete all') {
      alert('Type "Delete all" to confirm');
      return;
    }

    await fetch('http://31.57.201.45:3000/tables/payments/all/delete', {
      method: 'DELETE',
    });

    setConfirmText('');
    await loadPayments();
  }

  useEffect(() => {
    loadPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    const now = new Date();

    return payments.filter((payment) => {
      const date = new Date(payment.createdAt);

      if (filter === 'ALL') return true;
      if (filter === 'TODAY') return date.toDateString() === now.toDateString();

      if (filter === 'WEEK') {
        const diff =
          (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 7;
      }

      if (filter === 'MONTH') {
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      }

      if (filter === 'YEAR') return date.getFullYear() === now.getFullYear();

      return true;
    });
  }, [payments, filter]);

const totalRevenue = useMemo(() => {
  return filteredPayments.reduce(
    (sum, item) =>
      sum + item.total - (item.discount || 0) + (item.tip || 0),
    0,
  );
}, [filteredPayments]);

  const cashRevenue = useMemo(() => {
    return filteredPayments
      .filter((item) => item.method === 'CASH')
      .reduce(
  (sum, item) =>
    sum + item.total - (item.discount || 0) + (item.tip || 0),
  0,
);
  }, [filteredPayments]);

  const cardRevenue = useMemo(() => {
    return filteredPayments
      .filter((item) => item.method === 'CARD')
      .reduce(
  (sum, item) =>
    sum + item.total - (item.discount || 0) + (item.tip || 0),
  0,
);
  }, [filteredPayments]);

  const totalTips = useMemo(() => {
    return filteredPayments.reduce((sum, item) => sum + (item.tip || 0), 0);
  }, [filteredPayments]);

function exportRevenueExcel() {
  const rows = filteredPayments.map((item) => ({
    Date: new Date(item.createdAt).toLocaleString('nl-NL'),
    Table: `Table ${item.tableNumber}`,
    Method: item.method === 'CARD' ? 'PIN' : 'CASH',
    Total: Number(item.total.toFixed(2)),
    Paid: item.paid ? Number(item.paid.toFixed(2)) : '',
    Change: item.change ? Number(item.change.toFixed(2)) : '',
    Tip: Number((item.tip || 0).toFixed(2)),
    Discount: Number((item.discount || 0).toFixed(2)),
Net: Number(
  (item.total - (item.discount || 0) + (item.tip || 0)).toFixed(2),
),
  }));

  const summary = [
    {},
    { Date: 'Summary' },
    { Date: 'Filter', Table: filter },
    { Date: 'Total Revenue', Table: Number(totalRevenue.toFixed(2)) },
    { Date: 'Cash Revenue', Table: Number(cashRevenue.toFixed(2)) },
    { Date: 'PIN Revenue', Table: Number(cardRevenue.toFixed(2)) },
    { Date: 'Tips', Table: Number(totalTips.toFixed(2)) },
  ];

  const worksheet = XLSX.utils.json_to_sheet([...rows, ...summary]);

  worksheet['!cols'] = [
    { wch: 22 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Revenue');

  const date = new Date().toISOString().slice(0, 10);

  XLSX.writeFile(
    workbook,
    `dawu-revenue-${filter.toLowerCase()}-${date}.xlsx`,
  );
}

  return (
    <main className="min-h-screen bg-zinc-950 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <Nav />

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">Revenue</h1>

            <p className="text-zinc-400">
              Financial overview and payments
            </p>
          </div>

<button
  onClick={exportRevenueExcel}
  className="
    group relative flex min-w-[280px] items-center justify-between overflow-hidden
    rounded-[28px]
    border border-emerald-400/80
    bg-gradient-to-r
    from-emerald-950
    via-emerald-900
    to-emerald-500
    px-6 py-4
    font-black
    text-white
    shadow-[0_0_35px_rgba(16,185,129,0.35)]
    transition-all
    duration-300
    hover:scale-[1.02]
    hover:shadow-[0_0_55px_rgba(16,185,129,0.55)]
    disabled:opacity-40
    disabled:hover:scale-100
  "
>
  <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent opacity-60" />

  <div className="relative z-10 flex items-center gap-4">
<div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-500/20 shadow-[0_0_18px_rgba(16,185,129,0.35)]">
<FileSpreadsheet
  className="h-7 w-7 text-emerald-300"
/>
</div>

    <span className="text-xl">Export Excel</span>
  </div>

<div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
  <Download size={24} />
</div>
</button>
</div>

        <div className="mb-8 flex flex-wrap gap-3">
          {['TODAY', 'WEEK', 'MONTH', 'YEAR', 'ALL'].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item as FilterType)}
              className={`rounded-xl border px-4 py-2 font-bold ${
                filter === item
                  ? 'border-white bg-white text-black'
                  : 'border-zinc-800 bg-zinc-900 text-white'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-2 text-sm text-zinc-400">Total Revenue</div>
            <div className="text-4xl font-black text-green-400">
              €{totalRevenue.toFixed(2)}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-2 text-sm text-zinc-400">Cash Revenue</div>
            <div className="text-4xl font-black text-yellow-400">
              €{cashRevenue.toFixed(2)}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-2 text-sm text-zinc-400">PIN Revenue</div>
            <div className="text-4xl font-black text-blue-400">
              €{cardRevenue.toFixed(2)}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-2 text-sm text-zinc-400">Tips</div>
            <div className="text-4xl font-black text-orange-400">
              €{totalTips.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
            <div className="mb-3 font-bold text-red-400">
              Delete All Revenue History
            </div>

            <div className="mb-4 text-sm text-zinc-500">
              Type: <span className="font-bold text-white">Delete all</span>
            </div>

            <div className="flex gap-3">
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type Delete all"
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
              />

              <button
                onClick={deleteAllPayments}
                className="rounded-xl bg-red-500 px-5 py-3 font-bold text-white"
              >
                Delete All
              </button>
            </div>
          </div>

          <h2 className="mb-6 text-2xl font-bold">Payment History</h2>

          <div className="space-y-3">
            {filteredPayments.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-4"
              >
                <div>
                  <div className="font-bold">Table {item.tableNumber}</div>

                  <div className="mt-1 text-sm text-zinc-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-zinc-400">
                      {item.method === 'CARD' ? 'PIN' : 'CASH'}
                    </div>

                   <div className="text-xl font-black text-green-400">
  €{(
    item.total -
    (item.discount || 0) +
    (item.tip || 0)
  ).toFixed(2)}
</div>

{(item.discount || 0) > 0 && (
  <div className="mt-1 text-sm text-red-400">
    Discount -€{(item.discount || 0).toFixed(2)}
  </div>
)}

                    {(item.tip || 0) > 0 && (
                      <div className="mt-1 text-sm text-yellow-400">
                        Tip €{(item.tip || 0).toFixed(2)}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => deletePayment(item.id)}
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {filteredPayments.length === 0 && (
              <div className="text-zinc-500">No payments found</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}