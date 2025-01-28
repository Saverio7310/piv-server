import assert from 'assert'
import { getProducts } from "../../controller/productsController";
import { NextFunction, Request, Response } from 'express';

describe('Controller test', function () {
    let req: any;
    let res: any;
    let next: any;
    let statusValue: number;
    let jsonValue: any;
    beforeEach(() => {
        req = {
            params: {
                searchQuery: 'latte',
                offset: 0,
                limit: 10,
            },
        } as unknown as Request;
        res = {
            status: function(value: number) {
                statusValue = value;
                return this;
            },
            json: function(object: any) {
                jsonValue = object;
            }
        } as unknown as Response;
        next as unknown as NextFunction;
    })
    it('should fetch the products based on the input query string', async function () {
        await getProducts(req, res, next);
        console.log(`Status ${statusValue}, value ${jsonValue}`);
        assert.equal(statusValue, 200);
        assert.ok(jsonValue);
    });
});