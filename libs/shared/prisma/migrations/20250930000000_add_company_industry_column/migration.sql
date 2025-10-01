-- Add industry column to companies table
ALTER TABLE "companies"
ADD COLUMN IF NOT EXISTS "industry" TEXT;
