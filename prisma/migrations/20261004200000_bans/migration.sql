-- CreateEnum
CREATE TYPE "BanKind" AS ENUM ('EMAIL', 'KVK');

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "termsVersion" TEXT NOT NULL DEFAULT '2026-10';

-- AlterTable
ALTER TABLE "FinderProfile" ADD COLUMN     "termsVersion" TEXT NOT NULL DEFAULT '2026-10';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bannedAt" TIMESTAMP(3),
ADD COLUMN     "bannedReason" TEXT;

-- CreateTable
CREATE TABLE "Ban" (
    "id" TEXT NOT NULL,
    "kind" "BanKind" NOT NULL,
    "valueHash" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ban_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ban_kind_valueHash_key" ON "Ban"("kind", "valueHash");

