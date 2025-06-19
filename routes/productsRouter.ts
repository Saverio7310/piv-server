import { Router } from 'express';
import { getProducts, getProductInfo } from '../controller/productsController';
import { param, query } from 'express-validator';
import handleValidationErrors from '../utils/validationErrors';

export const router = Router();

router.get('/products/:searchQuery',
    [
        param('searchQuery')
            .trim()
            .isLength({ min: 3, max: 50 }).withMessage('Input string\'s length out of bounds')
            .customSanitizer(value => decodeURIComponent(value)),
        query('offset')
            .trim()
            .isInt({ min: 0, max: 200 }).withMessage('Offset value out of bounds')
            .toInt()
    ],
    handleValidationErrors,
    getProducts);

router.get('/products/:product_id/info',
    [
        param('product_id')
            .trim()
            .isInt({ min: 0 }).withMessage('Invalid product\'s identifier')
    ],
    handleValidationErrors,
    getProductInfo);