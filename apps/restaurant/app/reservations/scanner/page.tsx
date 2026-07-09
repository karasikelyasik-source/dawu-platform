'use client';

import { useCallback, useState } from 'react';
import Scanner from './Scanner';
import ReservationCard from './ReservationCard';
import { Reservation } from './types';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://31.57.201.45:3000';

function extractToken(value: string) {
  const trimmed = value.trim();

  if (trimmed.startsWith('DAWU:')) {
    return trimmed.replace('DAWU:', '').trim();
  }

  if (trimmed.startsWith('DAWU://reservation/v1/')) {
    return trimmed.replace('DAWU://reservation/v1/', '').trim();
  }

  if (trimmed.startsWith('dawu://reservation/')) {
    return trimmed.replace('dawu://reservation/', '').trim();
  }

  return null;
}

export default function ReservationScannerPage() {
  const [scannerKey, setScannerKey] = useState(1);
  const [token, setToken] = useState('');
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);

  const handleScan = useCallback(async (value: string) => {
    setStatus('Searching reservation...');
    setError('');
    setReservation(null);

    const qrToken = extractToken(value);

    if (!qrToken) {
      setStatus('');
      setError('Invalid DaWu QR code');
      return;
    }

    setToken(qrToken);

    try {
      const res = await fetch(`${API_URL}/reservations/scan/${qrToken}`);

      if (!res.ok) {
        setStatus('');
        setError('Reservation not found');
        return;
      }

      const data = await res.json();

      setReservation(data);
      setStatus('');

      if (data.checkedInAt) {
        setError('Already checked in');
      }
    } catch {
      setStatus('');
      setError('Cannot connect to server');
    }
  }, []);

  async function checkIn() {
    if (!token) return;

    setCheckingIn(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/reservations/scan/${token}/check-in`, {
        method: 'POST',
      });

      if (!res.ok) {
        setError('Check-in failed');
        return;
      }

      const data = await res.json();
      setReservation(data);
    } catch {
      setError('Cannot connect to server');
    } finally {
      setCheckingIn(false);
    }
  }

  function scanAgain() {
    setToken('');
    setReservation(null);
    setStatus('');
    setError('');
    setScannerKey((value) => value + 1);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-md px-5 py-6">
        <header className="mb-6">
          <p className="text-sm uppercase tracking-[0.35em] text-yellow-500">
            DaWu Staff
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            QR Check-In
          </h1>

          <p className="mt-3 text-sm leading-6 text-neutral-400">
            Scan the guest reservation QR code using the staff phone.
          </p>
        </header>

        {!reservation && !status && (
          <Scanner key={scannerKey} onScan={handleScan} />
        )}

        {status && (
          <div className="mt-6 rounded-[28px] border border-neutral-800 bg-neutral-950 p-6 text-center text-neutral-300">
            {status}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-[28px] border border-red-900/70 bg-red-950/40 p-5 text-center text-red-200">
            {error}
          </div>
        )}

        {reservation && (
          <ReservationCard
            reservation={reservation}
            checkingIn={checkingIn}
            onCheckIn={checkIn}
            onScanAgain={scanAgain}
          />
        )}

        {!reservation && error && (
          <button
            onClick={scanAgain}
            className="mt-5 w-full rounded-2xl border border-neutral-700 px-5 py-4 font-semibold text-white transition hover:bg-neutral-900"
          >
            Scan Again
          </button>
        )}
      </div>
    </main>
  );
}