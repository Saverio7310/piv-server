import { NextFunction, Request, Response } from "express";
import { Cache } from "../model/Cache";
import { RedisWrapper } from "../model/RedisWrapper";

/**
 * Rate Limiter middleware
 * 
 * When a request comes, it will have to be processed this way:
 * 1 - check if ip is already flagged: Y flag it again with increased time + send 429, N go ahead
 * 2 - check if ip has now reached the limit: Y flag it with 0 + send 429, N go ahead with next function
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {NextFunction} next 
 * @returns 
 */
export default async function rateLimiter(req: Request, res: Response, next: NextFunction) {
    const cache: Cache = await RedisWrapper.getInstance();

    const REQUESTS_LIMIT = 20;
    const WINDOW = 60 * 1000;
    // 1m, 2m, 5m, 15m, 1h, 4h, 12h, 1d, 1w, 1y
    const TIMEOUTS = [60, 120, 300, 900, 3600, 14400, 43200, 86400, 604800, 2592000];

    const ip = req.ip;
    const rateKey = `rate:${ip}`;
    const violationKey = `violation:${ip}`;

    const ban = await cache.getItem(violationKey);
    const limit = ban !== null ? parseInt(ban) : 0;
    
    if (limit > 0) {
        const index = Math.min(limit, TIMEOUTS.length - 1);
        const timeout = TIMEOUTS[index];
        console.log('Index + Timeout', index, timeout);
        await cache.setItem(violationKey, index + 1, timeout);
        res.status(429).json({
            message: `Troppe richieste. Prova ancora tra ${timeout} secondi.`,
            time: timeout
        });
        return;
    }

    const now = Date.now();

    const requests = await cache.getItem(rateKey);
    let timestamps: number[] = requests ? requests : [];
    timestamps = timestamps.filter(ts => now - ts < WINDOW);

    if (timestamps.length + 1 >= REQUESTS_LIMIT) {
        const timeout = TIMEOUTS[0]
        await cache.setItem(violationKey, 1, timeout);
        res.status(429).json({
            message: `Troppe richieste. Prova ancora tra ${timeout} secondi.`,
            time: timeout
        });
        return;
    }

    timestamps.push(now);
    await cache.setItem(rateKey, timestamps, WINDOW / 1000 + 5);
    next();
}