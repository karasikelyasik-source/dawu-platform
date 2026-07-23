CREATE TYPE "PromoDiscountType" AS ENUM (
  'PERCENTAGE',
  'FIXED_AMOUNT'
);

CREATE TYPE "PromoAppliesTo" AS ENUM (
  'ALL',
  'RESERVATION',
  'DINE_IN',
  'TAKEAWAY',
  'DELIVERY'
);

CREATE TABLE "PromoCode" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "discountType" "PromoDiscountType" NOT NULL,
  "discountValue" DOUBLE PRECISION NOT NULL,
  "maximumDiscount" DOUBLE PRECISION,
  "minimumOrderAmount" DOUBLE PRECISION,
  "appliesTo" "PromoAppliesTo" NOT NULL DEFAULT 'ALL',
  "startsAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "usageLimit" INTEGER,
  "usageLimitPerCustomer" INTEGER NOT NULL DEFAULT 1,
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "firstOrderOnly" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "deletedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PromoCode_pkey"
  PRIMARY KEY ("id")
);

CREATE TABLE "PromoCodeUsage" (
  "id" TEXT NOT NULL,
  "promoCodeId" TEXT NOT NULL,
  "customerId" TEXT,
  "reservationId" TEXT,
  "orderAmount" DOUBLE PRECISION NOT NULL,
  "discountAmount" DOUBLE PRECISION NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PromoCodeUsage_pkey"
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromoCode_code_key"
ON "PromoCode"("code");

CREATE INDEX "PromoCode_isActive_idx"
ON "PromoCode"("isActive");

CREATE INDEX "PromoCode_expiresAt_idx"
ON "PromoCode"("expiresAt");

CREATE INDEX "PromoCode_deletedAt_idx"
ON "PromoCode"("deletedAt");

CREATE INDEX "PromoCode_createdById_idx"
ON "PromoCode"("createdById");

CREATE INDEX "PromoCodeUsage_promoCodeId_idx"
ON "PromoCodeUsage"("promoCodeId");

CREATE INDEX "PromoCodeUsage_customerId_idx"
ON "PromoCodeUsage"("customerId");

CREATE INDEX "PromoCodeUsage_reservationId_idx"
ON "PromoCodeUsage"("reservationId");

CREATE INDEX "PromoCodeUsage_email_idx"
ON "PromoCodeUsage"("email");

CREATE INDEX "PromoCodeUsage_phone_idx"
ON "PromoCodeUsage"("phone");

CREATE INDEX "PromoCodeUsage_usedAt_idx"
ON "PromoCodeUsage"("usedAt");

ALTER TABLE "PromoCode"
ADD CONSTRAINT "PromoCode_createdById_fkey"
FOREIGN KEY ("createdById")
REFERENCES "Customer"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "PromoCodeUsage"
ADD CONSTRAINT "PromoCodeUsage_promoCodeId_fkey"
FOREIGN KEY ("promoCodeId")
REFERENCES "PromoCode"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "PromoCodeUsage"
ADD CONSTRAINT "PromoCodeUsage_customerId_fkey"
FOREIGN KEY ("customerId")
REFERENCES "Customer"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "PromoCodeUsage"
ADD CONSTRAINT "PromoCodeUsage_reservationId_fkey"
FOREIGN KEY ("reservationId")
REFERENCES "Reservation"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;