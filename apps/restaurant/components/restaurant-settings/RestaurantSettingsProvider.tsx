'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type RestaurantSettings = {
  restaurantOpen: boolean;
  closedMessage: string;
  reservationStartTime: string;
  reservationEndTime: string;
  reservationInterval: number;
  updatedAt?: string;
};

type RestaurantSettingsContextValue = {
  restaurantOpen: boolean;
  closedMessage: string;
  reservationStartTime: string;
  reservationEndTime: string;
  reservationInterval: number;
  loading: boolean;
  error: string;
  refreshSettings: () => Promise<void>;
};

const DEFAULT_CLOSED_MESSAGE =
  'DaWu Sushi Fusion is temporarily closed. Reservations and online ordering are currently unavailable.';

const DEFAULT_RESERVATION_START_TIME =
  '16:00';

const DEFAULT_RESERVATION_END_TIME =
  '22:00';

const DEFAULT_RESERVATION_INTERVAL =
  15;

const RestaurantSettingsContext =
  createContext<RestaurantSettingsContextValue | null>(
    null,
  );

async function readResponseError(
  response: Response,
  fallback: string,
) {
  const data = await response
    .json()
    .catch(() => null);

  if (
    typeof data?.message ===
    'string'
  ) {
    return data.message;
  }

  if (
    Array.isArray(data?.message)
  ) {
    return data.message.join(', ');
  }

  return fallback;
}

function isValidTime(
  value: unknown,
): value is string {
  return (
    typeof value === 'string' &&
    /^([01]\d|2[0-3]):([0-5]\d)$/.test(
      value,
    )
  );
}

function isValidInterval(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 5 &&
    value <= 60
  );
}

export function RestaurantSettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    restaurantOpen,
    setRestaurantOpen,
  ] = useState(false);

  const [
    closedMessage,
    setClosedMessage,
  ] = useState(
    DEFAULT_CLOSED_MESSAGE,
  );

  const [
    reservationStartTime,
    setReservationStartTime,
  ] = useState(
    DEFAULT_RESERVATION_START_TIME,
  );

  const [
    reservationEndTime,
    setReservationEndTime,
  ] = useState(
    DEFAULT_RESERVATION_END_TIME,
  );

  const [
    reservationInterval,
    setReservationInterval,
  ] = useState(
    DEFAULT_RESERVATION_INTERVAL,
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const refreshSettings =
    useCallback(async () => {
      setError('');

      try {
        const response = await fetch(
          '/api/restaurant-settings/public',
          {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          },
        );

        if (!response.ok) {
          throw new Error(
            await readResponseError(
              response,
              'Could not load restaurant settings.',
            ),
          );
        }

        const data =
          (await response.json()) as RestaurantSettings;

        setRestaurantOpen(
          data.restaurantOpen === true,
        );

        setClosedMessage(
          data.closedMessage?.trim() ||
            DEFAULT_CLOSED_MESSAGE,
        );

        setReservationStartTime(
          isValidTime(
            data.reservationStartTime,
          )
            ? data.reservationStartTime
            : DEFAULT_RESERVATION_START_TIME,
        );

        setReservationEndTime(
          isValidTime(
            data.reservationEndTime,
          )
            ? data.reservationEndTime
            : DEFAULT_RESERVATION_END_TIME,
        );

        setReservationInterval(
          isValidInterval(
            data.reservationInterval,
          )
            ? data.reservationInterval
            : DEFAULT_RESERVATION_INTERVAL,
        );
      } catch (loadError) {
        console.error(
          'Restaurant settings load failed:',
          loadError,
        );

        setRestaurantOpen(false);

        setClosedMessage(
          DEFAULT_CLOSED_MESSAGE,
        );

        setReservationStartTime(
          DEFAULT_RESERVATION_START_TIME,
        );

        setReservationEndTime(
          DEFAULT_RESERVATION_END_TIME,
        );

        setReservationInterval(
          DEFAULT_RESERVATION_INTERVAL,
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Could not load restaurant settings.',
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  const value =
    useMemo<RestaurantSettingsContextValue>(
      () => ({
        restaurantOpen,
        closedMessage,
        reservationStartTime,
        reservationEndTime,
        reservationInterval,
        loading,
        error,
        refreshSettings,
      }),
      [
        restaurantOpen,
        closedMessage,
        reservationStartTime,
        reservationEndTime,
        reservationInterval,
        loading,
        error,
        refreshSettings,
      ],
    );

  return (
    <RestaurantSettingsContext.Provider
      value={value}
    >
      {children}
    </RestaurantSettingsContext.Provider>
  );
}

export function useRestaurantSettings() {
  const context = useContext(
    RestaurantSettingsContext,
  );

  if (!context) {
    throw new Error(
      'useRestaurantSettings must be used inside RestaurantSettingsProvider',
    );
  }

  return context;
}