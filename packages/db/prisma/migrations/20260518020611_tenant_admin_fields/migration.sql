-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "dmsAdapter" "DmsAdapterKind",
ADD COLUMN     "dmsConfig" JSONB,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "timezone" TEXT;
