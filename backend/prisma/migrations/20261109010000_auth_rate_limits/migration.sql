CREATE TABLE "AuthRateLimitBucket" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "requestCount" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthRateLimitBucket_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "AuthRateLimitBucket_updatedAt_idx" ON "AuthRateLimitBucket"("updatedAt");
