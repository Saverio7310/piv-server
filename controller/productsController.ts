import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import { getProductPrice, getProductsInfo } from '../database/database';
import { RedisWrapper } from '../model/RedisWrapper';
import { matchedData } from 'express-validator';

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
    /* const searchQuery = req.params.searchQuery.split('-').join(' ').replace('%25', '%');
    const offset = parseInt(req.query.offset as string) || 0; */
    const data = matchedData(req);
    const searchQuery: string = data.searchQuery;
    const offset: number = data.offset;
    const limit = 10 //parseInt(req.params.limit);

    /**
     * The cache flow should be
     * 1 - check for data inside cache
     *  Y -> return that
     *  N -> go ahead
     * 2 - fetch data from DB
     * 3 - save data inside redis
     * 4 - return DB fetched data
     */

    const cache = await RedisWrapper.getInstance();
    const cacheKey = `products:${searchQuery}?offset=${offset}`;
    const result = await cache.cacheData(cacheKey, () => getProductsInfo(searchQuery, offset, limit));

    if (result.rowCount === null) {
        next(new Error('Database connection error'));
        return;
    }

    res.status(200).json(result);
};

export const getProductInfo = async (req: Request, res: Response, next: NextFunction) => {
    //const product_id = req.params.product_id;
    const data = matchedData(req);
    const product_id: string = data.product_id;
    
    const cache = await RedisWrapper.getInstance();
    const cacheKey = `prices:${product_id}`;
    const result = await cache.cacheData(cacheKey, () => getProductPrice(product_id));
    
    if (result.rowCount === null) {
        next(new Error('Database connection error'));
        return;
    }

    res.status(200).send(result);
};