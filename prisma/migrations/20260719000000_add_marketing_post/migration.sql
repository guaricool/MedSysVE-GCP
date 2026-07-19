-- CreateTable
CREATE TABLE "MarketingPost" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "hashtags" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "igMediaId" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingPost_pkey" PRIMARY KEY ("id")
);
