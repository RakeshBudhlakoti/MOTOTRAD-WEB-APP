-- CreateEnum
CREATE TYPE "AuctionType" AS ENUM ('BID_ONLY', 'BUY_NOW_ONLY', 'BID_AND_BUY');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('NONE', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('INACTIVE', 'ACTIVE', 'CANCELLED', 'PAST_DUE');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('FLAT', 'PERCENTAGE', 'NONE');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('UNREAD', 'READ', 'REPLIED', 'CLOSED');

-- AlterEnum
ALTER TYPE "AuctionStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "AuctionStatus" ADD VALUE 'EXPIRED';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'BID_PLACED';
ALTER TYPE "NotificationType" ADD VALUE 'MEMBERSHIP';

-- AlterEnum
ALTER TYPE "PaymentProvider" ADD VALUE 'CASH';

-- AlterTable
ALTER TABLE "Auction" ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "lastBidAt" TIMESTAMP(3),
ADD COLUMN     "type" "AuctionType" NOT NULL DEFAULT 'BID_ONLY',
ADD COLUMN     "winnerUserId" TEXT,
ADD COLUMN     "winningBidId" TEXT;

-- AlterTable
ALTER TABLE "Basket" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Bid" ADD COLUMN     "isHighestBid" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "adminRemarks" TEXT,
ADD COLUMN     "baseAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "commissionAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "commissionRate" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "commissionType" "CommissionType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "finalAmount" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "commissionAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "finalAmount" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "buyNowDisabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "buyNowDisabledReason" TEXT,
ADD COLUMN     "commissionAmount" DECIMAL(15,2),
ADD COLUMN     "commissionEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "commissionType" "CommissionType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSoldOut" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxCommissionAmount" DECIMAL(15,2),
ADD COLUMN     "minCommissionAmount" DECIMAL(15,2),
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "shortDescription" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "soldOutAt" TIMESTAMP(3),
ADD COLUMN     "soldOutBy" TEXT,
ADD COLUMN     "upfrontPaymentPercentage" DECIMAL(5,2),
ADD COLUMN     "useGlobalCommission" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "useGlobalUpfrontPayment" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "isProMember" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "membershipExpiry" TIMESTAMP(3),
ADD COLUMN     "membershipStatus" "MembershipStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "username" TEXT,
ADD COLUMN     "verificationToken" TEXT,
ADD COLUMN     "verificationTokenExpires" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'INACTIVE';

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL DEFAULT 'PRO_MONTHLY',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'INACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "paypalSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paypalOrderId" TEXT,
    "paypalCaptureId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactInquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactStatus" NOT NULL DEFAULT 'UNREAD',
    "adminReply" TEXT,
    "repliedBy" TEXT,
    "repliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_paypalSubscriptionId_key" ON "Subscription"("paypalSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPayment_paypalOrderId_key" ON "SubscriptionPayment"("paypalOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPayment_paypalCaptureId_key" ON "SubscriptionPayment"("paypalCaptureId");

-- CreateIndex
CREATE INDEX "ContactInquiry_status_idx" ON "ContactInquiry"("status");

-- CreateIndex
CREATE INDEX "ContactInquiry_createdAt_idx" ON "ContactInquiry"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Auction_winningBidId_key" ON "Auction"("winningBidId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_soldOutBy_fkey" FOREIGN KEY ("soldOutBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_highestBidderId_fkey" FOREIGN KEY ("highestBidderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_winnerUserId_fkey" FOREIGN KEY ("winnerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_winningBidId_fkey" FOREIGN KEY ("winningBidId") REFERENCES "Bid"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
