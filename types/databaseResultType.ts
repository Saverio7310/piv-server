export interface Product {
    name: string,
    name_token: string,
    product_id: number,
    code: number,
    family_id: number | null,
    unit: string,
    value: number,
    trolley_department_id: number,
    intervals: any[],
    values: any[],
    created_at: string | null,
    //updated_at: string | null
    //[key: string]: any;
}

export interface ProductInfo {
    product: Product,
    prices: ProductPrice
}

export interface ProductPrice {
    product_id: number,
    price: number,
    original_price: number,
    original_discounted_price: number,
    unit_price: number,
    discounted_price: number,
    discounted_unit_price: number
    label: string,
    created_at: string | null,
    //updated_at: string | null
    //[key: string]: any;
}

export type DBResult = {
    rowCount: number | null,
    data: any[],
}

export interface Prices {
    supermarket_name: string,
    product_id: number,
    unit_prices: number[],
    prices: number[],
    discounted_prices: number[], 
    discounted_unit_prices: number[],
    dates: string[],
}