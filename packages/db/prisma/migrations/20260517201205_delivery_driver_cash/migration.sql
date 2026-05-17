-- CreateEnum
CREATE TYPE "DeliveryFailureReason" AS ENUM ('OUTLET_CLOSED', 'NOT_ENOUGH_CASH', 'WRONG_SKU', 'DAMAGED', 'NO_ANSWER', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'POS', 'CREDIT');

-- AlterTable
ALTER TABLE "DeliveryAssignment" ADD COLUMN     "amountCollected" DECIMAL(12,2),
ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "driverId" TEXT,
ADD COLUMN     "failureReason" "DeliveryFailureReason",
ADD COLUMN     "paymentMethod" "PaymentMethod",
ADD COLUMN     "proofPhotoUrl" TEXT,
ADD COLUMN     "rescheduledFor" TIMESTAMP(3),
ADD COLUMN     "sequence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "signatureUrl" TEXT,
ADD COLUMN     "startedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "DeliveryAssignment_tenantId_driverId_scheduledFor_idx" ON "DeliveryAssignment"("tenantId", "driverId", "scheduledFor");

-- AddForeignKey
ALTER TABLE "DeliveryAssignment" ADD CONSTRAINT "DeliveryAssignment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
