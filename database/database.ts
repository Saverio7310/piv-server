import { QueryResult } from 'pg';
import pool from './db';
import { ProductPrice, Product, DBResult, ProductInfo, Prices } from '../types/databaseResultType';
import { SupermarketData } from '../types/productType';

export async function tryConnection() {
    const query = {
        text: `SELECT 1`,
        values: [],
    }
    try {
        return await pool.query(query);
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function getProducts(table: string, date: string, offset: number, limit: number) {
    const queryString = `
        SELECT
        (prod ->> 'id')::integer AS product_id,
        prod ->> 'unitText' AS unit,
        (prod ->> 'unitValue')::integer AS value,
        (prod ->> 'code')::integer AS code,
        (prod ->> 'familySetId')::integer AS family_id,
        (prod ->> 'trolleyDepartmentId')::smallint AS trolley_department_id,
        prod ->> 'description' AS name,
        prod ->> 'sanitizeDescription' AS name_token,
        CAST(prod ->> 'label' AS CHARACTER VARYING(16)) AS label,
        (prod ->> 'price')::real AS price,
        (prod ->> 'discountedPrice')::real AS discounted_price,
        prod -> 'intervals' AS intervals,
        prod -> 'values' AS values,
        CAST(created_at AS text)
        FROM ${table}
        WHERE 
        prod ->> 'label' != '' AND
        prod ->> 'productType' != 'VIRTUAL' AND 
        prod -> 'premium' != 'true' AND 
        prod -> 'quantityDisabled' != 'true' AND
        created_at = $1
        ORDER BY product_id
        OFFSET $2 LIMIT $3;`;
    const query = {
        text: queryString,
        values: [date, offset, limit],
    }
    let res: QueryResult<Product>;
    try {
        res = await pool.query(query);
        return res;
    } catch (error) {
        console.error('Error while fetching data', error);
        return false;
    }
}

export async function saveProduct(table: string, prod: Product, created_at: string) {
    const queryString = `
        INSERT INTO ${table}(product_id, unit, value, code, family_id, trolley_department_id, name, name_token, intervals, values, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, DEFAULT)
        ON CONFLICT (product_id,created_at) DO NOTHING
    `;
    const jsonIntervals = JSON.stringify(prod.intervals);
    const jsonValues = JSON.stringify(prod.values);
    const query = {
        text: queryString,
        values: [prod.product_id, prod.unit, prod.value, prod.code, prod.family_id, prod.trolley_department_id, prod.name, prod.name_token, jsonIntervals, jsonValues, created_at]
    };

    let res: QueryResult<any>;
    try {
        res = await pool.query(query);
        return res;
    } catch (error: any) {
        //23505 is a unique constraint violation
        if (error.code !== '23505') {
            console.error('Error while saving product', error);
        }
        return false;
    }
}

/**
 * get all the products in products_esselunga join prices_esselunga on same id to process them
 * @param table 
 * @param offset 
 * @param limit 
 * @returns 
 */
export async function getPrettifiedProducts(table: string, date: string, offset: number, limit: number) {
    const queryString = `
        SELECT 
        name, 
        name_token, 
        p1.product_id, 
        code, 
        family_id, 
        unit, 
        value, 
        trolley_department_id, 
        p2.label, 
        intervals, 
        values, 
        price, 
        unit_price, 
        discounted_price, 
        discounted_unit_price,
        original_price,
        original_discounted_price,
        CAST(p1.created_at AS text)
        FROM 
        products_esselunga p1
        JOIN
        prices_esselunga p2
        ON p1.product_id = p2.product_id and p1.created_at = p2.created_at
        WHERE p1.created_at = $1
        ORDER BY p1.product_id
        OFFSET $2 LIMIT $3;
    `;
    const query = {
        text: queryString,
        values: [date, offset, limit],
    }
    let res: QueryResult<any>;
    try {
        res = await pool.query(query);
        return res;
    } catch (error) {
        console.error('Error while fetching data', error);
        return false;
    }
}

export async function updateQuantity(product: Product) {
    const queryString = `
    UPDATE products_esselunga
    SET quantity_unit = $1, quantity_value = $2, updated_at = DEFAULT
    WHERE product_id = $3 AND created_at = $4;
    `;
    const query = {
        text: queryString,
        values: [product.unit, product.value, product.product_id, product.created_at]
    }

    let res: QueryResult<any>;
    try {
        res = await pool.query(query);
        return res;
    } catch (error: any) {
        //23505 is a unique constraint violation
        if (error.code !== '23505') {
            console.error('Error while updating quantity', error);
        }
        return false;
    }
}

export async function updatePrices(product: ProductPrice) {
    const queryString = `
    UPDATE prices_esselunga
    SET price = $1, unit_price = $2, discounted_price = $3, discounted_unit_price = $4, updated_at = DEFAULT
    WHERE product_id = $5 AND created_at = $6;
    `;
    const query = {
        text: queryString,
        values: [product.price, product.unit_price, product.discounted_price, product.discounted_unit_price, product.product_id, product.created_at]
    }

    let res: QueryResult<any>;
    try {
        res = await pool.query(query);
        return res;
    } catch (error: any) {
        //23505 is a unique constraint violation
        if (error.code !== '23505') {
            console.error('Error while updating prices', error);
        }
        return false;
    }
}

export async function saveProductPrice(table: string, price: ProductPrice, created_at: string) {
    const queryString = `
        INSERT INTO ${table}(product_id, label, original_price, original_discounted_price, price, unit_price, discounted_price, discounted_unit_price, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, DEFAULT)
        ON CONFLICT (product_id,created_at) DO NOTHING
    `;
    const query = {
        text: queryString,
        values: [
            price.product_id,
            price.label,
            price.original_price,
            price.original_discounted_price,
            price.price,
            price.unit_price,
            price.discounted_price,
            price.discounted_unit_price,
            created_at]
    };

    let res: QueryResult<any>;
    try {
        res = await pool.query(query);
        return res;
    } catch (error: any) {
        //23505 is a unique constraint violation
        if (error.code !== '23505') {
            console.error('Error while saving price', error);
        }
        return false;
    }
}

export async function getProductsInfo(searchQuery: string, offset: number, limit: number) {
    const queryString = `
        SELECT DISTINCT ON (product_id) 
        product_id, 
        name, 
        unit AS quantity_unit, 
        value AS quantity_value
        FROM products_esselunga
        WHERE name ILIKE '%' || $1 || '%'
        ORDER BY product_id, created_at DESC
        OFFSET $2 LIMIT $3;
    `;
    const query = {
        text: queryString,
        values: [searchQuery, offset, limit],
    }

    const fetchedResult: DBResult = {
        rowCount: null,
        data: []
    }
    try {
        const result = await pool.query(query);
        fetchedResult.rowCount = result.rowCount;
        fetchedResult.data = result.rows;
    } catch (error) {
        console.error('Error while fetching data', error);
    }
    return fetchedResult;
}

export async function getSupermarkets() {
    const query = 'SELECT ARRAY_AGG(supermarket) AS supermarkets_array FROM supermarkets';
    const fetchedResult: DBResult = {
        rowCount: null,
        data: []
    }
    try {
        const result = await pool.query(query);
        fetchedResult.rowCount = result.rowCount;
        fetchedResult.data = result.rows[0].supermarkets_array;
    } catch (error) {
        console.error('Error while fetching supermarkets', error);
    }
    return fetchedResult;
}

export async function getProductsInfo2(searchQuery: string, offset: number, limit: number) {
    const fetchedResult: DBResult = {
        rowCount: null,
        data: []
    }
    const supermarkets = await getSupermarkets();
    if (!supermarkets.rowCount) return fetchedResult;

    for (const supermarket of supermarkets.data) {
        const queryString = `
            SELECT mp.master_id, mp.name AS master_name, mp.brand AS master_brand, mp.quantity_unit AS master_quantity_unit, mp.quantity_value AS master_quantity_value, pe.product_id, pe.name, pe.brand, pe.quantity_unit, pe.quantity_value, '${supermarket}' AS supermarket_name
            FROM master_products mp
            JOIN link_products lp
            ON mp.master_id = lp.master_id 
            RIGHT OUTER JOIN (
                SELECT /* DISTINCT ON (product_id) */ *
                FROM products_${supermarket} peo
                WHERE name ILIKE '%' || $1 || '%' AND peo.created_at = (
                    SELECT created_at
                    FROM products_${supermarket} pei
                    WHERE pei.product_id = peo.product_id
                    ORDER BY pei.created_at DESC
                    LIMIT 1
                )
                ORDER BY product_id asc, created_at DESC
            ) AS pe
            ON lp.product_id = pe.product_id
            WHERE mp.name ILIKE '%' || $1 || '%' OR mp.name IS NULL
            ORDER BY mp.name, mp.quantity_value, pe.name, pe.quantity_value
            OFFSET $2 LIMIT $3;
        `;
        const query = {
            text: queryString,
            values: [searchQuery, offset, limit]
        }

        try {
            const result = await pool.query(query);
            fetchedResult.data.push(...result.rows);
        } catch (error) {
            console.error('Error while fetching data', error);
        }
    }
    fetchedResult.rowCount = fetchedResult.data.length ? fetchedResult.data.length : null;
    return fetchedResult;
}

export async function getProductPrice(product_id: string) {
    const queryString = `
    SELECT 
    product_id, 
    CAST(created_at AS text), 
    price, 
    unit_price, 
    discounted_price, 
    discounted_unit_price
    FROM prices_esselunga
    WHERE product_id = $1
    ORDER BY created_at ASC;
    `;
    const query = {
        text: queryString,
        values: [product_id]
    }
    const fetchedResult: DBResult = {
        rowCount: null,
        data: []
    }
    try {
        const result = await pool.query(query);
        fetchedResult.rowCount = result.rowCount;
        fetchedResult.data = result.rows;
    } catch (error) {
        console.error('Error while fetching product\'s price info', error);
    }
    return fetchedResult;
}

export async function getProductPrice2(supermarkets: SupermarketData[]) {
    const fetchedResult: DBResult = {
        rowCount: null,
        data: []
    }
    for (const el of supermarkets) {
        const queryString = `
            SELECT 
            product_id, 
            CAST(created_at AS text), 
            price, 
            unit_price, 
            discounted_price, 
            discounted_unit_price
            FROM prices_${el.supermarket}
            WHERE product_id = $1
            ORDER BY created_at ASC;
        `;
        const query = {
            text: queryString,
            values: [el.origin_id]
        }

        try {
            const result = await pool.query(query);

            const prices: Prices = {
                supermarket_name: el.supermarket,
                product_id: el.origin_id,
                unit_prices: [],
                prices: [],
                discounted_prices: [],
                discounted_unit_prices: [],
                dates: [],
            }

            result.rows.forEach(obj => {
                prices.prices.push(obj.price),
                prices.unit_prices.push(obj.unit_price),
                prices.discounted_prices.push(obj.discounted_price),
                prices.discounted_unit_prices.push(obj.discounted_unit_price),
                prices.dates.push(obj.created_at)
            });

            fetchedResult.data.push(prices);
        } catch (error) {
            console.error('Error while fetching product\'s price info', error);
        }
    }
    fetchedResult.rowCount = fetchedResult.data.length ? fetchedResult.data.length : null;
    return fetchedResult;
}