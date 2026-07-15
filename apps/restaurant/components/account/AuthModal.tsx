'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useAccount } from './AccountProvider';

type AuthMode = 'login' | 'register';

type Props = {
  onClose: () => void;
};

export default function AuthModal({ onClose }: Props) {
  const { login, register } = useAccount();

  const [mounted, setMounted] = useState(false);
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
    setMounted(true);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting) {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      setMounted(false);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, submitting]);

  async function submitLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setError('');

    try {
      await login({
        email: loginForm.email,
        password: loginForm.password,
      });

      onClose();
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'Could not log in. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function submitRegister(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (submitting) return;

    const name = registerForm.name.trim();
    const email = registerForm.email.trim();
    const phone = registerForm.phone.trim();

    if (!name) {
      setError('Please enter your name.');
      return;
    }

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    if (registerForm.password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (
      registerForm.password !==
      registerForm.confirmPassword
    ) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await register({
        name,
        email,
        phone,
        password: registerForm.password,
      });

      onClose();
    } catch (registerError) {
      setError(
        registerError instanceof Error
          ? registerError.message
          : 'Could not create your account. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(nextMode: AuthMode) {
    if (submitting) return;

    setMode(nextMode);
    setError('');
  }

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/85 backdrop-blur-md"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !submitting
        ) {
          onClose();
        }
      }}
    >
      <div className="flex min-h-dvh items-center justify-center p-4 sm:p-6">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="dawu-account-title"
          onMouseDown={(event) => event.stopPropagation()}
          className="relative my-4 w-full max-w-[560px] overflow-hidden rounded-[30px] border border-white/10 bg-[#0c0a09] shadow-[0_35px_120px_rgba(0,0,0,0.75)]"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-amber-300/[0.08] to-transparent" />

          <div className="relative max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="sticky top-0 z-10 border-b border-white/[0.08] bg-[#0c0a09]/95 px-6 pb-5 pt-6 backdrop-blur-xl sm:px-8 sm:pt-8">
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.32em] text-amber-300">
                    DaWu Account
                  </p>

                  <h2
                    id="dawu-account-title"
                    className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl"
                  >
                    {mode === 'login'
                      ? 'Welcome back.'
                      : 'Join DaWu.'}
                  </h2>

                  <p className="mt-3 max-w-md text-sm leading-6 text-zinc-400">
                    {mode === 'login'
                      ? 'Log in to manage your reservations, takeaway orders and deliveries.'
                      : 'Create your account and keep everything from DaWu in one place.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  aria-label="Close account window"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-2xl leading-none text-zinc-400 transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ×
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 rounded-2xl border border-white/10 bg-black/70 p-1.5">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => switchMode('login')}
                  className={[
                    'rounded-xl px-4 py-3 text-xs font-black uppercase tracking-[0.18em] transition sm:text-sm',
                    mode === 'login'
                      ? 'bg-white text-black shadow-lg'
                      : 'text-zinc-500 hover:bg-white/[0.05] hover:text-white',
                  ].join(' ')}
                >
                  Log In
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => switchMode('register')}
                  className={[
                    'rounded-xl px-4 py-3 text-xs font-black uppercase tracking-[0.18em] transition sm:text-sm',
                    mode === 'register'
                      ? 'bg-white text-black shadow-lg'
                      : 'text-zinc-500 hover:bg-white/[0.05] hover:text-white',
                  ].join(' ')}
                >
                  Register
                </button>
              </div>
            </div>

            <div className="px-6 py-6 sm:px-8 sm:py-8">
              {mode === 'login' ? (
                <form
                  onSubmit={submitLogin}
                  className="space-y-5"
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

                  <div className="flex items-center justify-between gap-4">
                    <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-500">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-white/20 bg-black accent-amber-300"
                      />
                      Remember me
                    </label>

                    <button
                      type="button"
                      className="text-sm font-bold text-amber-300 transition hover:text-amber-200"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <SubmitButton
                    loading={submitting}
                    idleText="Log In"
                    loadingText="Logging in..."
                  />

                  <p className="text-center text-sm text-zinc-500">
                    New to DaWu?{' '}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => switchMode('register')}
                      className="font-bold text-white transition hover:text-amber-300"
                    >
                      Create an account
                    </button>
                  </p>
                </form>
              ) : (
                <form
                  onSubmit={submitRegister}
                  className="space-y-5"
                >
                  <Field
                    label="Full name"
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
                    placeholder="+31 6 12 34 56 78"
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

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label="Password"
                      type="password"
                      value={registerForm.password}
                      placeholder="At least 8 characters"
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
                      label="Confirm password"
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

                  <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-zinc-500">
                    <input
                      required
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 bg-black accent-amber-300"
                    />

                    <span>
                      I agree to the terms of service and privacy
                      policy.
                    </span>
                  </label>

                  <SubmitButton
                    loading={submitting}
                    idleText="Create Account"
                    loadingText="Creating account..."
                  />

                  <p className="text-center text-sm text-zinc-500">
                    Already have an account?{' '}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => switchMode('login')}
                      className="font-bold text-white transition hover:text-amber-300"
                    >
                      Log in
                    </button>
                  </p>
                </form>
              )}

              {error && (
                <div
                  role="alert"
                  className="mt-5 rounded-2xl border border-red-500/25 bg-red-500/10 px-5 py-4 text-sm leading-6 text-red-200"
                >
                  {error}
                </div>
              )}

              <div className="mt-7 grid grid-cols-3 gap-2 border-t border-white/[0.08] pt-6 sm:gap-3">
                <Feature title="Reservations" />
                <Feature title="Take Away" />
                <Feature title="Delivery" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>,
    document.body,
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
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
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
        className="h-14 w-full rounded-2xl border border-white/10 bg-black/60 px-5 text-base text-white outline-none transition placeholder:text-zinc-700 hover:border-white/20 focus:border-amber-300 focus:ring-4 focus:ring-amber-300/10 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </label>
  );
}

function SubmitButton({
  loading,
  idleText,
  loadingText,
}: {
  loading: boolean;
  idleText: string;
  loadingText: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex h-14 w-full items-center justify-center rounded-2xl bg-amber-300 px-6 text-sm font-black uppercase tracking-[0.2em] text-black transition hover:-translate-y-0.5 hover:bg-amber-200 hover:shadow-[0_14px_40px_rgba(252,211,77,0.2)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50"
    >
      {loading ? (
        <span className="flex items-center gap-3">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
          {loadingText}
        </span>
      ) : (
        idleText
      )}
    </button>
  );
}

function Feature({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-2 py-3 text-center text-[10px] font-black uppercase tracking-[0.1em] text-zinc-500 sm:text-xs">
      {title}
    </div>
  );
}