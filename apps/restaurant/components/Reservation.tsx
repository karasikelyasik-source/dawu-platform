'use client';

import {
  useEffect,
  useState,
} from 'react';

import { useAccount } from './account/AccountProvider';
import { useRestaurantSettings } from './restaurant-settings/RestaurantSettingsProvider';
import Container from './ui/Container';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';

type ReservationForm = {
  name: string;
  phone: string;
  email: string;
  guests: string;
  date: string;
  time: string;
  message: string;
};

const EMPTY_FORM: ReservationForm = {
  name: '',
  phone: '',
  email: '',
  guests: '2',
  date: '',
  time: '',
  message: '',
};

export default function Reservation() {
  const { customer, loading: accountLoading } =
    useAccount();

const {
  restaurantOpen,
  closedMessage,
  loading: settingsLoading,
} = useRestaurantSettings();

const hasAdminAccess =
  customer?.role === 'ADMIN' ||
  customer?.role === 'OWNER';

const reservationAvailable =
  restaurantOpen || hasAdminAccess;
  
  const [form, setForm] =
    useState<ReservationForm>(EMPTY_FORM);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState('');

  const [errorMessage, setErrorMessage] =
    useState('');

  useEffect(() => {
    if (!customer) {
      return;
    }

    setForm((current) => ({
      ...current,
      name:
        current.name.trim() ||
        customer.name ||
        '',
      email:
        current.email.trim() ||
        customer.email ||
        '',
      phone:
        current.phone.trim() ||
        customer.phone ||
        '',
    }));
  }, [customer]);

  function updateField(
    field: keyof ReservationForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSuccessMessage('');
    setErrorMessage('');
  }

  function resetFormAfterSuccess() {
    setForm({
      name: customer?.name || '',
      phone: customer?.phone || '',
      email: customer?.email || '',
      guests: '2',
      date: '',
      time: '',
      message: '',
    });
  }

  async function submitReservation(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await fetch(
        '/api/public/reservations',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: form.name.trim(),
            phone: form.phone.trim(),
            email:
              form.email.trim() ||
              undefined,
            guests: Number(form.guests),
            date: form.date,
            time: form.time,
            message:
              form.message.trim() ||
              undefined,
          }),
        },
      );

      const responseBody = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        const message =
          typeof responseBody?.message ===
          'string'
            ? responseBody.message
            : Array.isArray(
                  responseBody?.message,
                )
              ? responseBody.message.join(
                  ', ',
                )
              : 'Reservation could not be created. Please try again.';

        throw new Error(message);
      }

      const linkedToAccount =
        Boolean(
          responseBody?.linkedToAccount,
        );

      setSuccessMessage(
        linkedToAccount
          ? 'Your reservation has been confirmed and added to My Reservations. Please check your email for the QR code.'
          : 'Your reservation has been confirmed. Please check your email for the QR code.',
      );

      resetFormAfterSuccess();
    } catch (error) {
      console.error(
        'Reservation creation failed:',
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Could not connect to the server. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

const formDisabled =
  isSubmitting ||
  accountLoading ||
  settingsLoading;

  return (
    <Section
      id="reservation"
      className="bg-[#070504] text-white"
    >
      <Container>
        <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <SectionTitle
              subtitle="Reservation"
              title="Reserve your table at DaWu."
              description="Book your table online and receive your confirmation and QR code by email."
            />

            {customer && (
              <div className="mt-7 rounded-[26px] border border-amber-300/20 bg-amber-300/[0.06] p-5">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-300">
                  Signed in
                </p>

                <p className="mt-2 text-lg font-black text-white">
                  {customer.name}
                </p>

                <p className="mt-1 text-sm text-zinc-400">
                  This reservation will
                  automatically appear in My
                  Reservations.
                </p>
              </div>
            )}
          </div>

{reservationAvailable ? (

          <form
            onSubmit={submitReservation}
            className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur sm:p-8"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Name"
                value={form.name}
                placeholder="Your name"
                autoComplete="name"
                disabled={formDisabled}
                onChange={(value) =>
                  updateField(
                    'name',
                    value,
                  )
                }
              />

              <Field
                label="Phone"
                value={form.phone}
                placeholder="+31..."
                type="tel"
                autoComplete="tel"
                disabled={formDisabled}
                onChange={(value) =>
                  updateField(
                    'phone',
                    value,
                  )
                }
              />

              <Field
                label="Email"
                value={form.email}
                placeholder="your@email.com"
                type="email"
                autoComplete="email"
                disabled={formDisabled}
                onChange={(value) =>
                  updateField(
                    'email',
                    value,
                  )
                }
              />

              <Field
                label="Guests"
                value={form.guests}
                placeholder="2"
                type="number"
                min="1"
                max="50"
                disabled={formDisabled}
                onChange={(value) =>
                  updateField(
                    'guests',
                    value,
                  )
                }
              />

              <Field
                label="Date"
                value={form.date}
                placeholder=""
                type="date"
                disabled={formDisabled}
                onChange={(value) =>
                  updateField(
                    'date',
                    value,
                  )
                }
              />

              <Field
                label="Time"
                value={form.time}
                placeholder=""
                type="time"
                disabled={formDisabled}
                onChange={(value) =>
                  updateField(
                    'time',
                    value,
                  )
                }
              />
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                Special request
              </span>

              <textarea
                value={form.message}
                onChange={(event) =>
                  updateField(
                    'message',
                    event.target.value,
                  )
                }
                placeholder="Allergies, accessibility, birthday..."
                rows={5}
                disabled={formDisabled}
                className="w-full resize-none rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            {successMessage && (
              <div className="mt-5 rounded-2xl border border-green-700/50 bg-green-950/40 px-5 py-4 text-sm leading-6 text-green-200">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="mt-5 rounded-2xl border border-red-800/60 bg-red-950/40 px-5 py-4 text-sm leading-6 text-red-200">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={formDisabled}
              className="mt-6 flex min-h-14 w-full items-center justify-center rounded-full bg-amber-300 px-9 py-4 text-sm font-black uppercase tracking-[0.2em] text-black transition hover:-translate-y-0.5 hover:bg-amber-200 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
            >
              {accountLoading || settingsLoading
                ? 'Loading account...'
                : isSubmitting
                  ? 'Creating reservation...'
                  : 'Reserve a Table'}
            </button>
          </form>

          ) : (
  <div className="rounded-[2rem] border border-amber-300/20 bg-amber-300/[0.05] p-8">
    <div className="flex items-center gap-3">
      <div className="h-3 w-3 rounded-full bg-red-500" />

      <p className="text-sm font-black uppercase tracking-[0.25em] text-amber-300">
        Temporarily Closed
      </p>
    </div>

    <h3 className="mt-6 text-3xl font-black text-white">
      Reservations are unavailable
    </h3>

<p className="mt-4 leading-8 text-zinc-400">
  {closedMessage}
</p>

{hasAdminAccess && (
  <p className="mt-4 text-sm font-bold text-green-300">
    Admin access enabled — reservations remain available for testing.
  </p>
  )}
   </div>
)}
        </div>
      </Container>
    </Section>
  );
}

type FieldProps = {
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
};

function Field({
  label,
  value,
  placeholder,
  type = 'text',
  autoComplete,
  disabled = false,
  min,
  max,
  onChange,
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </span>

      <input
        required
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        type={type}
        autoComplete={autoComplete}
        disabled={disabled}
        min={min}
        max={max}
        className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}