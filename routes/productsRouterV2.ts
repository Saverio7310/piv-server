import { Router } from 'express';
import { getProducts, getProductInfo } from '../controller/productsControllerV2';
import { body, param, query } from 'express-validator';
import handleValidationErrors from '../utils/validationErrors';

export const routerV2 = Router()

routerV2.get('/products/:searchQuery',
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

routerV2.post('/products/:product_id/info',
    [
        param('product_id')
            .trim()
            .isInt({ min: 0 }).withMessage('Invalid product\'s identifier'),
        body('supermarkets')
            .isArray().withMessage('Wrong format')
            .isLength({ min: 1 }).withMessage('Missing product\'s information'),
        body('supermarkets.*')
            .isObject().withMessage('Each item in the array must be an object')
            .custom((value, { req, location, path }) => {
                const allowedKeys = ['supermarket', 'origin_id'];
                const actualKeys = Object.keys(value);
                if (actualKeys.length !== allowedKeys.length || !allowedKeys.every(key => actualKeys.includes(key)))
                    throw new Error('Each product info object must contain only "supermarket" and "origin_id" properties');
                return true;
            }),
        body('supermarkets.*.supermarket')
            .isString().withMessage('Supermarket must be a string')
            .notEmpty().withMessage('Supermarket cannot be empty'),
        body('supermarkets.*.origin_id')
            .isInt({ min: 1 }).withMessage('Origin ID must be a positive integer')
    ],
    handleValidationErrors,
    getProductInfo);