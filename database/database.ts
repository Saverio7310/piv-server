import { QueryResult } from 'pg';
import pool from './db';
import { ProductPrice, Product, DBResult, ProductInfo } from '../types/databaseResultType';

export async function tryConnection(table: string) {
    const query = {
        text: `SELECT * FROM ${table} LIMIT 1 OFFSET 0`,
        values: [],
    }
    try {
        return await pool.query(query);
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function getProducts(table: string, offset: number, limit: number) {
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
        prod -> 'quantityDisabled' != 'true'
        ORDER BY product_id
        OFFSET ${offset} LIMIT ${limit};`;
    const query = {
        text: queryString,
        values: [],
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
export async function getPrettifiedProducts(table: string, offset: number, limit: number) {
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
        ORDER BY p1.product_id
        OFFSET ${offset} LIMIT ${limit};
    `;
    const query = {
        text: queryString,
        values: [],
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
        SELECT product_id, name, unit AS quantity_unit, value AS quantity_value
        FROM products_esselunga
        WHERE name ILIKE '%' || $1 || '%'
        AND created_at = (
            SELECT MAX(created_at) 
            FROM products_esselunga
            WHERE name ILIKE '%' || $1 || '%')
        ORDER BY product_id
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