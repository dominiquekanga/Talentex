/*
  Warnings:

  - You are about to drop the column `commission` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `netAmount` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `stripeId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `talentId` on the `payments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[transactionId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_talentId_fkey";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "commission",
DROP COLUMN "netAmount",
DROP COLUMN "stripeId",
DROP COLUMN "talentId",
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN     "metadata" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "transactionId" TEXT,
ADD COLUMN     "type" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "payments_transactionId_key" ON "payments"("transactionId");
