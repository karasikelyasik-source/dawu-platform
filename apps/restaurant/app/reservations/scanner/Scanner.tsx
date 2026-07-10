'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

type Props = {
  onScan: (value: string) => void | Promise<void>;
};

export default function Scanner({ onScan }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(true);
  const scannedRef = useRef(false);

  const [error, setError] = useState('');
  const [isStarting, setIsStarting] = useState(true);

  useEffect(() => {
    mountedRef.current = true;
    scannedRef.current = false;

    const scannerId = `qr-reader-${Date.now()}`;
    const container = document.getElementById('qr-reader');

    if (!container) {
      setError('Scanner container could not be loaded.');
      setIsStarting(false);
      return;
    }

    container.id = scannerId;

    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;

    async function startScanner() {
      try {
        await scanner.start(
          {
            facingMode: 'environment',
          },
          {
            fps: 8,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const size = Math.floor(
                Math.min(viewfinderWidth, viewfinderHeight) * 0.72,
              );

              return {
                width: size,
                height: size,
              };
            },
            aspectRatio: 1,
          },
          (decodedText) => {
            if (scannedRef.current || !mountedRef.current) {
              return;
            }

            scannedRef.current = true;

            if ('vibrate' in navigator) {
              navigator.vibrate?.(100);
            }

            // Сначала передаём результат странице.
            // Камеру останавливаем немного позже, чтобы Safari
            // не сломал текущий video callback.
            void onScan(decodedText);

            window.setTimeout(() => {
              if (!scannerRef.current) {
                return;
              }

              scannerRef.current
                .stop()
                .catch(() => {
                  // Камера могла уже остановиться при размонтировании.
                });
            }, 250);
          },
          () => {
            // Ошибки отдельных кадров игнорируем:
            // это нормальная часть процесса сканирования.
          },
        );

        if (mountedRef.current) {
          setIsStarting(false);
        }
      } catch (startError) {
        console.error('QR scanner start failed:', startError);

        if (mountedRef.current) {
          setIsStarting(false);
          setError(
            'Camera could not be started. Check camera permission and reload the page.',
          );
        }
      }
    }

    void startScanner();

    return () => {
      mountedRef.current = false;

      const activeScanner = scannerRef.current;
      scannerRef.current = null;

      if (activeScanner) {
        activeScanner
          .stop()
          .catch(() => {
            // Scanner may already be stopped.
          });
      }
    };
  }, [onScan]);

  return (
    <div className="rounded-[32px] border border-neutral-800 bg-neutral-950 p-3 shadow-2xl">
      <div
        id="qr-reader"
        className="min-h-[320px] overflow-hidden rounded-[24px] bg-black"
      />

      {isStarting && !error && (
        <div className="mt-4 rounded-2xl border border-neutral-800 bg-black p-4 text-center text-sm text-neutral-400">
          Starting camera...
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-red-900/70 bg-red-950/40 p-4 text-center text-sm text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}