'use client';

import { useEffect, useMemo, useState } from 'react';
import Nav from '../menu/components/nav';

const API_URL = 'http://31.57.201.45:3000';

type MenuItem = {
  id: string;
  name: string;
  price: number | null;
  btwRate?: number;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  btwRate: number;
};

type PaymentMethod = 'CASH' | 'CARD';

export default function TakeAwayPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paidAmount, setPaidAmount] = useState('');

  async function loadMenu() {
    const res = await fetch(`${API_URL}/menu`, { cache: 'no-store' });
    const data = await res.json();

    const items = Array.isArray(data)
      ? data.flatMap((category: any) => category.items || [])
      : [];

    setMenu(items);
  }

  useEffect(() => {
    loadMenu();
  }, []);

  function addItem(item: MenuItem) {
    const price = Number(item.price || 0);

    setCart((current) => {
      const existing = current.find((cartItem) => cartItem.id === item.id);

      if (existing) {
        return current.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, qty: cartItem.qty + 1 }
            : cartItem,
        );
      }

      return [
        ...current,
        {
          id: item.id,
          name: item.name,
          price,
          qty: 1,
          btwRate: item.btwRate || 9,
        },
      ];
    });
  }

  function removeItem(id: string) {
    setCart((current) =>
      current
        .map((item) => (item.id === id ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0),
    );
  }

  function clearOrder() {
    setCart([]);
    setPaidAmount('');
    setPaymentOpen(false);
  }

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

  const paid = paymentMethod === 'CARD' ? total : Number(paidAmount || 0);
  const change = paymentMethod === 'CASH' ? Math.max(paid - total, 0) : 0;
  const tip = paymentMethod === 'CASH' ? Math.max(paid - total, 0) : 0;

  const btw9 = useMemo(() => {
    return cart
      .filter((item) => item.btwRate === 9)
      .reduce((sum, item) => sum + (item.price * item.qty * 9) / 109, 0);
  }, [cart]);

  const btw21 = useMemo(() => {
    return cart
      .filter((item) => item.btwRate === 21)
      .reduce((sum, item) => sum + (item.price * item.qty * 21) / 121, 0);
  }, [cart]);

  function openPayment() {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    setPaymentMethod('CASH');
    setPaidAmount(total.toFixed(2));
    setPaymentOpen(true);
  }

  async function confirmPayment() {
    if (paymentMethod === 'CASH' && paid < total) {
      alert('Paid amount is too low');
      return;
    }

    const receiptPrinterRes = await fetch(`${API_URL}/menu/receipt-printer`).catch(
      () => null,
    );

    const receiptPrinter = receiptPrinterRes
      ? await receiptPrinterRes.json().catch(() => null)
      : null;

    await window.dawu?.printReceipt?.({
      tableNumber: 'TAKE AWAY',
      selectedPackages: [],
      orders: cart.map((item) => ({
        itemName: item.name,
        price: item.price * item.qty,
        quantity: item.qty,
      })),
      paymentMethod,
      paid,
      change,
      receiptPrinter,
    });

    clearOrder();
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto w-full max-w-[1850px] px-4 py-5 lg:px-6">
        <Nav />

        <div className="mt-8 flex flex-col gap-6 xl:flex-row">
          <section className="flex-1 rounded-3xl border border-white/10 bg-zinc-950/80 p-5 shadow-2xl">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black">Take Away</h1>
                <p className="mt-2 text-zinc-500">Create takeaway orders</p>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 text-right">
                <div className="text-xs font-black uppercase text-zinc-400">
                  Items
                </div>
                <div className="text-2xl font-black text-emerald-400">
                  {cart.reduce((sum, item) => sum + item.qty, 0)}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {menu.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addItem(item)}
                  className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 text-left transition hover:bg-emerald-500/10 hover:scale-[1.01]"
                >
                  <div className="font-black">{item.name}</div>
                  <div className="mt-2 text-emerald-400">
                    €{Number(item.price || 0).toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <aside className="w-full rounded-3xl border border-white/10 bg-zinc-950/80 p-5 shadow-2xl xl:w-[440px]">
            <h2 className="text-2xl font-black">Order</h2>

            <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto pr-1">
              {cart.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-black p-4 text-zinc-500">
                  No items yet
                </div>
              )}

              {cart.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-black p-4"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <div className="font-black">{item.name}</div>
                      <div className="mt-1 text-sm text-zinc-500">
                        €{item.price.toFixed(2)} × {item.qty}
                      </div>
                    </div>

                    <div className="font-black">
                      €{(item.price * item.qty).toFixed(2)}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="flex-1 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 font-black text-red-300"
                    >
                      -
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        addItem({
                          id: item.id,
                          name: item.name,
                          price: item.price,
                          btwRate: item.btwRate,
                        })
                      }
                      className="flex-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 font-black text-emerald-300"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <div className="flex justify-between text-sm text-zinc-400">
                <span>BTW 9%</span>
                <span>€{btw9.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm text-zinc-400">
                <span>BTW 21%</span>
                <span>€{btw21.toFixed(2)}</span>
              </div>

              <div className="h-px bg-white/10" />

              <div>
                <div className="text-sm text-zinc-400">Total</div>
                <div className="mt-1 text-4xl font-black text-emerald-400">
                  €{total.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={clearOrder}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 font-black"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={openPayment}
                className="rounded-2xl bg-emerald-500 px-5 py-4 font-black text-black"
              >
                Pay
              </button>
            </div>
          </aside>
        </div>
      </div>

      {paymentOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[520px] rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <h2 className="text-3xl font-black">Payment</h2>
            <p className="mt-2 text-zinc-500">Take Away order</p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('CASH');
                  setPaidAmount(total.toFixed(2));
                }}
                className={`rounded-2xl border px-5 py-4 font-black ${
                  paymentMethod === 'CASH'
                    ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                    : 'border-white/10 bg-white/[0.04] text-zinc-300'
                }`}
              >
                Cash
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('CARD');
                  setPaidAmount(total.toFixed(2));
                }}
                className={`rounded-2xl border px-5 py-4 font-black ${
                  paymentMethod === 'CARD'
                    ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                    : 'border-white/10 bg-white/[0.04] text-zinc-300'
                }`}
              >
                Card
              </button>
            </div>

            {paymentMethod === 'CASH' && (
              <div className="mt-5">
                <label className="text-sm font-black text-zinc-400">
                  Paid amount
                </label>
                <input
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-2xl font-black outline-none focus:border-emerald-500/50"
                  type="number"
                  min="0"
                  step="0.01"
                />
              </div>
            )}

            <div className="mt-5 space-y-2 rounded-2xl border border-white/10 bg-black p-4">
              <div className="flex justify-between text-zinc-400">
                <span>Total</span>
                <span>€{total.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-zinc-400">
                <span>Paid</span>
                <span>€{paid.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-zinc-400">
                <span>Change</span>
                <span>€{change.toFixed(2)}</span>
              </div>

              <div className="flex justify-between font-black text-emerald-400">
                <span>Tip</span>
                <span>€{tip.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentOpen(false)}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 font-black"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmPayment}
                className="rounded-2xl bg-emerald-500 px-5 py-4 font-black text-black"
              >
                Pay & Print
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}