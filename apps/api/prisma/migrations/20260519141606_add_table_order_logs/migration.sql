-- CreateTable
CREATE TABLE "TableOrderLog" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TableOrderLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TableOrderLog" ADD CONSTRAINT "TableOrderLog_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
