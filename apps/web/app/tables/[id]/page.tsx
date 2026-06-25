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

type PaymentItem = {
  id: string;
  tableId: string;
  method: string;
  total: number;
  paid?: number;
  change?: number;
  tip?: number;
  createdAt: string;
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

export default function TablePage() {
  const params = useParams();
  const tableId = params.id as string;

  const [table, setTable] = useState<Table | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [paidAmount, setPaidAmount] = useState('');
  const [tipAmount, setTipAmount] = useState('');
  const [discountType, setDiscountType] = useState<'EURO' | 'PERCENT'>('EURO');
  const [discountValue, setDiscountValue] = useState('');

  async function loadTable() {
    const res = await fetch(`http://31.57.201.45:3000/tables/${tableId}`);
    const data = await res.json();

    setTable(data);
  }

  async function loadMenu() {
    const res = await fetch('http://31.57.201.45:3000/menu');
    const data = await res.json();

    const items = data.flatMap((category: any) => category.items || []);

    setMenu(items);
  }

  async function loadOrders() {
  try {
    const res = await fetch(
      `http://31.57.201.45:3000/tables/${tableId}/order-logs`,
    );

    const data = await res.json();

    const list = Array.isArray(data) ? data : [];

    setOrders(
      list.map((item: any) => ({
        id: item.id,
        name: item.itemName,
        price: item.price,
        btwRate: item.btwRate ?? 9,
        createdAt: item.createdAt
          ? new Date(item.createdAt).toLocaleTimeString()
          : '',
      })),
    );
  } catch (error) {
    console.error('Failed to load orders:', error);
    setOrders([]);
  }
}

  async function loadPayments() {
    const res = await fetch('http://31.57.201.45:3000/tables/payments/all');
    const data = await res.json();

    const tablePayments = Array.isArray(data)
      ? data.filter((payment: PaymentItem) => payment.tableId === tableId)
      : [];

    setPayments(tablePayments);
  }

  async function updateTableStatus(
    status: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING',
  ) {
    await fetch(`http://31.57.201.45:3000/tables/${tableId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    await loadTable();
  }

  async function addOrder(item: MenuItem) {
    await fetch(`http://31.57.201.45:3000/tables/${tableId}/order-logs`, {
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
    await fetch(`http://31.57.201.45:3000/tables/order-logs/${id}`, {
      method: 'DELETE',
    });

    await loadOrders();
  }

  async function readyTable() {
    await fetch(`http://31.57.201.45:3000/tables/${tableId}/ready`, {
      method: 'POST',
    });

    setOrders([]);
    setPayments([]);
    await loadPayments();
    setTable(null);

    await loadTable();
    await loadPayments();
  }

  function startTransfer() {
    sessionStorage.setItem('dawu-transfer-from-table-id', tableId);
    window.location.href = '/';
  }

  function getTableName(table?: Table | null) {
    if (!table) return '';

    return tableNames[table.number - 1] || String(table.number);
  }

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

  const discount =
  discountType === 'EURO'
    ? Number(discountValue || 0)
    : total * (Number(discountValue || 0) / 100);

const finalTotal = Math.max(0, total - discount);

  const paidAlready = payments.reduce(
    (sum, payment) => sum + Number(payment.total || 0),
    0,
  );

 const remaining = Math.max(0, finalTotal - paidAlready);

const paid = Number(paidAmount || 0);
const tip = Number(tipAmount || 0);

const paymentInput = paid || remaining;
const amountToApply = Math.min(paymentInput, remaining);

const change =
  paymentMethod === 'CASH'
    ? Math.max(0, paid - remaining - tip)
    : 0;

const hasPackages =
  (selectedPackages?.length || 0) > 0;

const hasOrders =
  (orders?.length || 0) > 0;

const hasAnything =
  hasPackages || hasOrders;

  async function closeTableAndPrintCheck() {
    const printerRes = await fetch('http://31.57.201.45:3000/menu/receipt-printer');
    const receiptPrinter = await printerRes.json();

    await window.dawu?.printReceipt({
      tableNumber: getTableName(table),
      selectedPackages,
      orders,
      paymentMethod,
      paid: total,
      change: 0,
      receiptPrinter: receiptPrinter?.printerIp,
    });

    await updateTableStatus('CLEANING');
  }

async function printReceiptAgain() {
  const printerRes = await fetch('http://31.57.201.45:3000/menu/receipt-printer');
  const receiptPrinter = await printerRes.json();

  await window.dawu?.printReceipt({
    tableNumber: getTableName(table),
    selectedPackages,
    orders,
    paymentMethod,
    paid: paidAlready,
    change: 0,
    payments,
    receiptPrinter: receiptPrinter?.printerIp,
  });
}

  async function confirmPayment() {
    if (remaining <= 0 || amountToApply <= 0) return;

    await fetch(`http://31.57.201.45:3000/tables/${tableId}/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tableNumber: table?.number,
        method: paymentMethod,
        total: amountToApply,
        paid: paymentMethod === 'CASH' ? paymentInput : amountToApply,
        change: paymentMethod === 'CASH' ? change : 0,
        tip,
      }),
    });

    await loadPayments();

    const newRemaining = Math.max(0, remaining - amountToApply);

    if (newRemaining <= 0.01) {
      await closeTableAndPrintCheck();
    }

    setPaymentOpen(false);
    setPaidAmount('');
    setTipAmount('');
    setDiscountValue('');
setDiscountType('EURO');
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

  useEffect(() => {
    loadTable();
    loadMenu();
    loadOrders();
    loadPayments();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <Nav />

        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Table {getTableName(table)}
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
              onClick={startTransfer}
              className="rounded-xl bg-purple-500/10 border border-purple-500/30 px-4 py-2 text-purple-400"
            >
              Transfer
            </button>


<button
  onClick={() => {
    sessionStorage.setItem(
      'dawu-merge-from-table-id',
      tableId,
    );

    window.location.href = '/tables-dashboard';
  }}
  className="rounded-xl bg-blue-500/10 border border-blue-500/30 px-4 py-2 text-blue-400"
>
  Merge
</button>

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

              <div className="flex items-center justify-between text-blue-400">
                <span>Paid already</span>
                <span>€{paidAlready.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-yellow-400">
                <span>Remaining</span>
                <span>€{remaining.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                <div className="text-xl font-bold">Total</div>

                <div className="text-2xl font-bold text-green-400">
                  €{total.toFixed(2)}
                </div>
              </div>
            </div>

{!hasAnything ? (
  <button
    disabled
    className="mt-6 w-full rounded-xl bg-zinc-800 px-4 py-3 font-bold text-zinc-500"
  >
    No items ordered
  </button>
) : total <= 0 ? (
  <button
    onClick={() => setPaymentOpen(true)}
    className="mt-6 w-full rounded-xl bg-white px-4 py-3 font-bold text-black"
  >
    Pay / Print
  </button>
) : remaining > 0 ? (
  <button
    onClick={() => setPaymentOpen(true)}
    className="mt-6 w-full rounded-xl bg-white px-4 py-3 font-bold text-black"
  >
    Pay / Partial Pay
  </button>
) : (
  <div className="mt-6 space-y-3">
    <button
      disabled
      className="w-full rounded-xl bg-green-500 px-4 py-3 font-bold text-black"
    >
      ✓ Fully Paid
    </button>

    <button
      onClick={printReceiptAgain}
      className="w-full rounded-xl border border-white/10 bg-zinc-800 px-4 py-3 font-bold text-white"
    >
      🖨 Print Receipt Again
    </button>
  </div>
)}
          </div>
        </div>
      </div>

{payments.length > 0 && (
  <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
    <h3 className="mb-3 text-lg font-bold">
      Payment History
    </h3>

    <div className="space-y-2">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3 text-sm"
        >
          <div>
            <div className="font-bold">
              {payment.method === 'CARD' ? 'Card / PIN' : 'Cash'}
            </div>

            <div className="text-xs text-zinc-500">
              {new Date(payment.createdAt).toLocaleString()}
            </div>

            {(payment.tip || 0) > 0 && (
              <div className="text-xs text-yellow-400">
                Tip: €{Number(payment.tip || 0).toFixed(2)}
              </div>
            )}

            {(payment.change || 0) > 0 && (
              <div className="text-xs text-green-400">
                Change: €{Number(payment.change || 0).toFixed(2)}
              </div>
            )}
          </div>

          <div className="text-lg font-black text-blue-400">
            €{Number(payment.total || 0).toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  </div>
)}

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
              <div className="space-y-2">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Total</span>
                  <span>€{total.toFixed(2)}</span>
                </div>


<div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
  <div className="mb-2 text-sm font-bold text-red-300">
    Discount
  </div>

  <div className="mb-2 grid grid-cols-2 gap-2">
    <button
      type="button"
      onClick={() => setDiscountType('EURO')}
      className={`rounded-xl px-3 py-2 text-sm font-bold ${
        discountType === 'EURO'
          ? 'bg-red-500 text-white'
          : 'bg-zinc-900 text-zinc-300'
      }`}
    >
      €
    </button>

    <button
      type="button"
      onClick={() => setDiscountType('PERCENT')}
      className={`rounded-xl px-3 py-2 text-sm font-bold ${
        discountType === 'PERCENT'
          ? 'bg-red-500 text-white'
          : 'bg-zinc-900 text-zinc-300'
      }`}
    >
      %
    </button>
  </div>

  <input
    type="number"
    placeholder="Discount amount"
    value={discountValue}
    onChange={(e) => setDiscountValue(e.target.value)}
    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
  />
</div>

{discount > 0 && (
  <>
    <div className="flex items-center justify-between text-red-400">
      <span>Discount</span>
      <span>-€{discount.toFixed(2)}</span>
    </div>

    <div className="flex items-center justify-between font-bold text-green-400">
      <span>Total after discount</span>
      <span>€{finalTotal.toFixed(2)}</span>
    </div>
  </>
)}

                <div className="flex items-center justify-between text-blue-400">
                  <span>Paid already</span>
                  <span>€{paidAlready.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-yellow-400 text-lg font-bold">
                  <span>Remaining</span>
                  <span>€{remaining.toFixed(2)}</span>
                </div>
              </div>

              <input
                type="number"
                placeholder={`Pay amount, remaining €${remaining.toFixed(2)}`}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="mt-4 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3"
              />
<input
  type="number"
  placeholder="Tip amount..."
  value={tipAmount}
  onChange={(e) => setTipAmount(e.target.value)}
  className="mt-3 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3"
/>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaidAmount((remaining / 2).toFixed(2))}
                  className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm font-bold text-zinc-300"
                >
                  1/2
                </button>

                <button
                  onClick={() => setPaidAmount((remaining / 3).toFixed(2))}
                  className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm font-bold text-zinc-300"
                >
                  1/3
                </button>

                <button
                  onClick={() => setPaidAmount(remaining.toFixed(2))}
                  className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-black"
                >
                  Full
                </button>
              </div>

{tip > 0 && (
  <div className="mt-4 flex items-center justify-between text-lg">
    <span className="font-bold">
      Tip
    </span>

    <span className="font-bold text-yellow-400">
      €{tip.toFixed(2)}
    </span>
  </div>
)}

              {paymentMethod === 'CASH' && (
                <div className="mt-4 flex items-center justify-between text-lg">
                  <span className="font-bold">Change</span>

                  <span className="font-bold text-green-400">
                    €{change.toFixed(2)}
                  </span>
                </div>
              )}

              {paymentMethod === 'CARD' && (
                <div className="mt-4 flex items-center justify-between text-lg">
                  <span className="font-bold">Paid by PIN</span>

                  <span className="font-bold text-blue-400">
                    €{amountToApply.toFixed(2)}
                  </span>
                </div>
              )}
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
                disabled={remaining <= 0 || amountToApply <= 0}
                className="flex-1 rounded-xl bg-white px-4 py-3 font-bold text-black disabled:opacity-40"
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