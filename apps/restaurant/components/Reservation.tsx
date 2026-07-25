'use client';

import {
  useEffect,
  useMemo,
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

type AppliedPromoCode = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  maximumDiscount: number | null;
  minimumOrderAmount: number | null;
  appliesTo:
    | 'ALL'
    | 'RESERVATION'
    | 'DINE_IN'
    | 'TAKEAWAY'
    | 'DELIVERY';
  expiresAt: string | null;
};


const RESTAURANT_TIME_ZONE =
  'Europe/Amsterdam';

function getRestaurantDateTime() {
  const formatter =
    new Intl.DateTimeFormat('en-GB', {
      timeZone: RESTAURANT_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });

  const parts = formatter.formatToParts(
    new Date(),
  );

  const values = Object.fromEntries(
    parts.map((part) => [
      part.type,
      part.value,
    ]),
  );

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    minutes:
      Number(values.hour) * 60 +
      Number(values.minute),
  };
}

function timeToMinutes(value: string) {
  const [hours, minutes] =
    value.split(':').map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(
    totalMinutes / 60,
  );

  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(
    2,
    '0',
  )}:${String(minutes).padStart(
    2,
    '0',
  )}`;
}

function generateTimeSlots(
  startTime: string,
  endTime: string,
  interval: number,
) {
  const validTimePattern =
    /^([01]\d|2[0-3]):([0-5]\d)$/;

  if (
    !validTimePattern.test(startTime) ||
    !validTimePattern.test(endTime) ||
    !Number.isInteger(interval) ||
    interval < 1
  ) {
    return [];
  }

  const startMinutes =
    timeToMinutes(startTime);

  const endMinutes =
    timeToMinutes(endTime);

  if (startMinutes > endMinutes) {
    return [];
  }

  const slots: string[] = [];

  for (
    let current = startMinutes;
    current <= endMinutes;
    current += interval
  ) {
    slots.push(minutesToTime(current));
  }

  return slots;
}

const EMPTY_FORM: ReservationForm = {
  name: '',
  phone: '',
  email: '',
  guests: '2',
  date: getRestaurantDateTime().date,
  time: '',
  message: '',
};

export default function Reservation() {
  const { customer, loading: accountLoading } =
    useAccount();

const {
  restaurantOpen,
  closedMessage,
  reservationStartTime,
  reservationEndTime,
  reservationInterval,
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


  const [promoInput, setPromoInput] =
    useState('');

  const [appliedPromo, setAppliedPromo] =
    useState<AppliedPromoCode | null>(null);

  const [promoLoading, setPromoLoading] =
    useState(false);

  const [promoError, setPromoError] =
    useState('');

  const [restaurantNow, setRestaurantNow] =
    useState(() =>
      getRestaurantDateTime(),
    );

  useEffect(() => {
    const updateRestaurantNow = () => {
      setRestaurantNow(
        getRestaurantDateTime(),
      );
    };

    updateRestaurantNow();

    const timer = window.setInterval(
      updateRestaurantNow,
      30_000,
    );

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const todayDate =
    restaurantNow.date;

  const availableTimeSlots =
    useMemo(() => {
      const allSlots =
        generateTimeSlots(
          reservationStartTime,
          reservationEndTime,
          reservationInterval,
        );

      if (form.date !== todayDate) {
        return allSlots;
      }

      return allSlots.filter(
        (slot) =>
          timeToMinutes(slot) >=
          restaurantNow.minutes,
      );
    }, [
      form.date,
      todayDate,
      restaurantNow.minutes,
      reservationStartTime,
      reservationEndTime,
      reservationInterval,
    ]);

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

  useEffect(() => {
    if (
      form.date &&
      form.date < todayDate
    ) {
      setForm((current) => ({
        ...current,
        date: todayDate,
        time: '',
      }));

      return;
    }

    if (
      form.time &&
      !availableTimeSlots.includes(
        form.time,
      )
    ) {
      setForm((current) => ({
        ...current,
        time: '',
      }));
    }
  }, [
    form.date,
    form.time,
    todayDate,
    availableTimeSlots,
  ]);

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

    if (
      field === 'email' ||
      field === 'phone'
    ) {
      setAppliedPromo(null);
      setPromoError('');
    }
  }

  async function applyPromoCode() {
    const code = promoInput
      .trim()
      .toUpperCase();

    if (!code) {
      setPromoError(
        'Enter a promo code first.',
      );
      setAppliedPromo(null);
      return;
    }

    if (promoLoading || isSubmitting) {
      return;
    }

    setPromoLoading(true);
    setPromoError('');
    setAppliedPromo(null);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await fetch(
        '/api/promo-codes/validate',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            orderAmount: 0,
            appliesTo: 'RESERVATION',
            email:
              form.email.trim() ||
              undefined,
            phone:
              form.phone.trim() ||
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
              : 'Promo code could not be applied.';

        throw new Error(message);
      }

      if (
        !responseBody?.valid ||
        !responseBody?.promoCode
      ) {
        throw new Error(
          'Promo code could not be applied.',
        );
      }

      setAppliedPromo(
        responseBody.promoCode as AppliedPromoCode,
      );
      setPromoInput(
        responseBody.promoCode.code,
      );
    } catch (error) {
      setPromoError(
        error instanceof Error
          ? error.message
          : 'Promo code could not be applied.',
      );
    } finally {
      setPromoLoading(false);
    }
  }

  function removePromoCode() {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError('');
  }

  function resetFormAfterSuccess() {
    setForm({
      name: customer?.name || '',
      phone: customer?.phone || '',
      email: customer?.email || '',
      guests: '2',
      date: getRestaurantDateTime().date,
      time: '',
      message: '',
    });

    setPromoInput('');
    setAppliedPromo(null);
    setPromoError('');
  }

  async function submitReservation(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (form.date < todayDate) {
      setSuccessMessage('');
      setErrorMessage(
        'Past reservation dates are not available.',
      );
      return;
    }

    if (
      !availableTimeSlots.includes(
        form.time,
      )
    ) {
      setSuccessMessage('');
      setErrorMessage(
        'Please select an available reservation time.',
      );
      return;
    }

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
            promoCode:
              appliedPromo?.code ||
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
                min={todayDate}
                disabled={formDisabled}
                onChange={(value) => {
                  setForm((current) => ({
                    ...current,
                    date: value,
                    time: '',
                  }));

                  setSuccessMessage('');
                  setErrorMessage('');
                }}
              />

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                  Time
                </span>

                <select
                  required
                  value={form.time}
                  disabled={
                    formDisabled ||
                    !form.date ||
                    availableTimeSlots.length === 0
                  }
                  onChange={(event) =>
                    updateField(
                      'time',
                      event.target.value,
                    )
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-white outline-none transition focus:border-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {availableTimeSlots.length > 0
                      ? 'Select a time'
                      : 'No available times'}
                  </option>

                  {availableTimeSlots.map(
                    (time) => (
                      <option
                        key={time}
                        value={time}
                      >
                        {time}
                      </option>
                    ),
                  )}
                </select>
              </label>
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

            <PromoCodeField
              value={promoInput}
              appliedPromo={appliedPromo}
              loading={promoLoading}
              disabled={formDisabled}
              error={promoError}
              onChange={(value) => {
                setPromoInput(
                  value
                    .toUpperCase()
                    .replace(
                      /[^A-Z0-9_-]/g,
                      '',
                    ),
                );
                setAppliedPromo(null);
                setPromoError('');
              }}
              onApply={() =>
                void applyPromoCode()
              }
              onRemove={removePromoCode}
            />

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

function PromoCodeField({
  value,
  appliedPromo,
  loading,
  disabled,
  error,
  onChange,
  onApply,
  onRemove,
}: {
  value: string;
  appliedPromo: AppliedPromoCode | null;
  loading: boolean;
  disabled: boolean;
  error: string;
  onChange: (value: string) => void;
  onApply: () => void;
  onRemove: () => void;
}) {
  const discountLabel =
    appliedPromo?.discountType ===
    'PERCENTAGE'
      ? `${appliedPromo.discountValue}% discount`
      : appliedPromo
        ? `${new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: 'EUR',
          }).format(
            appliedPromo.discountValue,
          )} discount`
        : '';

  return (
    <div className="mt-4">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
        Promo code
      </span>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !appliedPromo
            ) {
              event.preventDefault();
              onApply();
            }
          }}
          placeholder="WELCOME10"
          autoComplete="off"
          disabled={
            disabled ||
            loading ||
            Boolean(appliedPromo)
          }
          className={[
            'min-h-14 min-w-0 flex-1 rounded-2xl border bg-black/50 px-5 py-4 font-black uppercase tracking-[0.12em] text-white outline-none transition placeholder:font-normal placeholder:tracking-normal placeholder:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-70',
            appliedPromo
              ? 'border-green-500/40'
              : error
                ? 'border-red-500/50'
                : 'border-white/10 focus:border-amber-300',
          ].join(' ')}
        />

        {appliedPromo ? (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="min-h-14 rounded-2xl border border-white/10 px-6 text-sm font-black uppercase tracking-[0.14em] text-zinc-300 transition hover:border-red-400/30 hover:bg-red-500/[0.08] hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Remove
          </button>
        ) : (
          <button
            type="button"
            onClick={onApply}
            disabled={
              disabled ||
              loading ||
              !value.trim()
            }
            className="min-h-14 rounded-2xl border border-amber-300/25 bg-amber-300/[0.08] px-7 text-sm font-black uppercase tracking-[0.14em] text-amber-200 transition hover:bg-amber-300/[0.14] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? 'Checking...' : 'Apply'}
          </button>
        )}
      </div>

      {appliedPromo && (
        <div className="mt-3 rounded-2xl border border-green-500/25 bg-green-500/[0.08] px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-300 text-xs font-black text-green-950">
              ✓
            </span>

            <div>
              <p className="font-black text-green-200">
                Promo code applied
              </p>

              <p className="mt-1 text-sm font-bold text-white">
                {appliedPromo.name} ·{' '}
                {discountLabel}
              </p>

              {appliedPromo.description && (
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  {appliedPromo.description}
                </p>
              )}

              {appliedPromo.expiresAt && (
                <p className="mt-2 text-xs text-zinc-600">
                  Valid until{' '}
                  {new Date(
                    appliedPromo.expiresAt,
                  ).toLocaleDateString(
                    'nl-NL',
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {error && !appliedPromo && (
        <div className="mt-3 rounded-2xl border border-red-500/25 bg-red-500/[0.08] px-5 py-4 text-sm leading-6 text-red-200">
          {error}
        </div>
      )}
    </div>
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