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
  updatedAt?: string;
};

type RestaurantSettingsContextValue = {
  restaurantOpen: boolean;
  closedMessage: string;
  loading: boolean;
  error: string;
  refreshSettings: () => Promise<void>;
};

const DEFAULT_CLOSED_MESSAGE =
  'DaWu Sushi Fusion is temporarily closed. Reservations and online ordering are currently unavailable.';

const RestaurantSettingsContext =
  createContext<RestaurantSettingsContextValue | null>(
    null,
  );

async function readResponseError(
  response: Response,
  fallback: string,
) {
  const data = await response.json().catch(() => null);

  if (typeof data?.message === 'string') {
    return data.message;
  }

  if (Array.isArray(data?.message)) {
    return data.message.join(', ');
  }

  return fallback;
}

export function RestaurantSettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [restaurantOpen, setRestaurantOpen] =
    useState(false);

  const [closedMessage, setClosedMessage] =
    useState(DEFAULT_CLOSED_MESSAGE);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshSettings = useCallback(async () => {
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
    } catch (loadError) {
      console.error(
        'Restaurant settings load failed:',
        loadError,
      );

      setRestaurantOpen(false);
      setClosedMessage(DEFAULT_CLOSED_MESSAGE);

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
        loading,
        error,
        refreshSettings,
      }),
      [
        restaurantOpen,
        closedMessage,
        loading,
        error,
        refreshSettings,
      ],
    );

  return (
    <RestaurantSettingsContext.Provider value={value}>
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