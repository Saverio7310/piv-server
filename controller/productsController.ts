import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import { getProductPrice, getProductsInfo } from '../database/database';

export const getProducts_ = (req: Request, res: Response, next: NextFunction) => {
    const data = req.query;
    console.log('incoming data', data);
    if (!data || !data.limit || !data.offset) {
        console.log('No params found!');
        const data = {
            message: 'Missing pagination values',
        };
        res.setHeader('Content-Type', 'application/json');
        res.status(400).send(JSON.stringify(data));
        return;
    }
    axios({
        method: 'get',
        url: `https://jsonplaceholder.typicode.com/posts`,
        params: {
            userId: data.iteration,
        },
        timeout: 2000,
    })
        .then(function (response) {
            const data = response.data;
            res.setHeader('Content-Type', 'application/json');
            res.status(response.status).send(JSON.stringify(data));
        })
        .catch(function (error) {
            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                console.error('Request timeout reached');
                res.sendStatus(408);
                return;
            }
            if (error.response) {
                console.error('Server replied with an error');
                const data = {
                    message: error.response.message,
                };
                res.setHeader('Content-Type', 'application/json');
                res.status(error.response.status).send(JSON.stringify(data));
            } else if (error.request) {
                console.error('Server did not replied');
                const data = error.request;
                res.setHeader('Content-Type', 'application/json');
                res.status(error.status).send(JSON.stringify(data));
            } else {
                console.error('Error occurred in request setting up');
                res.sendStatus(400);
            }
        })
};

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
    const searchQuery = req.params.searchQuery.split('-').join(' ').replace('%25', '%');
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = 10 //parseInt(req.params.limit);

    if (!searchQuery /* || !offset || !limit */ || isNaN(offset) || isNaN(limit)) {
        res.sendStatus(404);
        return;
    }

    const result = await getProductsInfo(searchQuery, offset, limit);

    if (result.rowCount === null) {
        next(new Error('Database connection error'));
        return;
    }

    res.status(200).json(result);
};

export const getProductInfo = async (req: Request, res: Response, next: NextFunction) => {
    const product_id = req.params.product_id;

    if (!product_id) {
        next(new Error('Missing product identifier'));
        return;
    }

    const result = await getProductPrice(product_id);

    if (result.rowCount === null) {
        next(new Error('Database connection error'));
        return;
    }

    res.status(200).send(result);
};