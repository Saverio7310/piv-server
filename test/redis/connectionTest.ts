import assert from 'assert';
import { RedisWrapper } from "../../model/RedisWrapper";
import { afterEach } from 'mocha';
import { Cache } from '../../model/Cache';

describe('Redis connection', function () {
    let cache: Cache;
    beforeEach(async function () {
        cache = await RedisWrapper.getInstance();
    })
    afterEach(async function () {
        await cache.clearItems();
        await cache.closeConnection();
    })
    it('should connect', async function () {
        cache.setItem('test', '123', 10);
        const value = await cache.getItem('test');
        assert.equal(value, '123');
    });
});

describe('Fetching data', function () {
    let cache: Cache;
    beforeEach(async function () {
        cache = await RedisWrapper.getInstance();
        const res = await cache.getItems('*');
        console.log(res);
    })
    afterEach(async function () {
        await cache.clearItems();
        await cache.closeConnection();
    });
    it('should get null value', async function () {
        const value = await cache.getItem('random key');
        assert.equal(value, null);
    });
    it('should get 0', async function () {
        await cache.setItem('random key', 0);
        const value = await cache.getItem('random key');
        assert.strictEqual(value, 0);
    });
});