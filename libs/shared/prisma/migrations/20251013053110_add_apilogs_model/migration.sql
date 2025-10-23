-- CreateTable
CREATE TABLE "api_logs" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "limitWindowName" TEXT NOT NULL,
    "limitWindowTime" TEXT NOT NULL,
    "maxRequests" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "api_logs" ADD CONSTRAINT "api_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
