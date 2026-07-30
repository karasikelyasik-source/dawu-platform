import { Image as ImageIcon } from 'lucide-react';

import type { PromoCode } from '../lib/marketing-types';

type EmailPreviewProps = {
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  buttonText?: string | null;
  buttonUrl?: string | null;
  imageUrl?: string | null;
  promoCode?: PromoCode | null;
  promoCodeText?: string | null;
};

export default function EmailPreview({
  title,
  subtitle,
  body,
  buttonText,
  buttonUrl,
  imageUrl,
  promoCode,
  promoCodeText,
}: EmailPreviewProps) {
  const previewTitle =
    title?.trim() || 'Your campaign title';

  const previewSubtitle =
    subtitle?.trim() ||
    'Add a short subtitle to support your campaign message.';

  const previewBody =
    body?.trim() ||
    'Your email content will appear here while you build the campaign.';

  const displayedPromoCode =
    promoCode?.code || promoCodeText?.trim() || '';

  return (
    <div className="bg-zinc-200 p-4 sm:p-6">
      <div className="mx-auto max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="bg-zinc-950 px-6 py-5 text-center">
          <div className="text-lg font-black tracking-[0.18em] text-white">
            DAWU
          </div>

          <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-amber-400">
            Sushi Fusion
          </div>
        </div>

        {imageUrl?.trim() ? (
          <img
            src={imageUrl}
            alt=""
            className="h-56 w-full object-cover"
          />
        ) : (
          <div className="flex h-48 items-center justify-center bg-zinc-100 text-zinc-400">
            <div className="text-center">
              <ImageIcon size={30} className="mx-auto" />

              <div className="mt-2 text-xs font-bold">
                Campaign image
              </div>
            </div>
          </div>
        )}

        <div className="px-7 py-8 text-center sm:px-10">
          <div className="text-3xl font-black leading-tight text-zinc-950">
            {previewTitle}
          </div>

          <div className="mt-3 text-base leading-6 text-zinc-500">
            {previewSubtitle}
          </div>

          <div className="mt-6 whitespace-pre-line text-sm leading-7 text-zinc-600">
            {previewBody}
          </div>

          {buttonText?.trim() && (
            <div className="mt-8">
              {buttonUrl?.trim() ? (
                <a
                  href={buttonUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-xl bg-zinc-950 px-6 py-3 text-sm font-black text-white"
                >
                  {buttonText}
                </a>
              ) : (
                <span className="inline-flex rounded-xl bg-zinc-950 px-6 py-3 text-sm font-black text-white">
                  {buttonText}
                </span>
              )}
            </div>
          )}

          {displayedPromoCode && (
            <div className="mt-7 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 px-5 py-4">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">
                Promo code
              </div>

              <div className="mt-2 font-mono text-xl font-black tracking-wider text-zinc-900">
                {displayedPromoCode}
              </div>

              {promoCode && (
                <div className="mt-2 text-xs font-bold text-zinc-500">
                  {promoCode.discountValue}{' '}
                  {promoCode.discountType === 'PERCENTAGE'
                    ? '% discount'
                    : 'discount'}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-5 text-center text-[11px] leading-5 text-zinc-400">
          DaWu Sushi Fusion · Beverwijk, Netherlands
          <br />
          You received this email because you are a DaWu customer.
        </div>
      </div>
    </div>
  );
}