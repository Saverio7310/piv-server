import assert from 'assert';
import { NextFunction, Request, Response } from "express";
import rateLimiter from "../../middleware/rateLimiter";
import { Cache } from "../../model/Cache";
import { RedisWrapper } from "../../model/RedisWrapper";

describe('Rate Limiter', function () {
    let cache: Cache;
    beforeEach(async function () {
        cache = await RedisWrapper.getInstance();
    });
    afterEach(async function () {
        await cache.clearItems();
        await cache.closeConnection();
    });
    it('should limit the connection after 20 requests', async function () {
        let status = 0;
        let response = {};
        const req = { ip: '127.0.0.1'} as unknown as Request
        const res = {
            status(value: number) {
                console.log('Status:', value);
                status = value;
                return this;
            },
            json(value: any) {
                console.log('Json:', value);
                response = value;
                return this;
            }
        } as unknown as Response
        const next = () => {};


        for (let i = 0; i < 20; i++) {
            await rateLimiter(req, res, next);
        }

        const rate = await cache.getItem('rate:127.0.0.1');
        const violation = await cache.getItem('violation:127.0.0.1');


        assert.equal(status, 429, 'Status code');
        assert.deepEqual(response, {
            message: `Troppe richieste. Prova ancora tra 60 secondi.`,
            time: 60
        }, 'Response JSON');
        assert.ok(Array.isArray(rate) && rate.length === 19, 'Redis timestamps array');
        assert.equal(violation, 1, 'Redis ban time');
    });
    it('should ban the connection after 21 requests', async function () {
        let status = 0;
        let response = {};
        const req = { ip: '127.0.0.1'} as unknown as Request
        const res = {
            status(value: number) {
                console.log('Status:', value);
                status = value;
                return this;
            },
            json(value: any) {
                console.log('Json:', value);
                response = value;
                return this;
            }
        } as unknown as Response
        const next = () => {};


        for (let i = 0; i < 21; i++) {
            await rateLimiter(req, res, next);
        }

        const rate = await cache.getItem('rate:127.0.0.1');
        const violation = await cache.getItem('violation:127.0.0.1');


        assert.equal(status, 429, 'Status code');
        assert.deepEqual(response, {
            message: `Troppe richieste. Prova ancora tra 120 secondi.`,
            time: 120
        }, 'Response JSON');
        assert.ok(Array.isArray(rate) && rate.length === 19, 'Redis timestamps array');
        assert.equal(violation, 2, 'Redis ban time');
    });
});