/*
  Warnings:

  - You are about to drop the column `mintedAt` on the `NFTRecord` table. All the data in the column will be lost.
  - You are about to drop the column `avatar` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "NFTRecord" DROP COLUMN "mintedAt",
ADD COLUMN     "mintTime" TIMESTAMP(3),
ADD COLUMN     "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatar",
DROP COLUMN "bio",
DROP COLUMN "email",
ADD COLUMN     "hasClaimed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mintedAt" TIMESTAMP(3),
ADD COLUMN     "pityCounter" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "selfMintCount" INTEGER NOT NULL DEFAULT 0;
