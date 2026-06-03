'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

type Table = {
  id: string;
  number: number;
  status: string;
  selectedPackage?: string | null;
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
  const [infoOpen, setInfoOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const isTableOpen = table?.status === 'OCCUPIED' || Boolean(table?.selectedPackage);

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.price || 0), 0);
  }, [cart]);

  async function loadData() {
    try {
      const index = tableNames.indexOf(tableName);
      const tableNumber = index + 1;

      const tablesRes = await fetch(`${API_URL}/tables?t=${Date.now()}`, {
        cache: 'no-store',
      });

      const tables = await tablesRes.json();

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
    } catch (error) {
      console.log('QR page load error:', error);
    }
  }

  function addToCart(item: MenuItem) {
    if (!isTableOpen) return;

    setCart((prev) => [...prev, item]);
    setCartOpen(true);
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
    setCartOpen(true);
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

    setCartOpen(true);
  }

  useEffect(() => {
    loadData();

    const interval = setInterval(loadData, 1500);

    return () => clearInterval(interval);
  }, [tableName]);

  if (!table) {
    return (
      <main className="min-h-screen bg-[#050505] p-5 text-white">
        <h1 className="text-3xl font-black">DaWu Sushi Fusion</h1>

        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          <div className="font-black">Table not found</div>
          <div className="mt-1 text-sm">Requested: {tableName}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] p-4 text-white">
      <div className="mx-auto max-w-md">
        <div className="sticky top-0 z-30 -mx-4 mb-3 border-b border-zinc-800 bg-[#050505]/95 p-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black leading-tight">DaWu Sushi Fusion</h1>
              <div className="text-xs text-zinc-500">
                Table {tableName} • {loadedAt || 'loading'}
              </div>
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

          <button
            onClick={() => setInfoOpen(!infoOpen)}
            className="mt-3 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-bold text-zinc-200"
          >
            {infoOpen ? '▲ Hide table info' : '▼ Show table info'}
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              infoOpen ? 'max-h-[520px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-zinc-500">Status</div>
                  <div className="font-black">{table.status}</div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-zinc-500">Package</div>
                  <div className="max-w-[160px] truncate font-black text-green-400">
                    {table.selectedPackage || 'Not selected'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => sendServiceRequest('WAITER')}
                disabled={!isTableOpen}
                className="rounded-xl bg-blue-500 px-3 py-3 text-sm font-black text-white disabled:opacity-40"
              >
                🔔 Call Waiter
              </button>

              <button
                onClick={() => sendServiceRequest('BILL')}
                disabled={!isTableOpen}
                className="rounded-xl bg-yellow-500 px-3 py-3 text-sm font-black text-black disabled:opacity-40"
              >
                💳 Need Bill
              </button>
            </div>

            {!isTableOpen && (
              <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                This table is not open yet. Ask staff to open your table.
              </div>
            )}
          </div>
        </div>

        <div className="mb-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="font-black">🍣 All You Can Eat</div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-400">
            <div className="rounded-xl bg-zinc-900 p-2">10 dishes / person</div>
            <div className="rounded-xl bg-zinc-900 p-2">10 min per round</div>
            <div className="rounded-xl bg-zinc-900 p-2">2.5 hours dining</div>
            <div className="rounded-xl bg-zinc-900 p-2">Avoid food waste</div>
          </div>
        </div>

        <div className="space-y-3 pb-40">
          {menu.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="break-words text-lg font-black leading-snug">
                    {item.name}
                  </div>

                  <div className="mt-1 text-zinc-400">
                    €{Number(item.price || 0).toFixed(2)}
                  </div>
                </div>

                <div className="shrink-0 rounded-full bg-zinc-900 px-3 py-1 text-xs text-zinc-400">
                  BTW {item.btwRate || 9}%
                </div>
              </div>

              <button
                onClick={() => addToCart(item)}
                disabled={!isTableOpen}
                className="mt-3 w-full rounded-xl bg-white px-4 py-3 font-black text-black disabled:opacity-40"
              >
                Add
              </button>
            </div>
          ))}
        </div>

        <div
          className={`fixed left-0 right-0 z-50 border-t border-zinc-800 bg-[#050505] shadow-2xl transition-all duration-300 ${
            cartOpen ? 'bottom-0' : '-bottom-48'
          }`}
        >
          <button
            onClick={() => setCartOpen(!cartOpen)}
            className="absolute -top-11 left-1/2 -translate-x-1/2 rounded-t-2xl border border-zinc-700 bg-zinc-900 px-8 py-2 text-xl shadow-xl"
          >
            {cartOpen ? '⬇️' : '⬆️'}
          </button>

          <div className="mx-auto max-w-md p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="font-black">Cart</div>
                <div className="text-sm text-zinc-500">{cart.length} items</div>
              </div>

              <div className="text-right">
                <div className="text-xs text-zinc-500">Total</div>
                <div className="text-xl font-black text-green-400">
                  €{total.toFixed(2)}
                </div>
              </div>
            </div>

            {cart.length > 0 && (
              <div className="mb-3 max-h-36 space-y-2 overflow-auto rounded-2xl bg-zinc-950 p-3">
                {cart.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-bold">{item.name}</div>
                      <div className="text-xs text-zinc-500">
                        €{Number(item.price || 0).toFixed(2)}
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(index)}
                      className="shrink-0 rounded-xl bg-red-500/10 px-3 py-1 font-bold text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {message && (
              <div className="mb-3 rounded-2xl bg-green-500/10 p-3 text-sm font-bold text-green-400">
                {message}
              </div>
            )}

            <button
              onClick={sendOrder}
              disabled={cart.length === 0 || !isTableOpen}
              className="w-full rounded-2xl bg-green-500 px-4 py-4 font-black text-black disabled:opacity-40"
            >
              Send Order
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
