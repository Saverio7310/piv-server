import { NextFunction, Request, Response, Router } from 'express';
import { getProducts, getProductInfo } from '../controller/productsController';
import { body, param, query, validationResult } from 'express-validator';
import rateLimiter from '../middleware/rateLimiter';

export const router = Router();

const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({errors: errors.array()});
        return;
    }
    next();
};

router.use('*', rateLimiter);

router.get('/products/:searchQuery',
    [
        param('searchQuery')
            .trim()
            .isLength({min: 3, max: 50}).withMessage('Input string\'s length out of bounds')
            .customSanitizer((value) => value.split('-').join(' ').replace('%25', '%')),
        query('offset')
            .trim()
            .isInt({min: 0, max: 200}).withMessage('Offset value out of bounds')
            .toInt()
    ],
    handleValidationErrors, 
    getProducts);

router.get('/products/:product_id/info', 
    [
        param('product_id')
            .trim()
            .isInt({min: 0}).withMessage('Invalid product\'s identifier')
    ],
    handleValidationErrors, 
    getProductInfo);