-- CreateEnum
CREATE TYPE "public"."MovementStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."movements" ADD COLUMN     "status" "public"."MovementStatus" NOT NULL DEFAULT 'PENDING';
