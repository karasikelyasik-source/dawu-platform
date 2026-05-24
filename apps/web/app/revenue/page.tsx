'use client';

import { useEffect, useMemo, useState } from 'react';
import Nav from '../menu/components/nav';

type Payment = {
  id: string;
  tableNumber: number;
  method: string;
  total: number;
  paid?: number;
  change?: number;
  tip?: number;
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
    return filteredPayments.reduce((sum, item) => sum + item.total, 0);
  }, [filteredPayments]);

  const cashRevenue = useMemo(() => {
    return filteredPayments
      .filter((item) => item.method === 'CASH')
      .reduce((sum, item) => sum + item.total, 0);
  }, [filteredPayments]);

  const cardRevenue = useMemo(() => {
    return filteredPayments
      .filter((item) => item.method === 'CARD')
      .reduce((sum, item) => sum + item.total, 0);
  }, [filteredPayments]);

  const totalTips = useMemo(() => {
    return filteredPayments.reduce((sum, item) => sum + (item.tip || 0), 0);
  }, [filteredPayments]);

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <Nav />

        <h1 className="text-3xl font-bold mb-2">Revenue</h1>

        <p className="text-zinc-400 mb-8">
          Financial overview and payments
        </p>

        <div className="flex flex-wrap gap-3 mb-8">
          {['TODAY', 'WEEK', 'MONTH', 'YEAR', 'ALL'].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item as FilterType)}
              className={`rounded-xl px-4 py-2 border font-bold ${
                filter === item
                  ? 'bg-white text-black border-white'
                  : 'bg-zinc-900 border-zinc-800 text-white'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
            <div className="text-zinc-400 text-sm mb-2">Total Revenue</div>
            <div className="text-4xl font-black text-green-400">
              €{totalRevenue.toFixed(2)}
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
            <div className="text-zinc-400 text-sm mb-2">Cash Revenue</div>
            <div className="text-4xl font-black text-yellow-400">
              €{cashRevenue.toFixed(2)}
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
            <div className="text-zinc-400 text-sm mb-2">PIN Revenue</div>
            <div className="text-4xl font-black text-blue-400">
              €{cardRevenue.toFixed(2)}
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
            <div className="text-zinc-400 text-sm mb-2">Tips</div>
            <div className="text-4xl font-black text-orange-400">
              €{totalTips.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
          <div className="mb-6 rounded-2xl bg-red-500/5 border border-red-500/20 p-4">
            <div className="font-bold text-red-400 mb-3">
              Delete All Revenue History
            </div>

            <div className="text-sm text-zinc-500 mb-4">
              Type: <span className="text-white font-bold">Delete all</span>
            </div>

            <div className="flex gap-3">
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type Delete all"
                className="flex-1 rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3"
              />

              <button
                onClick={deleteAllPayments}
                className="rounded-xl bg-red-500 px-5 py-3 font-bold text-white"
              >
                Delete All
              </button>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-6">Payment History</h2>

          <div className="space-y-3">
            {filteredPayments.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl bg-zinc-950 border border-zinc-800 p-4"
              >
                <div>
                  <div className="font-bold">Table {item.tableNumber}</div>

                  <div className="text-sm text-zinc-500 mt-1">
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-zinc-400">
                      {item.method === 'CARD' ? 'PIN' : 'CASH'}
                    </div>

                    <div className="text-xl font-black text-green-400">
                      €{item.total.toFixed(2)}
                    </div>

                    {(item.tip || 0) > 0 && (
                      <div className="text-sm text-yellow-400 mt-1">
                        Tip €{(item.tip || 0).toFixed(2)}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => deletePayment(item.id)}
                    className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-400"
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