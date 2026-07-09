'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

type Props = {
  onScan: (value: string) => void;
};

export default function Scanner({ onScan }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannedRef = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
        },
        async (decodedText) => {
          if (scannedRef.current) return;

          scannedRef.current = true;

          if ('vibrate' in navigator) {
            navigator.vibrate(120);
          }

          try {
            await scanner.stop();
          } catch {}

          onScan(decodedText);
        },
        () => {}
      )
      .catch(() => {
        setError('Camera access denied or unavailable');
      });

    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="rounded-[32px] border border-neutral-800 bg-neutral-950 p-3 shadow-2xl">
      <div
        id="qr-reader"
        className="overflow-hidden rounded-[24px] bg-black"
      />

      {error && (
        <div className="mt-4 rounded-2xl border border-red-900/70 bg-red-950/40 p-4 text-center text-sm text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}