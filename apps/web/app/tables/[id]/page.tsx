'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Nav from '../../menu/components/nav';

type SelectedPackageItem = {
  name: string;
  guests: number;
  price: number;
  btwRate?: number;
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

type MenuItem = {
  id: string;
  name: string;
  price: number;
  btwRate?: number;
};

type OrderItem = {
  id: string;
  name: string;
  price: number;
  createdAt: string;
  btwRate?: number;
};

declare global {
  interface Window {
    dawu?: {
      printReceipt: (data: any) => Promise<any>;
    };
  }
}

export default function TablePage() {
  const params = useParams();
  const tableId = params.id as string;

  const [table, setTable] = useState<Table | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [paidAmount, setPaidAmount] = useState('');

  async function loadTable() {
    const res = await fetch(`http://localhost:3000/tables/${tableId}`);
    const data = await res.json();
    setTable(data);
  }

  async function loadMenu() {
    const res = await fetch('http://localhost:3000/menu');
    const data = await res.json();
    const items = data.flatMap((category: any) => category.items || []);
    setMenu(items);
  }

  async function loadOrders() {
    const res = await fetch(`http://localhost:3000/tables/${tableId}/order-logs`);
    const data = await res.json();

    setOrders(
      data.map((item: any) => ({
        id: item.id,
        name: item.itemName,
        price: item.price,
        btwRate: item.btwRate ?? 9,
        createdAt: new Date(item.createdAt).toLocaleTimeString(),
      })),
    );
  }

  async function updateTableStatus(
    status: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING',
  ) {
    await fetch(`http://localhost:3000/tables/${tableId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    await loadTable();
  }

  async function addOrder(item: MenuItem) {
    await fetch(`http://localhost:3000/tables/${tableId}/order-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemName: item.name,
        price: item.price,
        menuItemId: item.id,
      }),
    });

    await loadOrders();
  }

  async function removeOrder(id: string) {
    await fetch(`http://localhost:3000/tables/order-logs/${id}`, {
      method: 'DELETE',
    });

    await loadOrders();
  }

  async function readyTable() {
    await fetch(`http://localhost:3000/tables/${tableId}/ready`, {
      method: 'POST',
    });

    setOrders([]);
    setTable(null);

    await loadTable();
  }

  async function closeTableAndPrintCheck() {
    const printerRes = await fetch('http://localhost:3000/menu/receipt-printer');
    const receiptPrinter = await printerRes.json();

await window.dawu?.printReceipt({
  tableNumber: table?.number,
  selectedPackages,
  orders,
  paymentMethod,
  paid,
  change,
  receiptPrinter: receiptPrinter?.printerIp,
});

    await updateTableStatus('CLEANING');
  }

  useEffect(() => {
    loadTable();
    loadMenu();
    loadOrders();
  }, []);

  const selectedPackages = Array.isArray(table?.selectedPackages)
    ? table.selectedPackages
    : [];

  const packageTotal = selectedPackages.reduce(
    (sum, item) => sum + item.price * item.guests,
    0,
  );

  const ordersTotal = orders.reduce(
    (sum, item) => sum + item.price,
    0,
  );

  const total = packageTotal + ordersTotal;
  const paid = Number(paidAmount || 0);
const change = paymentMethod === 'CASH' ? Math.max(0, paid - total) : 0;
const tip = Math.max(0, paid - total);


async function confirmPayment() {
  await fetch(`http://localhost:3000/tables/${tableId}/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tableNumber: table?.number,
      method: paymentMethod,
      total,
      paid: paid || total,
change: paymentMethod === 'CASH' ? change : 0,
tip,
    }),
  });

  await closeTableAndPrintCheck();

  setPaymentOpen(false);
  setPaidAmount('');
}

  function calculateBtw(rate: number) {
    const packageBtw = selectedPackages
      .filter((item) => (item.btwRate ?? 9) === rate)
      .reduce((sum, item) => {
        const amount = item.price * item.guests;
        return sum + amount - amount / (1 + rate / 100);
      }, 0);

    const orderBtw = orders
      .filter((item) => (item.btwRate ?? 9) === rate)
      .reduce((sum, item) => {
        const amount = item.price;
        return sum + amount - amount / (1 + rate / 100);
      }, 0);

    return packageBtw + orderBtw;
  }

  const btw9 = calculateBtw(9);
  const btw21 = calculateBtw(21);

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <Nav />

        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Table {table?.number ?? ''}
            </h1>

            <p className="text-zinc-400">
              {table?.seats ?? 0} seats
            </p>

            <div
              className={`mt-3 text-sm font-bold ${
                table?.status === 'AVAILABLE'
                  ? 'text-green-400'
                  : table?.status === 'OCCUPIED'
                  ? 'text-red-400'
                  : table?.status === 'CLEANING'
                  ? 'text-yellow-400'
                  : 'text-blue-400'
              }`}
            >
              Status: {table?.status}
            </div>

            {selectedPackages.length > 0 && (
              <div className="mt-4 rounded-xl bg-zinc-900 border border-zinc-800 p-4">
                <div className="text-sm text-zinc-400 mb-2">
                  Selected Menus
                </div>

                <div className="space-y-1">
                  {selectedPackages.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between gap-4 text-sm"
                    >
                      <span>
                        {item.name} x{item.guests}
                      </span>

                      <span className="font-semibold">
                        €{(item.price * item.guests).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                window.location.href = `/tables/${tableId}/start`;
              }}
              className="rounded-xl bg-blue-500/10 border border-blue-500/30 px-4 py-2 text-blue-400"
            >
              Change Menus
            </button>

            <button
              onClick={() => updateTableStatus('OCCUPIED')}
              className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-2 text-red-400"
            >
              Close
            </button>

            <button
              onClick={() => updateTableStatus('CLEANING')}
              className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 text-yellow-400"
            >
              Cleaning
            </button>

            <button
              onClick={readyTable}
              className="rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-2 text-green-400"
            >
              Ready
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
            <h2 className="text-2xl font-bold mb-6">Menu</h2>

            <div className="space-y-3">
              {menu.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl bg-zinc-950 border border-zinc-800 p-4"
                >
                  <div>
                    <div className="font-semibold">
                      {item.name}
                    </div>

                    <div className="text-zinc-400 text-sm">
                      €{item.price}
                    </div>

                    <div className="mt-1 text-xs text-zinc-500">
                      BTW {item.btwRate ?? 9}%
                    </div>
                  </div>

                  <button
                    onClick={() => addOrder(item)}
                    className="rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-2 text-green-400"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
            <h2 className="text-2xl font-bold mb-6">Current Orders</h2>

            <div className="space-y-3">
              {selectedPackages.map((item, index) => (
                <div
                  key={`package-${index}`}
                  className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-yellow-300">
                        {item.name} x{item.guests}
                      </div>

                      <div className="text-sm text-zinc-400">
                        €{item.price.toFixed(2)} per guest
                      </div>

                      <div className="mt-1 text-xs text-zinc-500">
                        BTW {item.btwRate ?? 9}%
                      </div>
                    </div>

                    <div className="font-bold text-yellow-300">
                      €{(item.price * item.guests).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}

              {orders.length === 0 && selectedPackages.length === 0 && (
                <div className="text-zinc-500">No orders yet</div>
              )}

              {orders.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl bg-zinc-950 border border-zinc-800 p-4"
                >
                  <div>
                    <div className="font-semibold">{item.name}</div>

                    <div className="text-zinc-400 text-sm">
                      €{item.price}
                    </div>

                    <div className="mt-1 text-xs text-zinc-500">
                      BTW {item.btwRate ?? 9}%
                    </div>

                    <div className="text-xs text-zinc-500 mt-1">
                      Ordered at {item.createdAt}
                    </div>
                  </div>

                  <button
                    onClick={() => removeOrder(item.id)}
                    className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2 text-red-400"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-zinc-800 pt-6 space-y-3">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Menus</span>
                <span>€{packageTotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-zinc-400">
                <span>Extra orders</span>
                <span>€{ordersTotal.toFixed(2)}</span>
              </div>

              {btw9 > 0 && (
                <div className="flex items-center justify-between text-zinc-400">
                  <span>BTW 9%</span>
                  <span>€{btw9.toFixed(2)}</span>
                </div>
              )}

              {btw21 > 0 && (
                <div className="flex items-center justify-between text-zinc-400">
                  <span>BTW 21%</span>
                  <span>€{btw21.toFixed(2)}</span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                <div className="text-xl font-bold">Total</div>

                <div className="text-2xl font-bold text-green-400">
                  €{total.toFixed(2)}
                </div>
              </div>
            </div>

           <button
  onClick={() => setPaymentOpen(true)}
  disabled={total === 0}
  className="mt-6 w-full rounded-xl bg-white px-4 py-3 font-bold text-black disabled:opacity-40"
>
  Pay / Print
</button>
          </div>
        </div>
      </div>

{paymentOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 p-6">
      <h2 className="text-2xl font-bold mb-6">
        Payment
      </h2>

      <div className="mb-6">
        <div className="text-zinc-400 mb-2">
          Payment Method
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPaymentMethod('CASH')}
            className={`rounded-xl px-4 py-3 font-bold border ${
              paymentMethod === 'CASH'
                ? 'bg-green-500 text-black border-green-400'
                : 'bg-zinc-950 border-zinc-800 text-white'
            }`}
          >
            Cash
          </button>

          <button
            onClick={() => setPaymentMethod('CARD')}
            className={`rounded-xl px-4 py-3 font-bold border ${
              paymentMethod === 'CARD'
                ? 'bg-blue-500 text-black border-blue-400'
                : 'bg-zinc-950 border-zinc-800 text-white'
            }`}
          >
            Card / PIN
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 mb-6">
        <div className="flex items-center justify-between text-zinc-400 mb-2">
          <span>Total</span>

          <span>€{total.toFixed(2)}</span>
        </div>

       <>
  <input
    type="number"
    placeholder="Customer paid..."
    value={paidAmount}
    onChange={(e) => setPaidAmount(e.target.value)}
    className="mt-4 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3"
  />

  {paymentMethod === 'CASH' && (
    <div className="mt-4 flex items-center justify-between text-lg">
      <span className="font-bold">
        Change
      </span>

      <span className="font-bold text-green-400">
        €{change.toFixed(2)}
      </span>
    </div>
  )}

  {paymentMethod === 'CARD' && (
    <div className="mt-4 flex items-center justify-between text-lg">
      <span className="font-bold">
        Paid by PIN
      </span>

      <span className="font-bold text-blue-400">
        €{(paid || total).toFixed(2)}
      </span>
    </div>
  )}

  {tip > 0 && (
  <div className="mt-3 flex items-center justify-between text-lg">
    <span className="font-bold">
      Tips
    </span>

    <span className="font-bold text-yellow-400">
      €{tip.toFixed(2)}
    </span>
  </div>
)}
</>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setPaymentOpen(false)}
          className="flex-1 rounded-xl bg-zinc-800 px-4 py-3 font-bold"
        >
          Cancel
        </button>

        <button
          onClick={confirmPayment}
          className="flex-1 rounded-xl bg-white px-4 py-3 font-bold text-black"
        >
          Confirm Payment
        </button>
      </div>
    </div>
  </div>
)}

    </main>
  );
}