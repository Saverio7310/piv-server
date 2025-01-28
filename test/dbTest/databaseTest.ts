import { getPrettifiedProducts, getProducts, saveProduct, saveProductPrice, tryConnection, updatePrices, updateQuantity } from "../../database/database";
import assert from 'assert';
import { Product, ProductInfo, ProductPrice } from "../../types/databaseResultType";
import { Converter } from "../../utils/conversion";

describe('Database connection', function () {
    it('should connect', async function () {
        const table = 'prods_json';

        const res = await tryConnection(table);

        assert.ok(res && typeof res === 'object');
    });
    it('should fetch one row', async function () {
        const table = 'products_esselunga';

        const res = await tryConnection(table);

        assert.ok(res && typeof res === 'object');
    })
});

describe.skip('Populate new table', function () {
    it.skip('should return the necessary data', async function () {
        const table = 'prods_json';
        const offset = 0;
        const limit = 25;

        const res = await getProducts(table, offset, limit);
        if (!res)
            return;
        const prods: Product[] = res.rows;
        prods.forEach(prod => {
            if (prod.values.length === 0)
                return;
            const newValues: any[] = [];
            prod.values.forEach(val => {
                if (val.messageType === 'RULE' || val.messageType === "PROMO") {
                    newValues.push(val);
                }
            });
            prod.values = newValues;
        });
        assert.ok(prods.length);
    });
    it.skip('should save the test data', async function () {
        this.timeout(120000);
        const fromTable = 'prods_json';
        const toTable = 'products_esselunga';
        let offset = 0;
        const limit = 500;

        let check = true;
        while (check) {
            const fetchResult = await getProducts(fromTable, offset, limit);
            if (!fetchResult || fetchResult.rowCount === 0)
                break;
            const prods: Product[] = fetchResult.rows;
            prods.forEach(async prod => {
                const newValues: any[] = [];
                prod.values.forEach(val => {
                    if (val.messageType === 'RULE' || val.messageType === "PROMO") {
                        newValues.push(val);
                    }
                });
                prod.values = newValues;

                const insertResult = await saveProduct(toTable, prod, 'DEFAULT');

                if (!insertResult)
                    console.log(prod);
            });

            offset += limit;
        }
    });
    it('should create the entries for both tables, products_esselunga and prices_esselunga', async function () {
        this.timeout(1200000);
        const fromTable = 'prods_json';
        const productsTable = 'products_esselunga';
        const pricesTable = 'prices_esselunga';
        let offset = 0;
        const limit = 500;

        function setUp(object: any): ProductInfo {
            const {
                product_id,
                unit,
                value,
                code,
                family_id,
                trolley_department_id,
                name,
                name_token,
                label,
                price,
                discounted_price,
                intervals,
                values,
                created_at
            } = object;
            const newName = name.trim();
            const newNameToken = name_token.trim();
            const newUnit = unit.trim();
            const newLabel = label.trim();
            const product: Product = {
                product_id,
                family_id,
                code,
                name: newName,
                name_token: newNameToken,
                unit: newUnit,
                value,
                trolley_department_id,
                intervals,
                values,
                created_at,
            };
            const prices: ProductPrice = {
                product_id,
                label: newLabel,
                price: -1,
                unit_price: -1,
                discounted_price: -1,
                discounted_unit_price: -1,
                original_price: price,
                original_discounted_price: discounted_price,
                created_at,
            };
            const productInfo: ProductInfo = {
                product,
                prices
            }
            return productInfo
        }

        let check = true;
        while (check) {
            const fetchResult = await getProducts(fromTable, offset, limit);
            if (!fetchResult || fetchResult.rowCount === 0)
                break;
            const prods: any[] = fetchResult.rows;
            prods.forEach(async prod => {
                const { created_at } = prod;
                const { product, prices } = setUp(prod);

                const newValues: any[] = [];
                product.values.forEach(val => {
                    if (val.messageType === 'RULE' || val.messageType === "PROMO") {
                        newValues.push(val);
                    }
                });
                product.values = newValues;

                const insertResult1 = await saveProduct(productsTable, product, created_at);
                const insertResult2 = await saveProductPrice(pricesTable, prices, created_at);

                /* if (!insertResult1 || !insertResult2)
                    console.log('Failed to save one of these values', product.product_id, product.name, created_at); */
            });

            offset += limit;
        }
    });
});

describe('create prices records', function () {
    it('should create the correct prices', async function () {
        this.timeout(1200000);
        let offset = 0;
        const limit = 500;

        let check = true;
        while (check) {
            const prods = await getPrettifiedProducts('', offset, limit);
            if (!prods || prods.rowCount === 0) {
                console.log('Exiting...', prods);
                break;
            }
            prods.rows.forEach(async (prod) => {
                const {
                    code,
                    family_id,
                    intervals,
                    label,
                    name,
                    name_token,
                    product_id,
                    trolley_department_id,
                    unit,
                    value,
                    values,
                    discounted_price,
                    discounted_unit_price,
                    price,
                    unit_price,
                    original_price,
                    original_discounted_price,
                    created_at,
                } = prod;
                const lab: string = label.trim();
                const un: string = unit.trim();
                const product: ProductInfo = {
                    product: {
                        product_id,
                        code,
                        family_id,
                        name,
                        name_token,
                        unit: un,
                        value,
                        intervals,
                        values,
                        trolley_department_id,
                        created_at,
                    },
                    prices: {
                        product_id,
                        label: lab,
                        original_price,
                        original_discounted_price,
                        price,
                        unit_price,
                        discounted_unit_price,
                        discounted_price,
                        created_at,
                    }
                }
                //console.log('Current product:', product);
                const prices = generateProductPrice(product);
                product.prices.price = prices.finalPrice;
                product.prices.unit_price = prices.finalUnitPrice;
                product.prices.discounted_price = prices.finalDiscountedPrice;
                product.prices.discounted_unit_price = prices.finalDiscountedUnitPrice;
                const updateProductsResult = await updateQuantity(product.product);
                if (!updateProductsResult) {
                    console.error('Quantity Update Failed', product);
                }
                const updatePricesResult = await updatePrices(product.prices);
                if (!updatePricesResult) {
                    console.error('Price Update Failed', product);
                }
            });
            offset += limit;
        }

        /**
         * never do this for pz / ms
         * discounted? yes
         * 2 cases: discounted, not discounted
         * discounted:
         *  label = discounted unit price
         *  price = price if product wasn't disocunted [always check for weight]
         *  discountedPrice = actual price [always check for weight]
         * 
         * no discounted:
         *  label = unit price
         *  price = discountedPrice always, so need to compute the real price with the weight
         * 
         * for sure i need the discount value and the weight
         * discounted:
         *  compute final price and check if equals price
         *      no: i have to check if its in between 15% (website errors, not mine)
         *          if it isn't, put everything as -1
         *      yes: check if price is right and compute the unit price
         *           so fill each one of the 4 prices fields
         * not discounted:
         *  compute final price if needed (weight); fill not disocunted price fields and the discounted at -1
         */

        function getProductQuantity(product: Product) {
            /**
             * total product = 14630
             * cases:
             * 1: intervals.length > 0 && (name contains the weight || number of elements) [20] => i'll use the intervals
             * 2: intervals.length = 0 && (name contains the weight || number of elements) [12106] => i'll use the value and unit fields
             * 3: intervals.length > 0 && (name do not contains the weight && number of elements) [617] => i'll use the intervals
             * 4: intervals.length = 0 && (name do not contains the weight && number of elements) [1887] => i'll use the value and unit fields
             * 
             * This means that the cases are just the following:
             * 1: intervals.length > 0 [637] => i'll use the intervals
             * 2: interrvals.length = 0 [13993] => i'll use the value and unit fields
             */
            const quantity = {
                value: 0,
                unit: '',
            }
            if (product.intervals.length > 0) {
                const quantities: number[] = [];
                let unit = '';
                product.intervals.forEach(quant => {
                    unit = quant?.ums?.name;
                    quantities.push(quant?.value);
                });
                quantity.value = quantities[0];
                quantity.unit = unit;
            } else {
                quantity.value = product.value;
                quantity.unit = product.unit;
            }
            //console.log('Quantity:', quantity);
            return quantity;
        }

        function getProductUnitPrice(label: string) {
            const unitPrice = {
                value: 0,
                unit: ''
            }
            const regex = /(\d+)[.|,](\d+)\s*€\s*\/\s*([a-zA-z]+)/
            const match = label.match(regex);
            if (!match || match.length != 4)
                return false;
            const int = parseInt(match[1]);
            const decimal = parseInt(match[2]) / 100;
            if (isNaN(int) || isNaN(decimal))
                return false;
            unitPrice.value = roundValue(int + decimal);
            unitPrice.unit = match[3];
            //console.log('Unit price:', unitPrice);
            return unitPrice;
        }

        function isProductDiscounted(productInfo: ProductInfo) {
            const { product, prices } = productInfo;
            const discount = {
                check: false,
                value: 0
            }
            //console.log('Values object', product.values);
            if (product.values.length === 0)
                return discount;
            const validDiscounts = [2, 3, 4, 15];
            product.values.forEach(prod => {
                if (!validDiscounts.includes(prod?.actionType))
                    return;
                const discountText: string = prod?.text;
                let discountValue = 0;
                const match = discountText.match(/scontato del (\d+) %/);
                if (match && match[1]) {
                    discountValue = parseInt(match[1]) / 100;
                }
                discount.check = true;
                discount.value = discountValue;
            });
            if (discount.check && !discount.value) {
                //console.log('No discount values found', discount.check, discount.value);
                const discountValue = 1 - prices.original_discounted_price / prices.original_price;
                discount.value = roundValue(discountValue, 10);
            }
            //console.log('Discount:', discount);
            return discount;
        }

        function unitConversion(value: number, unit: string, unitTarget: string) {
            const converter = new Converter(value, unit, unitTarget);
            const val = converter.convert();
            const newValue = roundValue(val, 1000);
            //console.log('Unit conversion:', newValue);
            return newValue;
        }

        function checkPrice(priceToCheck: number, targetPrice: number, unitPrice: number, quantity: number) {
            //const targetPriceQuantity = roundValue(priceToCheck / targetPrice);
            /**
             * This has to be check for these reasons:
             * it can happen that the quantity is different than one but the [disocunted] price is
             * still equals to the label [disocunted] unit price, so it has to be multiplied by
             * the quantity in order to be comparable to the priceToCheck value. 
             * eg: label = 1 euro / Kg, quantity: 0.5 Kg, discountedPrice = 1 euro
             * id compare 0.5 euro with 1 euro => discounted price and discounted unit price
             */
            const priceComputedWithQuantity = roundValue(targetPrice * quantity);
            //console.log('Price to check:', priceToCheck, ', target price:', targetPrice);
            if (priceToCheck === targetPrice)
                return priceToCheck;
            else if (targetPrice <= priceToCheck * 1.15 && targetPrice >= priceToCheck * 0.85)
                return targetPrice;
            else if (priceToCheck === priceComputedWithQuantity)
                return priceToCheck;
            else if (targetPrice <= priceComputedWithQuantity * 1.15 && targetPrice >= priceComputedWithQuantity * 0.85)
                return priceToCheck;
            console.warn('Edge case / external data error. Returning own price');
            return targetPrice;
        }

        function roundValue(num: number, value = 100) {
            return Math.round(num * value) / value;
        }

        function generateProductPrice(productInfo: ProductInfo) {
            const { product, prices: productPrices } = productInfo;
            const discount = isProductDiscounted(productInfo);
            const quantity = getProductQuantity(product);
            const unitPrice = getProductUnitPrice(productPrices.label);
            if (!unitPrice)
                throw new Error(`Error while parsing label string: ${productPrices.label}`);
            const convertedQuantity = unitConversion(quantity.value, quantity.unit, unitPrice.unit);
            //TODO check if you can do better with these two properties
            product.value = quantity.value;
            product.unit = quantity.unit;
            quantity.value = convertedQuantity;
            const prices = {
                finalPrice: -1,
                finalUnitPrice: -1,
                finalDiscountedPrice: -1,
                finalDiscountedUnitPrice: -1
            }
            if (discount.check) {
                /**
                 * discounted unit price => label
                 * discounted price => discounted unit price * quantity
                 * unit price => price
                 * price => unit price * quantity
                 */
                /* if (quantity.value != 1 && unitPrice.value === productInfo.prices.discounted_price) {
                    //sometimes the price sent by them is equal to the label even though the final price
                    //has to be computed with the quantity
                    prices.finalPrice = roundValue(productInfo.prices.price * quantity.value);
                    prices.finalUnitPrice = productInfo.prices.price;
                    prices.finalDiscountedPrice = roundValue(unitPrice.value * quantity.value);
                    prices.finalDiscountedUnitPrice = unitPrice.value;
                } else {
                    const discountedPrice = unitPrice.value * quantity.value;
                    const price = discountedPrice / (1 - discount.value);
                    console.log('Values', price, discountedPrice, discount.value, unitPrice.value, quantity.value);
                    prices.finalPrice = check Price(price, productInfo.prices.price);
                    prices.finalUnitPrice = prices.finalPrice / quantity.value;
                    prices.finalDiscountedPrice = check Price(discountedPrice, productInfo.prices.discounted_price);
                    prices.finalDiscountedUnitPrice = unitPrice.value;
                } */
                const discountedPrice = roundValue(unitPrice.value * quantity.value);
                const price = roundValue(discountedPrice / (1 - discount.value));
                //console.log('Discounted values', price, discountedPrice, discount.value, unitPrice.value, quantity.value);
                prices.finalPrice = checkPrice(price, productPrices.original_price, unitPrice.value, quantity.value);
                prices.finalUnitPrice = roundValue(prices.finalPrice / quantity.value);
                prices.finalDiscountedPrice = checkPrice(discountedPrice, productPrices.original_discounted_price, unitPrice.value, quantity.value);
                prices.finalDiscountedUnitPrice = unitPrice.value;
            } else {
                /**
                 * unit price => label
                 * price => unit price * quantity
                 */
                const price = roundValue(unitPrice.value * quantity.value);
                //console.log('Non Discounted values', price, unitPrice.value, quantity.value);
                prices.finalPrice = checkPrice(price, productPrices.original_price, unitPrice.value, quantity.value);
                prices.finalUnitPrice = unitPrice.value;
            }
            //console.log('Final prices:', prices);
            return prices;
        }
    });
});