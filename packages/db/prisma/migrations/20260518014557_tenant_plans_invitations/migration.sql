-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'STARTER', 'GROWTH', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "billingEmail" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "plan" "PlanTier" NOT NULL DEFAULT 'STARTER',
ADD COLUMN     "seatLimit" INTEGER NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");

-- CreateIndex
CREATE INDEX "Invitation_tenantId_status_idx" ON "Invitation"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
