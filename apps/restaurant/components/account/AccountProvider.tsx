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

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;

  role: 'CUSTOMER' | 'ADMIN' | 'OWNER';

  isBlocked: boolean;
  blockedReason?: string | null;
  mustChangePassword: boolean;

  createdAt: string;
  updatedAt: string;
};

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  name: string;
  email: string;
  phone?: string;
  password: string;
};

type AccountContextValue = {
  customer: Customer | null;
  loading: boolean;
  login: (data: LoginData) => Promise<Customer>;
  register: (data: RegisterData) => Promise<Customer>;
  logout: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
};

const AccountContext = createContext<AccountContextValue | null>(
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

export function AccountProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [loading, setLoading] = useState(true);

  const refreshCustomer = useCallback(async () => {
    try {
      const response = await fetch('/api/customer/me', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (response.status === 401) {
        setCustomer(null);
        return;
      }

      if (!response.ok) {
        throw new Error(
          await readResponseError(
            response,
            'Could not load customer account',
          ),
        );
      }

      const data: Customer = await response.json();
      setCustomer(data);
    } catch (error) {
      console.error('Customer session check failed:', error);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCustomer();
  }, [refreshCustomer]);

  async function login(data: LoginData) {
    const response = await fetch('/api/customer/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email.trim(),
        password: data.password,
      }),
    });

    if (!response.ok) {
      throw new Error(
        await readResponseError(
          response,
          'Could not log in',
        ),
      );
    }

    const result = await response.json();
    const loggedInCustomer = result.customer as Customer;

    setCustomer(loggedInCustomer);

    return loggedInCustomer;
  }

  async function register(data: RegisterData) {
    const response = await fetch('/api/customer/register', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || undefined,
        password: data.password,
      }),
    });

    if (!response.ok) {
      throw new Error(
        await readResponseError(
          response,
          'Could not create account',
        ),
      );
    }

    const result = await response.json();
    const registeredCustomer = result.customer as Customer;

    setCustomer(registeredCustomer);

    return registeredCustomer;
  }

  async function logout() {
    try {
      const response = await fetch('/api/customer/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(
          await readResponseError(
            response,
            'Could not log out',
          ),
        );
      }
    } finally {
      setCustomer(null);
    }
  }

  const value = useMemo<AccountContextValue>(
    () => ({
      customer,
      loading,
      login,
      register,
      logout,
      refreshCustomer,
    }),
    [customer, loading, refreshCustomer],
  );

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);

  if (!context) {
    throw new Error(
      'useAccount must be used inside AccountProvider',
    );
  }

  return context;
}