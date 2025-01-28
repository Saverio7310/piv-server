import { Router } from 'express';
import { getProducts, getProductInfo } from '../controller/productsController';

export const router = Router();

//router.get('/products', getProducts);

router.get('/products/:searchQuery', getProducts)

router.get('/products/:product_id/info', getProductInfo)