'use client';

import { useEffect, useState } from 'react';

type SelectedPackageItem = {
  name: string;
  guests: number;
  price: number;
};

type OrderItem = {
  id: string;
  name: string;
  price: number;
  createdAt: string;
};

export default function PrintCheckPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<SelectedPackageItem[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const [printedAt, setPrintedAt] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('print-check');

    if (saved) {
      const data = JSON.parse(saved);

      setOrders(data.orders || []);
      setSelectedPackages(data.selectedPackages || []);
      setTableNumber(data.tableNumber || '');
    }

    setPrintedAt(new Date().toLocaleString());
  }, []);

  const packageTotal = selectedPackages.reduce(
    (sum, item) => sum + item.price * item.guests,
    0,
  );

  const ordersTotal = orders.reduce(
    (sum, item) => sum + item.price,
    0,
  );

  const total = packageTotal + ordersTotal;

  return (
    <main className="bg-white text-black p-6 min-h-screen">
      <h1 className="text-2xl font-bold">DaWu - Sushi & Grill</h1>

      <div className="mt-2 text-sm">Table {tableNumber}</div>
      <div className="text-sm">{printedAt}</div>

      <hr className="my-4" />

      <div className="space-y-2">
        {selectedPackages.map((item, index) => (
          <div key={index} className="flex justify-between font-semibold">
            <span>{item.name} x{item.guests}</span>
            <span>€{(item.price * item.guests).toFixed(2)}</span>
          </div>
        ))}

        {orders.map((item) => (
          <div key={item.id} className="flex justify-between">
            <span>{item.name}</span>
            <span>€{item.price.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <hr className="my-4" />

      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Menus</span>
          <span>€{packageTotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span>Extra orders</span>
          <span>€{ordersTotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-xl font-bold border-t pt-3">
          <span>Total</span>
          <span>€{total.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={() => window.print()}
        className="mt-6 bg-black text-white px-4 py-2"
      >
        Print
      </button>
    </main>
  );
}