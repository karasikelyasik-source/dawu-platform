'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Coffee,
  CupSoda,
  IceCreamBowl,
  Plus,
  Search,
  Trash2,
  Settings,
  X,
} from 'lucide-react';
import Nav from '../menu/components/nav';

const API_URL = 'http://31.57.201.45:3000';

type TakeAwayItem = {
  id: string;
  name: string;
  price: number;
  btwRate: number;
  categoryId: string;
};

type TakeAwayCategory = {
  id: string;
  name: string;
  sortOrder: number;
  items: TakeAwayItem[];
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  btwRate: number;
};

type PaymentMethod = 'CASH' | 'CARD';

type ModalMode =
  | 'NONE'
  | 'ADD_CATEGORY'
  | 'EDIT_CATEGORY'
  | 'ADD_ITEM'
  | 'EDIT_ITEM';

export default function TakeAwayPage() {
  const [categories, setCategories] = useState<TakeAwayCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [manageMode, setManageMode] = useState(false);

  const [modalMode, setModalMode] = useState<ModalMode>('NONE');
  const [editingCategory, setEditingCategory] =
    useState<TakeAwayCategory | null>(null);
  const [editingItem, setEditingItem] = useState<TakeAwayItem | null>(null);

  const [categoryName, setCategoryName] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemBtwRate, setItemBtwRate] = useState<'9' | '21'>('9');

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paidAmount, setPaidAmount] = useState('');

  async function loadTakeAway() {
    const res = await fetch(`${API_URL}/take-away`, { cache: 'no-store' });
    const data = await res.json();

    const list: TakeAwayCategory[] = Array.isArray(data) ? data : [];
    setCategories(list);

    if (!activeCategoryId && list.length > 0) {
      setActiveCategoryId(list[0].id);
    }

    if (activeCategoryId && !list.some((c) => c.id === activeCategoryId)) {
      setActiveCategoryId(list[0]?.id || '');
    }
  }

  useEffect(() => {
    loadTakeAway();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCategory = categories.find((c) => c.id === activeCategoryId);

  const activeItems = useMemo(() => {
    const items = activeCategory?.items || [];
    const q = search.trim().toLowerCase();

    if (!q) return items;

    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [activeCategory, search]);

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const paid = paymentMethod === 'CARD' ? total : Number(paidAmount || 0);
  const change = paymentMethod === 'CASH' ? Math.max(paid - total, 0) : 0;
  const tip = paymentMethod === 'CASH' ? Math.max(paid - total, 0) : 0;

  function getCategoryIcon(name: string) {
    const lower = name.toLowerCase();

    if (lower.includes('drink')) return CupSoda;
    if (lower.includes('fries')) return Coffee;
    if (lower.includes('dessert')) return IceCreamBowl;

    return Box;
  }

  function closeModal() {
    setModalMode('NONE');
    setEditingCategory(null);
    setEditingItem(null);
    setCategoryName('');
    setItemName('');
    setItemPrice('');
    setItemBtwRate('9');
  }

  function openAddCategory() {
    setCategoryName('');
    setEditingCategory(null);
    setModalMode('ADD_CATEGORY');
  }

  function openEditCategory(category: TakeAwayCategory) {
    setCategoryName(category.name);
    setEditingCategory(category);
    setModalMode('EDIT_CATEGORY');
  }

  function openAddItem() {
    if (!activeCategoryId) {
      alert('Create category first');
      return;
    }

    setItemName('');
    setItemPrice('');
    setItemBtwRate('9');
    setEditingItem(null);
    setModalMode('ADD_ITEM');
  }

  function openEditItem(item: TakeAwayItem) {
    setItemName(item.name);
    setItemPrice(String(item.price));
    setItemBtwRate(item.btwRate === 21 ? '21' : '9');
    setEditingItem(item);
    setModalMode('EDIT_ITEM');
  }

  async function saveCategory() {
    const name = categoryName.trim();

    if (!name) {
      alert('Category name is empty');
      return;
    }

    if (modalMode === 'ADD_CATEGORY') {
      await fetch(`${API_URL}/take-away/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
    }

    if (modalMode === 'EDIT_CATEGORY' && editingCategory) {
      await fetch(`${API_URL}/take-away/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
    }

    closeModal();
    await loadTakeAway();
  }

  async function saveItem() {
    const name = itemName.trim();
    const price = Number(itemPrice.replace(',', '.'));

    if (!name) {
      alert('Item name is empty');
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      alert('Wrong price');
      return;
    }

    if (modalMode === 'ADD_ITEM') {
      await fetch(`${API_URL}/take-away/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: activeCategoryId,
          name,
          price,
          btwRate: Number(itemBtwRate),
        }),
      });
    }

    if (modalMode === 'EDIT_ITEM' && editingItem) {
      await fetch(`${API_URL}/take-away/items/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          price,
          btwRate: Number(itemBtwRate),
        }),
      });
    }

    closeModal();
    await loadTakeAway();
  }

  async function deleteCategory(category: TakeAwayCategory) {
    if (!confirm(`Delete category "${category.name}"?`)) return;

    await fetch(`${API_URL}/take-away/categories/${category.id}`, {
      method: 'DELETE',
    });

    setActiveCategoryId('');
    await loadTakeAway();
  }

  async function deleteItem(item: TakeAwayItem) {
    if (!confirm(`Delete item "${item.name}"?`)) return;

    await fetch(`${API_URL}/take-away/items/${item.id}`, {
      method: 'DELETE',
    });

    setCart((current) => current.filter((cartItem) => cartItem.id !== item.id));
    await loadTakeAway();
  }

  function addToCart(item: TakeAwayItem) {
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
          price: Number(item.price || 0),
          qty: 1,
          btwRate: item.btwRate || 9,
        },
      ];
    });
  }

  function removeFromCart(id: string) {
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

  try {
    await fetch(`${API_URL}/take-away/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: paymentMethod,
        total,
        paid,
        change,
        tip,
        items: cart.map((item) => ({
          itemId: item.id,
          itemName: item.name,
          quantity: item.qty,
          price: item.price,
          btwRate: item.btwRate,
        })),
      }),
    });

    const receiptPrinterRes = await fetch(
      `${API_URL}/menu/receipt-printer`,
    ).catch(() => null);

    const receiptPrinter = receiptPrinterRes
      ? await receiptPrinterRes.json().catch(() => null)
      : null;

    await window.dawu?.printReceipt?.({
      tableNumber: 'TAKE AWAY',
      selectedPackages: [],
      orders: cart.map((item) => ({
        itemName: item.name,
        quantity: item.qty,
        price: item.price * item.qty,
      })),
      paymentMethod,
      paid,
      change,
      receiptPrinter,
    });

    clearOrder();

    alert('Order saved successfully');
  } catch (error) {
    console.error(error);
    alert('Failed to save order');
  }
}

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto w-full max-w-[1850px] px-4 py-5 lg:px-6">
        <Nav />

       <div
  className="mt-6 grid gap-5"
  style={{ gridTemplateColumns: '270px minmax(0, 1fr) 430px' }}
>
          <aside className="flex h-[760px] flex-col rounded-3xl border border-white/10 bg-zinc-950/80 p-4 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-black">Categories</h2>

              <button
                type="button"
                onClick={openAddCategory}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-zinc-300 transition hover:border-emerald-500/40 hover:text-emerald-300"
              >
                <Plus size={22} />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {categories.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-black p-4 text-zinc-500">
                  No categories yet
                </div>
              )}

              {categories.map((category) => {
                const Icon = getCategoryIcon(category.name);
                const active = category.id === activeCategoryId;

                return (
                  <div key={category.id}>
                    <button
                      type="button"
                      onClick={() => setActiveCategoryId(category.id)}
                      className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-5 text-left text-lg font-black transition ${
                        active
                          ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300 shadow-lg shadow-emerald-500/10'
                          : 'border-white/10 bg-black/60 text-zinc-200 hover:bg-white/[0.06]'
                      }`}
                    >
                      <Icon size={28} />
                      <span>{category.name}</span>
                    </button>

                    {manageMode && active && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => openEditCategory(category)}
                          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-black text-zinc-300"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteCategory(category)}
                          className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-black text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setManageMode(!manageMode)}
              className={`mt-5 flex items-center justify-center gap-2 rounded-2xl border px-5 py-4 font-black transition ${
                manageMode
                  ? 'border-red-500/30 bg-red-500/10 text-red-300'
                  : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:text-emerald-300'
              }`}
            >
              {manageMode ? <X size={18} /> : <Settings size={18} />}
              {manageMode ? 'Close Manage' : 'Manage Menu'}
            </button>
          </aside>

          <section className="h-[760px] overflow-y-auto rounded-3xl border border-white/10 bg-zinc-950/80 p-5 shadow-2xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-4xl font-black">
                  {activeCategory?.name || 'Take Away'}
                </h1>
                <p className="mt-2 text-zinc-500">Click item to add to order</p>
              </div>

              <div className="flex gap-3">
                <div className="flex w-[320px] items-center gap-3 rounded-2xl border border-white/10 bg-black px-4 py-3">
                  <Search size={22} className="text-zinc-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search item..."
                    className="w-full bg-transparent text-lg font-bold text-white outline-none placeholder:text-zinc-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={openAddItem}
                  className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 font-black text-emerald-300"
                >
                  <Plus size={22} />
                  Add Item
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-4">
              {activeItems.map((item) => (
                <div
                  key={item.id}
                 className="group rounded-3xl border border-white/10 bg-black/70 p-2 transition hover:border-emerald-500/40 hover:bg-emerald-500/[0.04]"
                >
                  <button
                    type="button"
                    onClick={() => addToCart(item)}
                    className="w-full text-left"
                  >
                  <div className="flex min-h-[150px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/60 px-4 py-5 text-center">
  <div className="text-xl font-black leading-tight">
    {item.name}
  </div>

  <div className="mt-4 text-3xl font-black text-emerald-400">
    €{Number(item.price || 0).toFixed(2)}
  </div>
</div>
                  </button>

                  {manageMode && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => openEditItem(item)}
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-black text-zinc-300"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteItem(item)}
                        className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-black text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <aside className="flex h-[760px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/80 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <h2 className="text-3xl font-black">Order</h2>

              <button
                type="button"
                onClick={clearOrder}
                className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-400"
              >
                <Trash2 size={24} />
              </button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-6">
              {cart.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-black p-5 text-zinc-500">
                  No items yet
                </div>
              )}

              {cart.map((item) => (
                <div key={item.id} className="border-b border-white/10 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-black">
                        {item.qty}x&nbsp;&nbsp;{item.name}
                      </div>

                      {item.qty > 1 && (
                        <div className="mt-1 text-sm text-zinc-500">
                          €{item.price.toFixed(2)} each
                        </div>
                      )}
                    </div>

                    <div className="text-lg font-black">
                      €{(item.price * item.qty).toFixed(2)}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 font-black text-red-300"
                    >
                      -
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        addToCart({
                          id: item.id,
                          name: item.name,
                          price: item.price,
                          btwRate: item.btwRate,
                          categoryId: '',
                        })
                      }
                      className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 font-black text-emerald-300"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 p-6">
              <div className="flex justify-between text-xl font-bold text-zinc-400">
                <span>Items</span>
                <span className="text-emerald-400">{totalQty}</span>
              </div>

              <div className="mt-8 flex items-end justify-between">
                <div className="text-3xl font-black">Total</div>
                <div className="text-4xl font-black text-emerald-400">
                  €{total.toFixed(2)}
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={clearOrder}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-5 text-xl font-black"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={openPayment}
                  className="rounded-2xl bg-emerald-400 px-5 py-5 text-xl font-black text-black"
                >
                  Pay
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {modalMode !== 'NONE' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[520px] rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <h2 className="text-3xl font-black">
              {modalMode === 'ADD_CATEGORY' && 'Add Category'}
              {modalMode === 'EDIT_CATEGORY' && 'Edit Category'}
              {modalMode === 'ADD_ITEM' && 'Add Item'}
              {modalMode === 'EDIT_ITEM' && 'Edit Item'}
            </h2>

            {(modalMode === 'ADD_CATEGORY' || modalMode === 'EDIT_CATEGORY') && (
              <input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="mt-6 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-xl font-black outline-none focus:border-emerald-500/50"
                placeholder="Sushi Boxen"
              />
            )}

            {(modalMode === 'ADD_ITEM' || modalMode === 'EDIT_ITEM') && (
              <div className="mt-6 space-y-4">
                <input
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-xl font-black outline-none focus:border-emerald-500/50"
                  placeholder="Salmon Box"
                />

                <input
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-xl font-black outline-none focus:border-emerald-500/50"
                  placeholder="12.50"
                  type="number"
                  step="0.01"
                />

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setItemBtwRate('9')}
                    className={`rounded-2xl border px-5 py-4 font-black ${
                      itemBtwRate === '9'
                        ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                        : 'border-white/10 bg-white/[0.04] text-zinc-300'
                    }`}
                  >
                    BTW 9%
                  </button>

                  <button
                    type="button"
                    onClick={() => setItemBtwRate('21')}
                    className={`rounded-2xl border px-5 py-4 font-black ${
                      itemBtwRate === '21'
                        ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                        : 'border-white/10 bg-white/[0.04] text-zinc-300'
                    }`}
                  >
                    BTW 21%
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 font-black"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  modalMode === 'ADD_CATEGORY' || modalMode === 'EDIT_CATEGORY'
                    ? saveCategory
                    : saveItem
                }
                className="rounded-2xl bg-emerald-400 px-5 py-4 font-black text-black"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[520px] rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <h2 className="text-3xl font-black">Payment</h2>

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
              <input
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="mt-5 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-2xl font-black outline-none focus:border-emerald-500/50"
                type="number"
                min="0"
                step="0.01"
              />
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
                className="rounded-2xl bg-emerald-400 px-5 py-4 font-black text-black"
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