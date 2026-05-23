-- AlterTable
ALTER TABLE "TableLog" ADD COLUMN     "afterData" JSONB,
ADD COLUMN     "beforeData" JSONB,
ADD COLUMN     "undone" BOOLEAN NOT NULL DEFAULT false;
