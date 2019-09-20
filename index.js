/* eslint-disable no-console, no-continue */

const zlib = require('zlib');
const util = require('util');
const crypto = require('crypto');
const fs = require('fs');

const Compression = {
  gzip: util.promisify(zlib.gzip),
  gunzip: util.promisify(zlib.gunzip),
  brotliCompress: util.promisify(zlib.brotliCompress),
  brotliDecompress: util.promisify(zlib.brotliDecompress),
  gzipSync: zlib.gzipSync,
  gunzipSync: zlib.gunzipSync,
  brotliCompressSync: zlib.brotliCompressSync,
  brotliDecompressSync: zlib.brotliDecompressSync,
  gzipConfig: {
    flush: zlib.constants.Z_NO_FLUSH,
    level: zlib.constants.Z_BEST_COMPRESSION,
    memLevel: zlib.constants.Z_BEST_COMPRESSION,
    strategy: zlib.constants.Z_DEFAULT_STRATEGY,
    info: false,
  },
  brotliConfig: {
    params: {
      [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
      [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
      [zlib.constants.BROTLI_PARAM_LGWIN]: zlib.constants.BROTLI_MAX_WINDOW_BITS,
      [zlib.constants.BROTLI_PARAM_LGBLOCK]: zlib.constants.BROTLI_MAX_INPUT_BLOCK_BITS,
    },
  },
};

const acceptedItemFieldTypes = ['boolean', 'number', 'string'];

const isValidObject = (value) => {
  if (typeof value !== 'object') {
    return false;
  }
  if (value === null) {
    return false;
  }
  return true;
};

const isValidNonEmptyString = (value) => {
  if (typeof value !== 'string') {
    return false;
  }
  if (value === '') {
    return false;
  }
  return true;
};

const isValidNumber = (value) => {
  if (typeof value !== 'number') {
    return false;
  }
  if (Number.isNaN(value) === true) {
    return false;
  }
  if (Number.isFinite(value) === false) {
    return false;
  }
  return true;
};

const isValidInteger = (value) => {
  if (isValidNumber(value) === false) {
    return false;
  }
  if (Math.floor(value) !== value) {
    return false;
  }
  return true;
};


/**
 * Query spec:
 * - should be a functional approach
 * - must not recreate new function instances
 * - instead we just replace the array we are using internally
 * const results = Query
 *  .using(table)
 *  .ascend('property')
 *  .results();
 */

let internalQueryDataList;
let internalQueryItemFieldDictionary;
let internalQueryItemFieldTypeDictionary;
let internalQueryFieldList;
let internalQueryLimit = Infinity;
let internalQueryOffset = 0;
let internalQueryPage = 0;
const Query = {

  // SORTS

  // FILTERS
  gt: (field, value) => {
    if (isValidNonEmptyString(field) === false) {
      throw Error('gt :: 1st parameter "field" must be a non-empty string');
    }
    if (isValidNumber(value) === false) {
      throw Error('gt :: 2nd parameter "value" must be a valid number');
    }
    if (internalQueryFieldList.includes(field) === false) {
      throw Error(`gt :: unexpected field "${field}", expecting "${internalQueryFieldList.join(', ')}"`);
    }
    if (internalQueryItemFieldTypeDictionary[field] !== 'number') {
      throw Error(`gt :: unexpected "${field}", expecting field with "number" type, not "${internalQueryItemFieldTypeDictionary[field]}""`);
    }
    const tempQueryDataList = internalQueryDataList;
    internalQueryDataList = [];
    const itemFieldIndex = internalQueryItemFieldDictionary[field];
    for (let i = 0, l = tempQueryDataList.length; i < l; i += 1) {
      if (tempQueryDataList[i][itemFieldIndex] > value) {
        internalQueryDataList.push(tempQueryDataList[i]);
      }
    }
    return Query;
  },
  gte: (field, value) => {
    if (isValidNonEmptyString(field) === false) {
      throw Error('gte :: 1st parameter "field" must be a non-empty string');
    }
    if (isValidNumber(value) === false) {
      throw Error('gte :: 2nd parameter "value" must be a valid number');
    }
    if (internalQueryFieldList.includes(field) === false) {
      throw Error(`gte :: unexpected field "${field}", expecting "${internalQueryFieldList.join(', ')}"`);
    }
    if (internalQueryItemFieldTypeDictionary[field] !== 'number') {
      throw Error(`gte :: unexpected "${field}", expecting field with "number" type, not "${internalQueryItemFieldTypeDictionary[field]}""`);
    }
    const tempQueryDataList = internalQueryDataList;
    internalQueryDataList = [];
    const itemFieldIndex = internalQueryItemFieldDictionary[field];
    for (let i = 0, l = tempQueryDataList.length; i < l; i += 1) {
      if (tempQueryDataList[i][itemFieldIndex] >= value) {
        internalQueryDataList.push(tempQueryDataList[i]);
      }
    }
    return Query;
  },
  lt: (field, value) => {
    if (isValidNonEmptyString(field) === false) {
      throw Error('lt :: 1st parameter "field" must be a non-empty string');
    }
    if (isValidNumber(value) === false) {
      throw Error('lt :: 2nd parameter "value" must be a valid number');
    }
    if (internalQueryFieldList.includes(field) === false) {
      throw Error(`lt :: unexpected field "${field}", expecting "${internalQueryFieldList.join(', ')}"`);
    }
    if (internalQueryItemFieldTypeDictionary[field] !== 'number') {
      throw Error(`lt :: unexpected "${field}", expecting field with "number" type, not "${internalQueryItemFieldTypeDictionary[field]}""`);
    }
    const tempQueryDataList = internalQueryDataList;
    internalQueryDataList = [];
    const itemFieldIndex = internalQueryItemFieldDictionary[field];
    for (let i = 0, l = tempQueryDataList.length; i < l; i += 1) {
      if (tempQueryDataList[i][itemFieldIndex] < value) {
        internalQueryDataList.push(tempQueryDataList[i]);
      }
    }
    return Query;
  },
  lte: (field, value) => {
    if (isValidNonEmptyString(field) === false) {
      throw Error('lte :: 1st parameter "field" must be a non-empty string');
    }
    if (isValidNumber(value) === false) {
      throw Error('lte :: 2nd parameter "value" must be a valid number');
    }
    if (internalQueryFieldList.includes(field) === false) {
      throw Error(`lte :: unexpected field "${field}", expecting "${internalQueryFieldList.join(', ')}"`);
    }
    if (internalQueryItemFieldTypeDictionary[field] !== 'number') {
      throw Error(`lte :: unexpected "${field}", expecting field with "number" type, not "${internalQueryItemFieldTypeDictionary[field]}""`);
    }
    const tempQueryDataList = internalQueryDataList;
    internalQueryDataList = [];
    const itemFieldIndex = internalQueryItemFieldDictionary[field];
    for (let i = 0, l = tempQueryDataList.length; i < l; i += 1) {
      if (tempQueryDataList[i][itemFieldIndex] <= value) {
        internalQueryDataList.push(tempQueryDataList[i]);
      }
    }
    return Query;
  },
  eq: (field, value) => {
    if (isValidNonEmptyString(field) === false) {
      throw Error('eq :: 1st parameter "field" must be a non-empty string');
    }
    if (isValidNumber(value) === false) {
      throw Error('eq :: 2nd parameter "value" must be a valid number');
    }
    if (internalQueryFieldList.includes(field) === false) {
      throw Error(`eq :: unexpected field "${field}", expecting "${internalQueryFieldList.join(', ')}"`);
    }
    const tempQueryDataList = internalQueryDataList;
    internalQueryDataList = [];
    const itemFieldIndex = internalQueryItemFieldDictionary[field];
    for (let i = 0, l = tempQueryDataList.length; i < l; i += 1) {
      if (tempQueryDataList[i][itemFieldIndex] === value) {
        internalQueryDataList.push(tempQueryDataList[i]);
      }
    }
    return Query;
  },
  neq: (field, value) => {
    if (isValidNonEmptyString(field) === false) {
      throw Error('neq :: 1st parameter "field" must be a non-empty string');
    }
    if (isValidNumber(value) === false) {
      throw Error('neq :: 2nd parameter "value" must be a valid number');
    }
    if (internalQueryFieldList.includes(field) === false) {
      throw Error(`neq :: unexpected field "${field}", expecting "${internalQueryFieldList.join(', ')}"`);
    }
    const tempQueryDataList = internalQueryDataList;
    internalQueryDataList = [];
    const itemFieldIndex = internalQueryItemFieldDictionary[field];
    for (let i = 0, l = tempQueryDataList.length; i < l; i += 1) {
      if (tempQueryDataList[i][itemFieldIndex] !== value) {
        internalQueryDataList.push(tempQueryDataList[i]);
      }
    }
    return Query;
  },

  // PAGINATION
  limit: (value) => {
    // value integer, greater than zero
    internalQueryLimit = value;
    return Query;
  },
  offset: (value) => {
    // require limit first
    // page must not be set
    // value integer, greater than zero
    internalQueryOffset = value;
    return Query;
  },
  page: (value) => {
    // require limit first
    // offset must not be set
    // value integer, greater than zero
    internalQueryPage = value;
    return Query;
  },

  // RESULTS
  results: () => {
    // apply sorts and filters

    // apply pagination
    if (Number.isFinite(internalQueryLimit) === true) {
      if (internalQueryOffset > 0) {
        internalQueryDataList = internalQueryDataList.slice(internalQueryOffset, internalQueryOffset + internalQueryLimit);
      } else if (internalQueryPage > 0) {
        internalQueryDataList = internalQueryDataList.slice(internalQueryLimit * internalQueryPage, (internalQueryLimit * internalQueryPage) + internalQueryLimit);
      } else {
        internalQueryDataList = internalQueryDataList.slice(0, internalQueryLimit);
      }
    }

    // hydrate and return
    const hydratedItems = internalQueryDataList.map((existingItem) => {
      const temporaryItem = {};
      for (let i = 0, l = internalQueryFieldList.length; i < l; i += 1) {
        temporaryItem[internalQueryFieldList[i]] = existingItem[i];
      }
      return temporaryItem;
    });
    return hydratedItems;
  },
};

function Table(label, itemSchema, initialSaveTimeout, forcedSaveTimeout) {
  // PARAMETER TYPE CHECKS
  if (isValidNonEmptyString(label) === false) {
    throw Error(`new Table(${label}, ${JSON.stringify(itemSchema)}, ${initialSaveTimeout}, ${forcedSaveTimeout}): 1st parameter "label" must be a non-empty string.`);
  }
  if (isValidObject(itemSchema) === false) {
    throw Error(`new Table(${label}, ${JSON.stringify(itemSchema)}, ${initialSaveTimeout}, ${forcedSaveTimeout}): 2nd parameter "itemSchema" must be a plain object.`);
  }
  if (itemSchema.id !== undefined) {
    throw Error(`new Table(${label}, ${JSON.stringify(itemSchema)}, ${initialSaveTimeout}, ${forcedSaveTimeout}): "id" property in 2nd parameter "itemSchema" must be undefined.`);
  }
  if (initialSaveTimeout !== undefined && isValidInteger(initialSaveTimeout) === false) {
    throw Error(`new Table(${label}, ${JSON.stringify(itemSchema)}, ${initialSaveTimeout}, ${forcedSaveTimeout}): 3rd parameter "initialSaveTimeout" must be an integer.`);
  }
  if (forcedSaveTimeout !== undefined && isValidInteger(forcedSaveTimeout) === false) {
    throw Error(`new Table(${label}, ${JSON.stringify(itemSchema)}, ${initialSaveTimeout}, ${forcedSaveTimeout}): 3rd parameter "forcedSaveTimeout" must be an integer.`);
  }

  // INTERNAL VARIABLES
  const internalOldPath = `./tables/${label}-old.json`;
  const internalTempPath = `./tables/${label}-temp.json`;
  const internalMainPath = `./tables/${label}-main.json`;
  let internalDataList = [];
  let internalDataDictionary = {};

  // FILE LOADING & INITIALIZATION
  if (fs.existsSync('./tables') === false) {
    fs.mkdirSync('./tables', { recursive: true });
    console.log('Table: "./tables" directory created.');
  }
  if (fs.existsSync(internalMainPath) === true) {
    try {
      const stringifiedItems = fs.readFileSync(internalMainPath, { encoding: 'utf8' });
      const parsedItems = JSON.parse(stringifiedItems);
      if (Array.isArray(parsedItems) === false) {
        throw Error('Unexpected non-array parsed data.');
      }
      for (let i = 0, l = parsedItems.length; i < l; i += 1) {
        const parsedItem = parsedItems[i];
        internalDataList.push(parsedItem);
        internalDataDictionary[parsedItem[0]] = parsedItem;
      }
      console.log(`Table: Loaded ${internalDataList.length} items.`);
    } catch (e) {
      throw Error(`Table: Load error, ${e.message}`);
    }
  } else {
    fs.writeFileSync(internalMainPath, JSON.stringify(internalDataList));
    console.log(`Table: File created at "${internalMainPath}".`);
  }

  // MORE INTERNAL VARIABLES
  const internalItemFieldList = ['id', ...Object.keys(itemSchema)];
  const internalItemFieldDictionary = { id: 0 };
  const internalItemFieldTypeList = ['string'];
  const internalItemFieldTypeDictionary = { id: 'string' };
  const internalInitialSaveTimeout = initialSaveTimeout || 5000;
  const internalForcedSaveTimeout = forcedSaveTimeout || 300000;
  for (let i = 0, l = internalItemFieldList.length; i < l; i += 1) {
    const itemField = internalItemFieldList[i];
    if (itemField === 'id') {
      continue;
    }
    const itemFieldType = itemSchema[itemField];
    if (acceptedItemFieldTypes.includes(itemFieldType) === false) {
      throw Error(`new Table(${label}, ${JSON.stringify(itemSchema)}, ${initialSaveTimeout}, ${forcedSaveTimeout}): Unexpected "${itemFieldType}" type for "${itemField}" field, expecting "${acceptedItemFieldTypes.join(', ')}"`);
    }
    internalItemFieldDictionary[itemField] = i;
    internalItemFieldTypeList[i] = itemFieldType;
    internalItemFieldTypeDictionary[itemField] = itemFieldType;
  }

  // TIMEOUT-BASED SAVING
  let internalCurrentSaveTimeout;
  let internalCurrentForceSaveTimeout;
  process.on('SIGINT', () => {
    console.log('Table: SIGINT received.');
    try {
      if (internalCurrentSaveTimeout !== undefined) {
        clearTimeout(internalCurrentSaveTimeout);
      }
      if (internalCurrentForceSaveTimeout !== undefined) {
        clearTimeout(internalCurrentForceSaveTimeout);
      }
      fs.renameSync(internalMainPath, internalOldPath);
      fs.writeFileSync(internalTempPath, JSON.stringify(internalDataList));
      fs.writeFileSync(internalMainPath, JSON.stringify(internalDataList));
      console.log('Table: Graceful successful.');
    } catch (e) {
      console.error(`Table: Graceful save error: ${e.message}`);
      process.exit(1);
    }
    process.exit(0);
  });
  const internalInitSaveTimeout = () => {
    if (internalCurrentSaveTimeout !== undefined) {
      clearTimeout(internalCurrentSaveTimeout);
    }
    if (internalCurrentForceSaveTimeout === undefined) {
      internalCurrentForceSaveTimeout = setTimeout(() => {
        clearTimeout(internalCurrentSaveTimeout);
        fs.renameSync(internalMainPath, internalOldPath);
        fs.writeFileSync(internalTempPath, JSON.stringify(internalDataList));
        fs.writeFileSync(internalMainPath, JSON.stringify(internalDataList));
        internalCurrentSaveTimeout = undefined;
        internalCurrentForceSaveTimeout = undefined;
      }, internalForcedSaveTimeout);
    }
    internalCurrentSaveTimeout = setTimeout(() => {
      clearTimeout(internalCurrentForceSaveTimeout);
      fs.renameSync(internalMainPath, internalOldPath);
      fs.writeFileSync(internalTempPath, JSON.stringify(internalDataList));
      fs.writeFileSync(internalMainPath, JSON.stringify(internalDataList));
      internalCurrentSaveTimeout = undefined;
      internalCurrentForceSaveTimeout = undefined;
    }, internalInitialSaveTimeout);
  };

  // FUNCTIONS
  this.query = () => {
    internalQueryDataList = internalDataList;
    internalQueryItemFieldDictionary = internalItemFieldDictionary;
    internalQueryFieldList = internalItemFieldList;
    internalQueryItemFieldTypeDictionary = internalItemFieldTypeDictionary;
    internalQueryLimit = Infinity;
    internalQueryOffset = 0;
    internalQueryPage = 0;
    return Query;
  };
  this.id = () => {
    let itemId = crypto.randomBytes(16).toString('hex');
    while (internalDataDictionary[itemId] !== undefined) {
      itemId = crypto.randomBytes(16).toString('hex');
    }
    return itemId;
  };
  this.clear = () => {
    internalDataList = [];
    internalDataDictionary = {};
    internalInitSaveTimeout();
    return this;
  };
  this.add = (itemSource) => {
    const itemSourceKeys = Object.keys(itemSource);
    const itemRecord = new Array(internalItemFieldList.length);
    for (let i = 0, l = internalItemFieldList.length; i < l; i += 1) {
      const itemField = internalItemFieldList[i];
      const itemFieldType = internalItemFieldTypeList[i];
      const itemSourceFieldValue = itemSource[itemField];
      switch (itemFieldType) {
        case 'number': {
          if (itemSourceFieldValue === undefined) {
            itemRecord[i] = 0;
            break;
          }
          if (isValidNumber(itemSourceFieldValue) === false) {
            throw Error(`add :: expecting number for "${itemField}" field`);
          }
          break;
        }
        case 'string': {
          if (itemSourceFieldValue === undefined) {
            if (itemField === 'id') {
              throw Error('add :: expecting non-undefined "id" field');
            }
            itemRecord[i] = '';
            break;
          }
          if (typeof itemSourceFieldValue !== 'string') {
            throw Error(`add :: expecting string for "${itemField}" field`);
          }
          if (itemField === 'id') {
            if (itemSourceFieldValue === '') {
              throw Error('add :: expecting non-empty "id" field');
            }
            if (internalDataDictionary[itemSourceFieldValue] !== undefined) {
              throw Error('add :: expecting non-existing "id" field');
            }
          }
          break;
        }
        case 'boolean': {
          if (itemSourceFieldValue === undefined) {
            itemRecord[i] = false;
            break;
          }
          if (typeof itemSourceFieldValue !== 'boolean') {
            throw Error(`add :: expecting boolean for "${itemField}" field`);
          }
          break;
        }
        default: {
          throw Error(`add :: internal error, unexpected "${itemFieldType}" type.`);
        }
      }
      if (itemSourceFieldValue !== undefined) {
        itemRecord[i] = itemSourceFieldValue;
        itemSourceKeys.splice(itemSourceKeys.indexOf(itemField), 1);
      }
    }
    if (itemSourceKeys.length > 0) {
      throw Error(`add :: unexpected "${itemSourceKeys.join(', ')}" fields`);
    }
    internalDataList.push(itemRecord);
    internalDataDictionary[itemRecord[0]] = itemRecord;
    internalInitSaveTimeout();
    return this;
  };
  this.update = (itemSource) => {
    const itemSourceKeys = Object.keys(itemSource);
    const itemRecord = new Array(internalItemFieldList.length);
    for (let i = 0, l = internalItemFieldList.length; i < l; i += 1) {
      const itemField = internalItemFieldList[i];
      const itemFieldType = internalItemFieldTypeList[i];
      const itemSourceFieldValue = itemSource[itemField];
      switch (itemFieldType) {
        case 'number': {
          if (itemSourceFieldValue === undefined) {
            itemRecord[i] = 0;
            break;
          }
          if (isValidNumber(itemSourceFieldValue) === false) {
            throw Error(`update :: expecting number for "${itemField}" field`);
          }
          break;
        }
        case 'string': {
          if (itemSourceFieldValue === undefined) {
            if (itemField === 'id') {
              throw Error('update :: expecting non-undefined "id" field');
            }
            itemRecord[i] = '';
            break;
          }
          if (typeof itemSourceFieldValue !== 'string') {
            throw Error(`update :: expecting string for "${itemField}" field`);
          }
          if (itemField === 'id') {
            if (itemSourceFieldValue === '') {
              throw Error('update :: expecting non-empty "id" field');
            }
            if (internalDataDictionary[itemSourceFieldValue] === undefined) {
              throw Error('update :: expecting "id" field to match existing items');
            }
          }
          break;
        }
        case 'boolean': {
          if (itemSourceFieldValue === undefined) {
            itemRecord[i] = false;
            break;
          }
          if (typeof itemSourceFieldValue !== 'boolean') {
            throw Error(`add :: expecting boolean for "${itemField}" field`);
          }
          break;
        }
        default: {
          throw Error(`add :: internal error, unexpected "${itemFieldType}" type.`);
        }
      }
      if (itemSourceFieldValue !== undefined) {
        itemRecord[i] = itemSourceFieldValue;
        itemSourceKeys.splice(itemSourceKeys.indexOf(itemField), 1);
      }
    }
    if (itemSourceKeys.length > 0) {
      throw Error(`add :: unexpected "${itemSourceKeys.join(', ')}" fields`);
    }
    const itemId = itemRecord[0];
    const existingItem = internalDataDictionary[itemId];
    internalDataList[internalDataList.indexOf(existingItem)] = itemRecord;
    internalDataDictionary[itemId] = itemRecord;
    internalInitSaveTimeout();
    return this;
  };
  this.get = (itemId) => {
    if (isValidNonEmptyString(itemId) === false) {
      throw Error('get :: 1st parameter "itemId" must be a non-empty string.');
    }
    const existingItem = internalDataDictionary[itemId];
    if (existingItem === undefined) {
      throw Error(`get :: "${itemId}" itemId not found.`);
    }
    const temporaryItem = {};
    for (let i = 0, l = internalItemFieldList.length; i < l; i += 1) {
      temporaryItem[internalItemFieldList[i]] = existingItem[i];
    }
    return temporaryItem;
  };
  this.delete = (itemId) => {
    if (isValidNonEmptyString(itemId) === false) {
      throw Error('delete :: 1st parameter "itemId" must be a non-empty string.');
    }
    const existingItem = internalDataDictionary[itemId];
    if (existingItem === undefined) {
      throw Error(`delete :: "${itemId}" itemId not found.`);
    }
    internalDataList.splice(internalDataList.indexOf(existingItem), 1);
    delete internalDataDictionary[itemId];
    internalInitSaveTimeout();
    return this;
  };
  this.increment = (itemId, itemField) => {
    if (isValidNonEmptyString(itemId) === false) {
      throw Error('incrementItemField :: 1st parameter "itemId" must be a non-empty string.');
    }
    if (isValidNonEmptyString(itemField) === false) {
      throw Error('incrementItemField :: 2nd parameter "itemField" must be a non-empty string.');
    }
    if (internalItemFieldList.includes(itemField) === false) {
      throw Error(`incrementItemField :: unexpected "${itemField}", expecting "${internalItemFieldList.join(', ')}"`);
    }
    if (internalItemFieldTypeDictionary[itemField] !== 'number') {
      throw Error(`incrementItemField :: unexpected "${itemField}", expecting field with "number" type, not "${internalItemFieldTypeDictionary[itemField]}"`);
    }
    const existingItem = internalDataDictionary[itemId];
    if (existingItem === undefined) {
      throw Error(`incrementItemField :: "${itemId}" itemId not found.`);
    }
    existingItem[internalItemFieldDictionary[itemField]] += 1;
    internalInitSaveTimeout();
    return this;
  };
  this.decrement = (itemId, itemField) => {
    if (isValidNonEmptyString(itemId) === false) {
      throw Error('incrementItemField :: 1st parameter "itemId" must be a non-empty string.');
    }
    if (isValidNonEmptyString(itemField) === false) {
      throw Error('incrementItemField :: 2nd parameter "itemField" must be a non-empty string.');
    }
    if (internalItemFieldList.includes(itemField) === false) {
      throw Error(`incrementItemField :: unexpected "${itemField}", expecting "${internalItemFieldList.join(', ')}"`);
    }
    if (internalItemFieldTypeDictionary[itemField] !== 'number') {
      throw Error(`incrementItemField :: unexpected "${itemField}", expecting field with "number" type, not "${internalItemFieldTypeDictionary[itemField]}"`);
    }
    const existingItem = internalDataDictionary[itemId];
    if (existingItem === undefined) {
      throw Error(`incrementItemField :: "${itemId}" itemId not found.`);
    }
    existingItem[internalItemFieldDictionary[itemField]] -= 1;
    internalInitSaveTimeout();
    return this;
  };
  this.has = (itemId) => {
    if (isValidNonEmptyString(itemId) === false) {
      throw Error('has :: 1st parameter "itemId" must be a non-empty string.');
    }
    return internalDataDictionary[itemId] !== undefined;
  };

  // STALE FUNCTIONS
  this.queryItems = (resultLimit, resultPageOffset) => {
    if (isValidInteger(resultLimit) === false) {
      throw Error(`queryItems(${resultLimit}, ${resultPageOffset}): 1st parameter "resultLimit" must be an integer.`);
    }
    if (isValidInteger(resultPageOffset) === false) {
      throw Error(`queryItems(${resultLimit}, ${resultPageOffset}): 2nd parameter "resultPageOffset" must be an integer.`);
    }
    return internalDataList.slice(resultLimit * resultPageOffset, (resultLimit * resultPageOffset) + resultLimit);
  };
}


/**
 * - add, increment, decrement, has, delete, get, query
 * - Consistent base types: string, number, boolean
 * - Automatic defaults, string: '', number: 0, boolean: false
 * - Queries are designed to be used synchronously
 * - Queries provide strong consistency
 */

const table = new Table('yeh', { age: 'number' }, 100);

for (let i = 0, l = 100; i < l; i += 1) {
  table.add({ id: table.id(), age: i });
}
const results = table
  .query()
  .gt('age', 5)
  .limit(10)
  .results();
console.log(results);

table.clear();
