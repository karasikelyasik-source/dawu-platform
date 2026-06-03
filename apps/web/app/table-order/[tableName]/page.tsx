'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type Table = {
  id: string;
  number: number;
  status: string;
  selectedPackage?: string | null;
  selectedGuests?: number | null;
  selectedPackages?: any[] | null;
};

type MenuItem = {
  id: string;
  name: string;
  price: number;
  btwRate?: number;
};

const API_URL = '/api-proxy';

const tableNames = [
  'A1', 'A2', 'A3', 'A4', 'A5',
  'A6', 'A7', 'A8', 'A9', 'A10',
  'B1', 'B2', 'B3', 'B4', 'B5', 'B6',
  'A15', 'A16', 'A17', 'A18',
  'C1', 'C2', 'C3', 'C4', 'C5', 'C6',
  'C7', 'C8', 'C9', 'C9a', 'C10', 'C10a',
  'C15', 'C16', 'C17', 'C18', 'C19',
];

export default function TableOrderPage() {
  const params = useParams();
  const tableName = String(params.tableName || '').toUpperCase();

  const [table, setTable] = useState<Table | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<MenuItem[]>([]);
  const [message, setMessage] = useState('');
  const [loadedAt, setLoadedAt] = useState('');

  const isTableOpen =
    table?.status === 'OCCUPIED' ||
    Boolean(table?.selectedPackage) ||
    Boolean(table?.selectedPackages?.length);

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price || 0),
    0,
  );

  async function loadData() {
    const tablesRes = await fetch(`${API_URL}/tables?t=${Date.now()}`, {
      cache: 'no-store',
    });

    const tables = await tablesRes.json();

    const index = tableNames.indexOf(tableName);
    const tableNumber = index + 1;

    const foundTable = Array.isArray(tables)
      ? tables.find((item: any) => Number(item.number) === tableNumber)
      : null;

    setTable(foundTable || null);

    const menuRes = await fetch(`${API_URL}/menu?t=${Date.now()}`, {
      cache: 'no-store',
    });

    const categories = await menuRes.json();

    const items = Array.isArray(categories)
      ? categories.flatMap((category: any) => category.items || [])
      : [];

    setMenu(items);
    setLoadedAt(new Date().toLocaleTimeString());
  }

  function addToCart(item: MenuItem) {
    setCart((prev) => [...prev, item]);
    setMessage('');
  }

  function removeFromCart(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  async function sendOrder() {
    if (!table || cart.length === 0 || !isTableOpen) return;

    setMessage('Sending order...');

    for (const item of cart) {
      await fetch(`${API_URL}/tables/${table.id}/order-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: item.name,
          price: item.price,
          menuItemId: item.id,
        }),
      });
    }

    setCart([]);
    setMessage('Order sent to kitchen ✅');
  }

  async function sendServiceRequest(type: 'WAITER' | 'BILL') {
    if (!table || !isTableOpen) return;

    const itemName =
      type === 'WAITER'
        ? '🔔 Customer calls waiter'
        : '💳 Customer asks for bill';

    await fetch(`${API_URL}/tables/${table.id}/order-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemName,
        price: 0,
      }),
    });

    setMessage(
      type === 'WAITER'
        ? 'Waiter has been called ✅'
        : 'Bill request sent ✅',
    );
  }

  useEffect(() => {
    loadData();

    const interval = setInterval(loadData, 1500);

    return () => clearInterval(interval);
  }, []);

  if (!table) {
    return (
      <main className="min-h-screen bg-zinc-950 p-6 text-white">
        <div className="text-2xl font-black">Table not found</div>
        <div className="mt-2 text-zinc-400">Requested: {tableName}</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-white">
      <div className="mx-auto max-w-md">
        <div className="sticky top-0 z-20 -mx-4 mb-4 border-b border-zinc-800 bg-zinc-950/95 p-4 backdrop-blur">
          <h1 className="text-3xl font-black">
            DaWu Sushi Fusion
          </h1>

          <div className="text-sm text-zinc-500">
            Welcome to our restaurant
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-zinc-400 text-sm">Table</div>
                <div className="text-2xl font-black">{tableName}</div>
              </div>

              <div
                className={`rounded-full px-3 py-1 text-xs font-black ${
                  isTableOpen
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {isTableOpen ? 'OPEN' : 'CLOSED'}
              </div>
            </div>

            <div className="mt-3 text-xs text-zinc-500">
              Status: {table.status} • updated {loadedAt}
            </div>

            {table.selectedPackage && (
              <div className="mt-3 text-sm text-green-400">
                Package: {table.selectedPackage}
              </div>
            )}

            {table.selectedGuests && (
              <div className="text-sm text-zinc-300">
                Guests: {table.selectedGuests}
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => sendServiceRequest('WAITER')}
              disabled={!isTableOpen}
              className="rounded-xl bg-blue-500 px-4 py-3 font-bold text-white disabled:opacity-40"
            >
              🔔 Call Waiter
            </button>

            <button
              onClick={() => sendServiceRequest('BILL')}
              disabled={!isTableOpen}
              className="rounded-xl bg-yellow-500 px-4 py-3 font-bold text-black disabled:opacity-40"
            >
              💳 Need Bill
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="font-bold">🍣 All You Can Eat</div>

            <ul className="mt-2 space-y-1 text-sm text-zinc-400">
              <li>• 10 dishes per person per round</li>
              <li>• New round every 10 minutes</li>
              <li>• Dining time: 2.5 hours</li>
              <li>• Please avoid food waste</li>
            </ul>
          </div>

          {!isTableOpen && (
            <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              This table is not open yet. Ask staff to open your table.
            </div>
          )}
        </div>

        <div className="space-y-3 pb-72">
          {menu.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
            >
              <div className="text-lg font-bold">{item.name}</div>

              <div className="mt-1 text-zinc-400">
                €{Number(item.price || 0).toFixed(2)}
              </div>

              <button
                onClick={() => addToCart(item)}
                disabled={!isTableOpen}
                className="mt-4 w-full rounded-xl bg-white px-4 py-3 font-bold text-black disabled:opacity-40"
              >
                Add
              </button>
            </div>
          ))}
        </div>

        <div className="fixed bottom-6 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950 p-4 shadow-2xl">
          <div className="mx-auto max-w-md">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span>Cart</span>

              <div className="text-right">
                <div>{cart.length} items</div>
                <div className="font-black text-green-400">
                  €{total.toFixed(2)}
                </div>
              </div>
            </div>

            {cart.length > 0 && (
              <div className="mb-4 max-h-36 space-y-2 overflow-auto rounded-xl bg-zinc-900 p-3">
                {cart.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="truncate">{item.name}</span>

                    <button
                      onClick={() => removeFromCart(index)}
                      className="text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {message && (
              <div className="mb-3 rounded-xl bg-green-500/10 p-3 text-sm text-green-400">
                {message}
              </div>
            )}

            <button
              onClick={sendOrder}
              disabled={cart.length === 0 || !isTableOpen}
              className="w-full rounded-xl bg-green-500 px-4 py-4 font-black text-black disabled:opacity-40"
            >
              Send Order
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}