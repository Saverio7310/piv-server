import assert from 'assert';

describe('queue example', function () {
    let array: any = [];
    it('should create the indexes array', function () {
        const indexesObject = {
            start: 0,
            end: 100,
            offset: 100
        };
        const indexesObjects = []
        indexesObjects.push(indexesObject);
        let limit = 1000;
        while (true) {
            const newObject: any = { ...indexesObjects.at(indexesObjects.length - 1) };
            newObject.start = newObject.end;
            newObject.end += newObject.offset;
            if (newObject.end > limit)
                break;
            indexesObjects.push(newObject);
        }
        array = indexesObjects;
        assert.equal(indexesObjects.length, 10);
    });

    it('should create the indexes array 2', function () {
        function getIndexesArray(startingObject: any, length: number, limit: number) {
            const array = [];
            array.push(startingObject);
            while (array.length !== length) {
                const newObject: any = { ...array.at(array.length - 1) };
                newObject.start = newObject.end;
                newObject.end += limit * newObject.offset;
                array.push(newObject);
            }
            return array;
        }
        const indexesObject = {
            start: 0,
            end: 495,
            offset: 15
        };
        const array = getIndexesArray(indexesObject, 28, 33);
        console.log(array);
        
        assert.equal(array.length, 28);
    });

    it.skip('should', function () {
        function success() {
            const val = Math.floor(Math.random() * 10);
            return val > 4;
        }
        while (array.length != 0) {
            const obj = array.shift();
            const check = success();
            if (!check) {
                array.push(obj);
            }
            console.log(array);
        }

        assert.equal(array.length, 0);
    });

    it('should knoe what iterators return', function () {
        function* gen() {
            for (let i = 0; i < 5; i++) {
                yield i;
            }
        }
        const generator = gen();
        for (let i = 0; i < 6; i++) {
            const val = generator.next();
            console.log(val);
        }

        assert.ok(true);
    });
});