-- CreateTable
CREATE TABLE "TableLog" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TableLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TableLog" ADD CONSTRAINT "TableLog_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
