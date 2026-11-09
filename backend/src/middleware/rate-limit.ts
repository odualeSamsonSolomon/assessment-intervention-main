import { createHash } from 'node:crypto';
import type { RequestHandler } from 'express';
import { prisma } from '../lib/prisma.js';

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
  message: string;
};

let nextCleanupAt = 0;

export const rateLimit = ({ key, limit, windowMs, message }: RateLimitOptions): RequestHandler =>
  async (req, res, next) => {
    const now = Date.now();
    const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
    const clientHash = createHash('sha256')
      .update(`${process.env.JWT_SECRET || 'dev-secret'}:${req.ip || req.socket.remoteAddress || 'unknown'}`)
      .digest('hex');

    try {
      const [bucket] = await prisma.$queryRaw<{ requestCount: number }[]>`
        INSERT INTO "AuthRateLimitBucket" ("key", "windowStart", "requestCount", "updatedAt")
        VALUES (${`${key}:${clientHash}`}, ${windowStart}, 1, NOW())
        ON CONFLICT ("key") DO UPDATE
        SET "windowStart" = EXCLUDED."windowStart",
            "requestCount" = CASE
              WHEN "AuthRateLimitBucket"."windowStart" = EXCLUDED."windowStart"
                THEN "AuthRateLimitBucket"."requestCount" + 1
              ELSE 1
            END,
            "updatedAt" = NOW()
        RETURNING "requestCount"
      `;

      const retryAfterSeconds = Math.ceil((windowStart.getTime() + windowMs - now) / 1000);
      res.setHeader('RateLimit-Policy', `${limit};w=${Math.ceil(windowMs / 1000)}`);
      res.setHeader('RateLimit-Limit', limit);
      res.setHeader('RateLimit-Remaining', Math.max(0, limit - bucket.requestCount));
      res.setHeader('RateLimit-Reset', retryAfterSeconds);

      if (now >= nextCleanupAt) {
        await prisma.authRateLimitBucket.deleteMany({
          where: { updatedAt: { lt: new Date(now - 24 * 60 * 60 * 1000) } },
        });
        nextCleanupAt = now + 60 * 60 * 1000;
      }

      if (bucket.requestCount > limit) {
        res.setHeader('Retry-After', retryAfterSeconds);
        return res.status(429).json({ message, retryAfterSeconds });
      }

      return next();
    } catch (error) {
      console.error('Authentication rate limit error:', error);
      return res.status(503).json({ message: 'Authentication is temporarily unavailable. Please try again shortly.' });
    }
  };
