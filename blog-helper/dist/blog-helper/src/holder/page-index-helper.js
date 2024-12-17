import { createArrayHashFunctionAdapter, genericArrayHashFunction, genericValueHashFunction } from './util.js';

const createPageIndexHelper = (items, indexHolder, hashFunctions) => {
    // id 索引
    const idIndex = new Map();
    for (let item of items) {
        idIndex.set(item.id, item);
    }
    return {
        getById(id) {
            return idIndex.get(id);
        },
        listAll() {
            return items;
        },
        getByIndex(index, key) {
            const hashFunc = hashFunctions[index];
            if (!hashFunc) {
                throw new Error(`No index has been build for ${String(index)}`);
            }
            const hashKey = hashFunc(key);
            // @ts-ignore
            return indexHolder[index]?.[hashKey] ?? [];
        }
    };
};
const ERR_MSG = "Only array type can be used on this method!";
const createPageWithIndexBuilder = (items) => {
    const indexHolder = {};
    const hashFunctions = {};
    function addIndex0(_key, castFunc, arrayFlag = false) {
        // 声明一时爽，'代码'火葬场...
        if (_key === ERR_MSG) {
            throw Error('Only array type can be applied to this method.');
        }
        const key = _key;
        let target = indexHolder[key];
        if (!target) {
            target = {};
            indexHolder[key] = target;
        }
        let hashFunction;
        if (arrayFlag) {
            // @ts-ignore
            hashFunction = castFunc ? createArrayHashFunctionAdapter(castFunc) : genericArrayHashFunction;
        }
        else {
            // @ts-ignore
            hashFunction = castFunc ?? genericValueHashFunction;
        }
        hashFunctions[key] = hashFunction;
        for (let item of items) {
            const metadataValue = item.metadata[key];
            if (metadataValue === undefined) {
                continue;
            }
            let hashKey = hashFunction(metadataValue);
            let holder = target[hashKey];
            if (!holder) {
                holder = [];
                target[hashKey] = holder;
            }
            holder.push(item);
        }
    }
    return {
        addIndex(key, castFunc) {
            addIndex0(key, castFunc);
            return this;
        },
        addIndexForArray(key, valueToString) {
            addIndex0(key, valueToString, true);
            return this;
        },
        build() {
            return createPageIndexHelper(items, indexHolder, hashFunctions);
        }
    };
};

export { createPageWithIndexBuilder };
