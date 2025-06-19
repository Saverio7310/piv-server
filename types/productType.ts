export interface ProductsMap {
    [key: string]: Product;
};

export interface SupermarketData {
    supermarket: string,
    origin_id: number
}

export interface Product {
    name: string,
    brand: string,
    quantity_unit: string,
    quantity_value: number,
    product_id: number,
    supermarkets: SupermarketData[]
};