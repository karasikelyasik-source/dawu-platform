'use client';

import {
  FormEvent,
  useEffect,
  useState,
} from 'react';

import { useAccount } from './AccountProvider';

type AuthMode = 'login' | 'register';

type Props = {
  onClose: () => void;
};

export default function AuthModal({ onClose }: Props) {
  const { login, register } = useAccount();

  const [mode, setMode] = useState<AuthMode>('login');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  async function submitLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await login(loginForm);
      onClose();
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'Could not log in',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function submitRegister(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    if (
      registerForm.password !==
      registerForm.confirmPassword
    ) {
      setError('Passwords do not match');
      return;
    }

    if (registerForm.password.length < 8) {
      setError(
        'Password must contain at least 8 characters',
      );
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await register({
        name: registerForm.name,
        email: registerForm.email,
        phone: registerForm.phone,
        password: registerForm.password,
      });

      onClose();
    } catch (registerError) {
      setError(
        registerError instanceof Error
          ? registerError.message
          : 'Could not create account',
      );
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError('');
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-t-[32px] border border-white/10 bg-[#0d0b0a] p-6 shadow-2xl sm:rounded-[32px] sm:p-8">
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/20 sm:hidden" />

        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300">
              DaWu Account
            </p>

            <h2 className="mt-3 text-3xl font-black text-white">
              {mode === 'login'
                ? 'Welcome back.'
                : 'Create your account.'}
            </h2>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              {mode === 'login'
                ? 'Log in to view your reservations and orders.'
                : 'Keep your DaWu activity in one account.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close account window"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-2xl text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            ×
          </button>
        </div>

        <div className="mt-7 grid grid-cols-2 rounded-2xl border border-white/10 bg-black p-1.5">
          <button
            type="button"
            onClick={() => switchMode('login')}
            disabled={submitting}
            className={[
              'rounded-xl px-4 py-3 text-sm font-black uppercase tracking-[0.16em] transition',
              mode === 'login'
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-white',
            ].join(' ')}
          >
            Log In
          </button>

          <button
            type="button"
            onClick={() => switchMode('register')}
            disabled={submitting}
            className={[
              'rounded-xl px-4 py-3 text-sm font-black uppercase tracking-[0.16em] transition',
              mode === 'register'
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-white',
            ].join(' ')}
          >
            Register
          </button>
        </div>

        {mode === 'login' ? (
          <form
            onSubmit={submitLogin}
            className="mt-6 space-y-4"
          >
            <Field
              label="Email"
              type="email"
              value={loginForm.email}
              placeholder="your@email.com"
              autoComplete="email"
              disabled={submitting}
              onChange={(value) =>
                setLoginForm((current) => ({
                  ...current,
                  email: value,
                }))
              }
            />

            <Field
              label="Password"
              type="password"
              value={loginForm.password}
              placeholder="Your password"
              autoComplete="current-password"
              disabled={submitting}
              onChange={(value) =>
                setLoginForm((current) => ({
                  ...current,
                  password: value,
                }))
              }
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-amber-300 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-black transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        ) : (
          <form
            onSubmit={submitRegister}
            className="mt-6 space-y-4"
          >
            <Field
              label="Name"
              value={registerForm.name}
              placeholder="Your full name"
              autoComplete="name"
              disabled={submitting}
              onChange={(value) =>
                setRegisterForm((current) => ({
                  ...current,
                  name: value,
                }))
              }
            />

            <Field
              label="Email"
              type="email"
              value={registerForm.email}
              placeholder="your@email.com"
              autoComplete="email"
              disabled={submitting}
              onChange={(value) =>
                setRegisterForm((current) => ({
                  ...current,
                  email: value,
                }))
              }
            />

            <Field
              label="Phone"
              type="tel"
              value={registerForm.phone}
              placeholder="+31..."
              autoComplete="tel"
              required={false}
              disabled={submitting}
              onChange={(value) =>
                setRegisterForm((current) => ({
                  ...current,
                  phone: value,
                }))
              }
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Password"
                type="password"
                value={registerForm.password}
                placeholder="Create password"
                autoComplete="new-password"
                disabled={submitting}
                onChange={(value) =>
                  setRegisterForm((current) => ({
                    ...current,
                    password: value,
                  }))
                }
              />

              <Field
                label="Confirm"
                type="password"
                value={registerForm.confirmPassword}
                placeholder="Repeat password"
                autoComplete="new-password"
                disabled={submitting}
                onChange={(value) =>
                  setRegisterForm((current) => ({
                    ...current,
                    confirmPassword: value,
                  }))
                }
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-amber-300 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-black transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? 'Creating account...'
                : 'Create Account'}
            </button>
          </form>
        )}

        {error && (
          <div className="mt-5 rounded-2xl border border-red-800/60 bg-red-950/40 px-5 py-4 text-sm text-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
};

function Field({
  label,
  value,
  placeholder,
  type = 'text',
  autoComplete,
  required = true,
  disabled = false,
  onChange,
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </span>

      <input
        required={required}
        disabled={disabled}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-black/60 px-5 py-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}