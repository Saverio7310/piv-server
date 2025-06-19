import { Request, Response, NextFunction } from 'express';
import { getProductPrice2, getProductsInfo2 } from '../database/database';
import { RedisWrapper } from '../model/RedisWrapper';
import { matchedData } from 'express-validator';
import { Product, ProductsMap, SupermarketData } from '../types/productType';

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
    /* const searchQuery = req.params.searchQuery.split('-').join(' ').replace('%25', '%');
    const offset = parseInt(req.query.offset as string) || 0; */
    const data = matchedData(req);
    const searchQuery: string = data.searchQuery;
    const offset: number = data.offset;
    const limit = 10 //parseInt(req.params.limit);

    console.log("Incoming data:", searchQuery, offset);

    const cache = await RedisWrapper.getInstance();
    const cacheKey = `products:${searchQuery}?offset=${offset}`;
    const result = await cache.cacheData(cacheKey, () => getProductsInfo2(searchQuery, offset, limit));

    if (result.rowCount === null) {
        next(new Error('Database connection error'));
        return;
    } else console.log('Products fetched:', result.rowCount);

    const products_map: ProductsMap = {};
    for (const prod of result.data) {
        const final_product: Product = {
            name: prod.master_name ?? prod.name,
            brand: prod.master_brand ?? prod.brand ?? '',
            quantity_unit: prod.master_quantity_unit ?? prod.quantity_unit,
            quantity_value: prod.master_quantity_value ?? prod.quantity_value,
            product_id: prod.master_id ?? prod.product_id,
            supermarkets: [{ supermarket: prod.supermarket_name, origin_id: prod.product_id }]
        };
        if (prod.master_id) {
            if (!products_map[`master_${prod.master_id}`]) {
                products_map[`master_${prod.master_id}`] = final_product;
            } else {
                products_map[`master_${prod.master_id}`].supermarkets.push({ supermarket: prod.supermarket_name, origin_id: prod.product_id })
            }
        } else {
            if (!products_map[`${prod.supermarket_name}_${prod.product_id}`]) {
                products_map[`${prod.supermarket_name}_${prod.product_id}`] = final_product;
            } else {
                products_map[`${prod.supermarket_name}_${prod.product_id}`].supermarkets.push({ supermarket: prod.supermarket_name, origin_id: prod.product_id });
            }
        }
    }
    const final_products: Product[] = [];
    for (const [key, value] of Object.entries(products_map)) {
        final_products.push(value);
    }

    result.data = final_products;
    result.rowCount = result.data.length;

    res.status(200).json(result);
}

export const getProductInfo = async (req: Request, res: Response, next: NextFunction) => {
    //const product_id = req.params.product_id;
    const data = matchedData(req);
    const supermarkets: SupermarketData[] = data.supermarkets;
    const product_id: string = data.product_id;

    const cache = await RedisWrapper.getInstance();
    const cacheKey = `prices:${product_id}`;
    const result = await cache.cacheData(cacheKey, () => getProductPrice2(supermarkets));

    if (result.rowCount === null) {
        next(new Error('Database connection error'));
        return;
    }

    res.status(200).send(result);
};