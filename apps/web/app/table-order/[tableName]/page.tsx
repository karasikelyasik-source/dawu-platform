'use client';

import { useEffect, useState } from 'react';
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

const tableNames = [
  'A1', 'A2', 'A3', 'A4', 'A5',
  'A6', 'A7', 'A8', 'A9', 'A10',
  'B1', 'B2', 'B3', 'B4', 'B5', 'B6',
  'A15', 'A16', 'A17', 'A18',
  'C1', 'C2', 'C3', 'C4', 'C5', 'C6',
  'C7', 'C8', 'C9', 'C9a', 'C10', 'C10a',
  'C15', 'C16', 'C17', 'C18', 'C19',
];
const API_URL = '/api-proxy';


export default function TableOrderPage() {
  const params = useParams();
  const tableName = String(params.tableName || '').toUpperCase();

  const [table, setTable] = useState<Table | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<MenuItem[]>([]);
  const [message, setMessage] = useState('');

  async function loadData() {
    const tablesRes = await fetch(`${API_URL}/tables`);
    const tables = await tablesRes.json();
console.log('TABLES FROM API:', tables);
console.log('REQUESTED TABLE:', tableName);
    const index = tableNames.indexOf(tableName);

const foundTable = Array.isArray(tables)
  ? tables.find((table: any) => table.number === index + 1)
  : null;

setTable(foundTable || null);

    const menuRes = await fetch(`${API_URL}/menu`);
    const categories = await menuRes.json();

    const items = Array.isArray(categories)
      ? categories.flatMap((category: any) => category.items || [])
      : [];

    setMenu(items);
  }

  function addToCart(item: MenuItem) {
    setCart((prev) => [...prev, item]);
    setMessage('');
  }

  async function sendOrder() {
    if (!table || cart.length === 0) return;

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
    if (!table) return;

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
  }, []);

  if (!table) {
  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div>Table not found</div>
      <div>Requested: {tableName}</div>
      <div>Tables loaded: {menu.length}</div>
    </main>
  );
}

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-white">
      <div className="mx-auto max-w-md">
        <div className="sticky top-0 z-20 -mx-4 mb-4 border-b border-zinc-800 bg-zinc-950/95 p-4 backdrop-blur">
          <h1 className="text-3xl font-black">
            DaWu Menu
          </h1>

          <div className="mt-1 text-zinc-400">
            Table {tableName}
          </div>

          <div className="mt-1 text-xs text-zinc-600">
            STATUS: {table.status}
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

          {!isTableOpen && (
            <div className="mt-3 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300">
              This table is not open yet. Ask staff to open your table.
            </div>
          )}
        </div>

        <div className="space-y-3 pb-56">
          {menu.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
            >
              <div className="text-lg font-bold">
                {item.name}
              </div>

              <div className="mt-1 text-zinc-400">
                €{item.price}
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
              <span>{cart.length} items</span>
            </div>

            {message && (
              <div className="mb-3 text-sm text-green-400">
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
