'use client';

import {
  useCallback,
  useState,
} from 'react';

import Scanner from './Scanner';
import ReservationCard from './ReservationCard';
import AssignTableModal from './AssignTableModal';
import PackageSelectModal from './PackageSelectModal';

import {
  CheckInResponse,
  OpenTableResponse,
  Reservation,
  RestaurantPackage,
  RestaurantTable,
} from './types';

const API_URL = '/api';

function extractToken(value: string) {
  const trimmed = value.trim();

  if (
    trimmed.startsWith(
      'DAWU://reservation/v1/',
    )
  ) {
    return trimmed
      .replace(
        'DAWU://reservation/v1/',
        '',
      )
      .trim();
  }

  if (
    trimmed.startsWith(
      'dawu://reservation/',
    )
  ) {
    return trimmed
      .replace('dawu://reservation/', '')
      .trim();
  }

  if (trimmed.startsWith('DAWU:')) {
    return trimmed
      .replace('DAWU:', '')
      .trim();
  }

  return null;
}

async function readErrorMessage(
  response: Response,
  fallback: string,
) {
  const data = await response
    .json()
    .catch(() => null);

  if (
    typeof data?.message === 'string'
  ) {
    return data.message;
  }

  if (Array.isArray(data?.message)) {
    return data.message.join(', ');
  }

  return fallback;
}

export default function ReservationScannerPage() {
  const [scannerKey, setScannerKey] =
    useState(1);

  const [token, setToken] =
    useState('');

  const [
    reservation,
    setReservation,
  ] = useState<Reservation | null>(null);

  const [status, setStatus] =
    useState('');

  const [error, setError] =
    useState('');

  const [
    checkingIn,
    setCheckingIn,
  ] = useState(false);

  const [
    assignModalOpen,
    setAssignModalOpen,
  ] = useState(false);

  const [tables, setTables] = useState<
    RestaurantTable[]
  >([]);

  const [
    selectedTableId,
    setSelectedTableId,
  ] = useState('');

  const [
    loadingTables,
    setLoadingTables,
  ] = useState(false);

  const [
    assigningTable,
    setAssigningTable,
  ] = useState(false);

  const [
    packageModalOpen,
    setPackageModalOpen,
  ] = useState(false);

  const [
    packages,
    setPackages,
  ] = useState<RestaurantPackage[]>([]);

  const [
    selectedPackageId,
    setSelectedPackageId,
  ] = useState('');

  const [
    loadingPackages,
    setLoadingPackages,
  ] = useState(false);

  const [
    openingTable,
    setOpeningTable,
  ] = useState(false);

  const [
    openedPackageName,
    setOpenedPackageName,
  ] = useState('');
  

  const handleScan = useCallback(
    async (value: string) => {
      setStatus(
        'Searching reservation...',
      );

      setError('');
      setReservation(null);

      const qrToken = extractToken(value);

      if (!qrToken) {
        setStatus('');
        setError(
          'Invalid DaWu QR code',
        );
        return;
      }

      setToken(qrToken);

      try {
        const response = await fetch(
          `${API_URL}/reservations/scan/${encodeURIComponent(
            qrToken,
          )}`,
          {
            cache: 'no-store',
          },
        );

        if (!response.ok) {
          setStatus('');
          setError(
            'Reservation not found',
          );
          return;
        }

        const data:
          | Reservation
          | null =
          await response.json();

        if (!data?.id) {
          setStatus('');
          setError(
            'Reservation not found',
          );
          return;
        }

        setReservation(data);
        setStatus('');

        if (data.checkedInAt) {
          setError(
            'This reservation is already checked in',
          );
        }
      } catch {
        setStatus('');
        setError(
          'Cannot connect to server',
        );
      }
    },
    [],
  );

  async function checkIn() {
    if (!token) return;

    setCheckingIn(true);
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/reservations/scan/${encodeURIComponent(
          token,
        )}/check-in`,
        {
          method: 'POST',
        },
      );

      if (!response.ok) {
        const message =
          await readErrorMessage(
            response,
            'Check-in failed',
          );

        setError(message);
        return;
      }

      const data: CheckInResponse =
        await response.json();

      if (!data.success) {
        if (data.reservation) {
          setReservation(
            data.reservation,
          );
        }

        setError(
          data.message ||
            'Check-in failed',
        );

        return;
      }

      if (!data.reservation) {
        setError(
          'Server returned an invalid response',
        );
        return;
      }

      setReservation(
        data.reservation,
      );

      if ('vibrate' in navigator) {
        navigator.vibrate?.([
          80,
          50,
          120,
        ]);
      }
    } catch {
      setError(
        'Cannot connect to server',
      );
    } finally {
      setCheckingIn(false);
    }
  }

  async function openAssignTable() {
    setAssignModalOpen(true);
    setSelectedTableId('');
    setLoadingTables(true);
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/tables`,
        {
          cache: 'no-store',
        },
      );

      if (!response.ok) {
        throw new Error(
          'Failed to load tables',
        );
      }

      const data: RestaurantTable[] =
        await response.json();

      const availableTables = data
        .filter(
          (table) =>
            table.status ===
            'AVAILABLE',
        )
        .sort(
          (a, b) =>
            a.number - b.number,
        );

      setTables(availableTables);
    } catch {
      setError(
        'Cannot load available tables',
      );

      setAssignModalOpen(false);
    } finally {
      setLoadingTables(false);
    }
  }

  async function assignTable() {
    if (
      !reservation ||
      !selectedTableId
    ) {
      return;
    }

    setAssigningTable(true);
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/reservations/${reservation.id}/assign-table`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            tableId:
              selectedTableId,
          }),
        },
      );

      if (!response.ok) {
        const message =
          await readErrorMessage(
            response,
            'Could not assign this table',
          );

        setError(message);
        return;
      }

      const updatedReservation:
        Reservation =
        await response.json();

      setReservation(
        updatedReservation,
      );

      setAssignModalOpen(false);
      setSelectedTableId('');

      if ('vibrate' in navigator) {
        navigator.vibrate?.(100);
      }

      await openPackageSelection();
    } catch {
      setError(
        'Cannot connect to server',
      );
    } finally {
      setAssigningTable(false);
    }
  }

  async function openPackageSelection() {
    setPackageModalOpen(true);
    setSelectedPackageId('');
    setLoadingPackages(true);
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/menu/packages`,
        {
          cache: 'no-store',
        },
      );

      if (!response.ok) {
        throw new Error(
          'Failed to load packages',
        );
      }

      const data:
        RestaurantPackage[] =
        await response.json();

      const sortedPackages = Array.isArray(
        data,
      )
        ? [...data].sort(
            (a, b) =>
              a.name.localeCompare(
                b.name,
              ),
          )
        : [];

      setPackages(
        sortedPackages,
      );
    } catch {
      setError(
        'Cannot load menu packages',
      );

      setPackageModalOpen(false);
    } finally {
      setLoadingPackages(false);
    }
  }

  async function openTable() {
    if (
      !token ||
      !selectedPackageId
    ) {
      return;
    }

    setOpeningTable(true);
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/reservations/scan/${encodeURIComponent(
          token,
        )}/open-table`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            packageId:
              selectedPackageId,
          }),
        },
      );

      if (!response.ok) {
        const message =
          await readErrorMessage(
            response,
            'Could not open table',
          );

        setError(message);
        return;
      }

      const data:
        OpenTableResponse =
        await response.json();

      if (
        !data.success ||
        !data.reservation
      ) {
        setError(
          'Server returned an invalid response',
        );
        return;
      }

      setReservation(
        data.reservation,
      );

      setOpenedPackageName(
        data.package.name,
      );

      setPackageModalOpen(false);
      setSelectedPackageId('');

      if ('vibrate' in navigator) {
        navigator.vibrate?.([
          100,
          60,
          180,
        ]);
      }
    } catch {
      setError(
        'Cannot connect to server',
      );
    } finally {
      setOpeningTable(false);
    }
  }

  function closeAssignModal() {
    if (assigningTable) return;

    setAssignModalOpen(false);
    setSelectedTableId('');
  }

  function closePackageModal() {
    if (openingTable) return;

    setPackageModalOpen(false);
    setSelectedPackageId('');
  }

  function scanAgain() {
    setToken('');
    setReservation(null);
    setStatus('');
    setError('');
    setTables([]);
    setPackages([]);
    setSelectedTableId('');
    setSelectedPackageId('');
    setAssignModalOpen(false);
    setPackageModalOpen(false);
    setOpenedPackageName('');

    setScannerKey(
      (value) => value + 1,
    );
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
            Scan the guest reservation
            QR code using the staff
            phone.
          </p>
        </header>

        {!reservation &&
          !status && (
            <Scanner
              key={scannerKey}
              onScan={handleScan}
            />
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
            reservation={
              reservation
            }
            checkingIn={
              checkingIn
            }
            openedPackageName={
              openedPackageName
            }
            onCheckIn={checkIn}
            onAssignTable={
              openAssignTable
            }
            onChoosePackage={
              openPackageSelection
            }
            onScanAgain={
              scanAgain
            }
          />
        )}

        {!reservation &&
          error && (
            <button
              type="button"
              onClick={scanAgain}
              className="mt-5 w-full rounded-2xl border border-neutral-700 px-5 py-4 font-semibold text-white transition hover:bg-neutral-900"
            >
              Scan Again
            </button>
          )}
      </div>

      {assignModalOpen && (
        <AssignTableModal
          tables={tables}
          selectedTableId={
            selectedTableId
          }
          loading={
            loadingTables
          }
          assigning={
            assigningTable
          }
          onSelect={
            setSelectedTableId
          }
          onConfirm={
            assignTable
          }
          onClose={
            closeAssignModal
          }
        />
      )}

      {packageModalOpen && (
        <PackageSelectModal
          packages={packages}
          selectedPackageId={
            selectedPackageId
          }
          loading={
            loadingPackages
          }
          opening={
            openingTable
          }
          onSelect={
            setSelectedPackageId
          }
          onConfirm={
            openTable
          }
          onClose={
            closePackageModal
          }
        />
      )}
    </main>
  );
}