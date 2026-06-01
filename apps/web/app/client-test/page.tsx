'use client';

import { useEffect, useState } from 'react';

type Table = {
  id: string;
  number: number;
  status: string;
};

type MenuItem = {
  id: string;
  name: string;
  price: number;
};

export default function ClientTestPage() {
  const [a1, setA1] = useState<Table | null>(null);
  const [item, setItem] = useState<MenuItem | null>(null);
  const [status, setStatus] = useState('');

  async function loadData() {
    const tablesRes = await fetch('http://31.57.201.45:3000/tables');
    const tables = await tablesRes.json();

    setA1(tables[0]);

    const menuRes = await fetch('http://31.57.201.45:3000/menu');
    const menu = await menuRes.json();

    const items = menu.flatMap((cat: any) => cat.items || []);
    setItem(items[0] || null);
  }

  async function openA1() {
    if (!a1) return;

    setStatus('Opening A1...');

    await fetch(`http://31.57.201.45:3000/tables/${a1.id}/package`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selectedPackage: 'Client Test Menu',
        selectedGuests: 1,
        selectedPackages: [
          {
            name: 'Client Test Menu',
            guests: 1,
            price: 0,
            btwRate: 9,
          },
        ],
      }),
    });

    await fetch(`http://31.57.201.45:3000/tables/${a1.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'OCCUPIED',
      }),
    });

    setStatus('A1 opened');
  }

  async function orderItem() {
    if (!a1 || !item) return;

    setStatus('Sending order...');

    await fetch(`http://31.57.201.45:3000/tables/${a1.id}/order-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemName: item.name,
        price: item.price,
        menuItemId: item.id,
      }),
    });

    setStatus(`Ordered: ${item.name}`);
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 p-8 text-white">
      <div className="mx-auto max-w-xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h1 className="text-3xl font-black mb-2">
          Client Test Site
        </h1>

        <p className="text-zinc-400 mb-6">
          Test customer order chain for table A1
        </p>

        <div className="space-y-3 rounded-2xl bg-zinc-950 p-4 mb-6">
          <div>A1 ID: {a1?.id || 'Loading...'}</div>
          <div>Test item: {item?.name || 'No menu item found'}</div>
          <div>Status: {status || 'Ready'}</div>
        </div>

        <div className="grid gap-3">
          <button
            onClick={openA1}
            disabled={!a1}
            className="rounded-xl bg-blue-500 px-4 py-3 font-bold text-white disabled:opacity-40"
          >
            Open Table A1
          </button>

          <button
            onClick={orderItem}
            disabled={!a1 || !item}
            className="rounded-xl bg-green-500 px-4 py-3 font-bold text-black disabled:opacity-40"
          >
            Order Test Item
          </button>
        </div>
      </div>
    </main>
  );
}