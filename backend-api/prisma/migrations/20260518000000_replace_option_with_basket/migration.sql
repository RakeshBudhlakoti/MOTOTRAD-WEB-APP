-- Migration: Replace Option/Taxonomy with Basket module
-- Date: 2026-05-18

-- Step 1: Create Basket table
CREATE TABLE "Basket" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Basket_pkey" PRIMARY KEY ("id")
);

-- Step 2: Unique index on slug
CREATE UNIQUE INDEX "Basket_slug_key" ON "Basket"("slug");

-- Step 3: Performance indexes on Basket
CREATE INDEX "Basket_slug_idx" ON "Basket"("slug");
CREATE INDEX "Basket_isActive_idx" ON "Basket"("isActive");

-- Step 4: Add basketId column to Product (nullable for backward compat)
ALTER TABLE "Product" ADD COLUMN "basketId" TEXT;

-- Step 5: Create index on Product.basketId
CREATE INDEX "Product_basketId_idx" ON "Product"("basketId");

-- Step 6: Add foreign key constraint from Product.basketId -> Basket.id
ALTER TABLE "Product" ADD CONSTRAINT "Product_basketId_fkey"
    FOREIGN KEY ("basketId") REFERENCES "Basket"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 7: Remove old optionId FK from Product (set to null first for safety)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='Product' AND column_name='optionId'
    ) THEN
        EXECUTE 'UPDATE "Product" SET "optionId" = NULL WHERE "optionId" IS NOT NULL';
    END IF;
END $$;

-- Step 8: Drop old FK constraint on optionId
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_optionId_fkey";

-- Step 9: Remove optionId column from Product
ALTER TABLE "Product" DROP COLUMN IF EXISTS "optionId";

-- Step 10: Drop the Option table (cascade)
DROP TABLE IF EXISTS "Option" CASCADE;
