-- AlterTable
ALTER TABLE "_MissionToTalent" ADD CONSTRAINT "_MissionToTalent_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_MissionToTalent_AB_unique";

-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "terms" TEXT;

-- CreateTable
CREATE TABLE "contract_signatures" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "signerRole" TEXT NOT NULL,
    "signatureData" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isSigned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_signatures_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "contract_signatures" ADD CONSTRAINT "contract_signatures_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
