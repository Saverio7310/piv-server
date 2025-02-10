import { Cache } from "./Cache";
import { createClient, RedisClientType } from 'redis'

export class RedisWrapper implements Cache {
    private static instance: RedisWrapper;
    private client: RedisClientType;

    private constructor() {
        console.log('Constructor');
        this.client = createClient({
            socket: {
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
                reconnectStrategy(retries) {
                    if (retries > 5) {
                      console.error("Max Redis retries reached. Giving up.");
                      return false;
                    }
                    return Math.min(2 ** retries * 100, 3000); // Exponential backoff (max 3s)
                  }
            },
            password: process.env.REDIS_PASSWORD,
        });
        this.client.on('error', (error) => console.error('Redis error', error));
        this.client.on("end", () => console.warn("Redis connection closed. Server will continue without Redis."));
    }

    static async getInstance() {
        console.log('Get instance');
        if (!RedisWrapper.instance) {
            RedisWrapper.instance = new RedisWrapper();
        }
        if (!RedisWrapper.instance.client.isOpen)
            await RedisWrapper.instance.client.connect();
        return RedisWrapper.instance;
    }

    async getItem(key: string): Promise<any | null> {
        console.log('Get item');
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : value;
    }
    async getItems(pattern: string): Promise<any[] | null> {
        const value = await this.client.keys(pattern);
        return value;
    }
    async setItem(key: string, value: any, expiration?: number): Promise<void> {
        console.log('Set item');
        value = JSON.stringify(value);
        let result;
        if (expiration)
            result = await this.client.setEx(key, expiration, value);
        else
            result = await this.client.set(key, value);
    }
    async deleteItem(key: string): Promise<void> {
        /**
         * should return 
         * 1 if element was found and deleted
         * 0 if element does not exists
         */
        await this.client.del(key);
    }
    async clearItems(): Promise<void> {
        await this.client.flushDb();
    }

    async closeConnection(): Promise<string> {
        console.log('Closing connection');
        try {
            const result = await this.client.quit();
            return result;
        } catch (error) {
            return 'Client already closed!';
        }
    }

    async cacheData(key: string, cb: () => Promise<any>) {
        const cachedData = await this.getItem(key);
        
        if (cachedData) {
            console.log('Cache Hit');
            /**
             * TODO validate data (if it exists and no new data is available)
             */
            return cachedData;
        }
        console.log('Cache Miss');
        let storedData;
        try {
            storedData = await cb();
        } catch (error) {
            console.error('Database error', error);
            return {
                rowCount: null,
                data: []
            };
        }
        const EXPIRATION_TIME = 60 * 60;
        await this.setItem(key, storedData, EXPIRATION_TIME);
        return storedData;
    }
}