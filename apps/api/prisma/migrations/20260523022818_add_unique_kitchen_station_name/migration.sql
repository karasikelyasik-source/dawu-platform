/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `KitchenStation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "KitchenStation_name_key" ON "KitchenStation"("name");
