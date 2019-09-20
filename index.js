/* eslint-disable no-console */

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

let selectedTableForQuery;
const Query = {
  using: (table) => {
    selectedTableForQuery = table;
    return Query;
  },
  results: () => selectedTableForQuery,
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
  const internalDataList = [];
  const internalDataDictionary = {};

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
  const internalItemFields = ['id', ...Object.keys(itemSchema)];
  const internalItemFieldReverseIndex = { id: 0 };
  const internalItemFieldTypes = { id: 'string' };
  const internalItemFieldTypesReverseIndex = { 0: 'string' };
  const internalInitialSaveTimeout = initialSaveTimeout || 5000;
  const internalForcedSaveTimeout = forcedSaveTimeout || 300000;
  for (let i = 1, l = internalItemFields.length; i <= l; i += 1) {
    // i =1 & i <= l since we want to skip first field: "id"
    const itemField = internalItemFields[i];
    const itemFieldType = itemSchema[itemField];
    if (acceptedItemFieldTypes.includes(itemFieldType) === false) {
      throw Error(`new Table(${label}, ${JSON.stringify(itemSchema)}, ${initialSaveTimeout}, ${forcedSaveTimeout}): Unexpected "${itemFieldType}" type for "${itemField}" field, expecting "${acceptedItemFieldTypes.join(', ')}"`);
    }
    internalItemFieldReverseIndex[itemField] = i;
    internalItemFieldTypes[itemField] = itemFieldType;
    internalItemFieldTypesReverseIndex[i] = itemFieldType;
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

  // PUBLIC FUNCTIONS
  this.queryItems = (resultLimit, resultPageOffset) => {
    if (isValidInteger(resultLimit) === false) {
      throw Error(`queryItems(${resultLimit}, ${resultPageOffset}): 1st parameter "resultLimit" must be an integer.`);
    }
    if (isValidInteger(resultPageOffset) === false) {
      throw Error(`queryItems(${resultLimit}, ${resultPageOffset}): 2nd parameter "resultPageOffset" must be an integer.`);
    }
    return internalDataList.slice(resultLimit * resultPageOffset, (resultLimit * resultPageOffset) + resultLimit);
  };
  this.increment = (itemId, itemField) => {
    if (isValidNonEmptyString(itemId) === false) {
      throw Error(`incrementItemField(${itemId}, ${itemField}): 1st parameter "itemId" must be a non-empty string.`);
    }
    if (isValidNonEmptyString(itemField) === false) {
      throw Error(`incrementItemField(${itemId}, ${itemField}): 2nd parameter "itemField" must be a non-empty string.`);
    }
    if (internalItemFields.includes(itemField) === false) {
      throw Error(`incrementItemField(${itemId}, ${itemField}): unexpected "${itemField}", expecting "${internalItemFields.join(', ')}"`);
    }
    if (internalItemFieldTypes[itemField] !== 'number') {
      throw Error(`incrementItemField(${itemId}, ${itemField}): unexpected "${itemField}", expecting field with "number" type, not "${internalItemFieldTypes[itemField]}"`);
    }
    const existingItem = internalDataDictionary[itemId];
    if (existingItem === undefined) {
      throw Error(`incrementItemField(${itemId}, ${itemField}): "${itemId}" itemId not found.`);
    }
    existingItem[internalItemFieldReverseIndex[itemField] + 1] += 1;
    internalInitSaveTimeout();
    return this;
  };
  this.insert = (itemSource) => {
    const itemSourceKeys = Object.keys(itemSource);
    const itemRecord = new Array(internalItemFields.length);
    for (let i = 0, l = internalItemFields.length; i < l; i += 1) {
      const itemField = internalItemFields[i];
      const itemFieldType = internalItemFieldTypes[i];
      const itemSourceFieldValue = itemSource[itemField];
      switch (itemFieldType) {
        case 'number': {
          if (itemSourceFieldValue === undefined) {
            itemRecord[i] = 0;
            break;
          }
          if (isValidNumber(itemSourceFieldValue) === false) {
            throw Error('insert :: expecting number');
          }
          break;
        }
        case 'string': {
          if (itemSourceFieldValue === undefined) {
            if (itemField === 'id') {
              // TODO: LOOP-CHECK TO PREVENT DUPLICATE ID
              itemRecord[i] = crypto.randomBytes(16).toString('hex');
              break;
            }
            itemRecord[i] = '';
            break;
          }
          if (typeof itemSourceFieldValue !== 'string') {
            throw Error('insert :: expecting string');
          }
          if (itemField === 'id') {
            if (itemSourceFieldValue === '') {
              throw Error('insert :: expecting non-empty id');
            }
            if (internalDataDictionary[itemSourceFieldValue] !== undefined) {
              throw Error('insert :: expecting non-existing id');
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
            throw Error('insert :: expecting boolean');
          }
          break;
        }
        default: {
          throw Error('insert :: internal error, unexpected type.');
        }
      }
      if (itemSourceFieldValue !== undefined) {
        itemRecord[i] = itemSourceFieldValue;
        itemSourceKeys.splice(itemSourceKeys.indexOf(itemField), 1);
      }
    }
    if (itemSourceKeys.length > 0) {
      throw Error('insert :: unexpected key');
    }
    internalDataList.push(itemRecord);
    internalDataDictionary[itemRecord[0]] = internalDataList[internalDataList.length - 1];
    internalInitSaveTimeout();
    return this;
  };
  this.removeItem = (itemId) => {
    if (isValidNonEmptyString(itemId) === false) {
      throw Error(`removeItem(${itemId}): 1st parameter "itemId" must be a non-empty string.`);
    }
    const existingItem = internalDataList.find((item) => item[0] === itemId);
    if (existingItem === undefined) {
      throw Error(`removeItem(${itemId}): "${itemId}" itemId not found.`);
    }
    internalDataList.splice(internalDataList.indexOf(existingItem), 1);
    delete internalDataDictionary[itemId];
    internalInitSaveTimeout();
    return this;
  };
  this.findItem = (itemId) => {
    if (isValidNonEmptyString(itemId) === false) {
      throw Error(`findItem(${itemId}): 1st parameter "itemId" must be a non-empty string.`);
    }
    const existingItem = internalDataDictionary[itemId];
    if (existingItem === undefined) {
      throw Error(`findItem(${itemId}): "${itemId}" itemId not found.`);
    }
    const tempItem = {};
    for (let i = 0, l = internalItemFields.length; i < l; i += 1) {
      tempItem[internalItemFieldReverseIndex[i]] = existingItem[i];
    }
    return tempItem;
    // return existingItem.slice();
  };
  this.hasItem = (itemId) => {
    if (isValidNonEmptyString(itemId) === false) {
      throw Error(`hasItem(${itemId}): 1st parameter "itemId" must be a non-empty string.`);
    }
    return internalDataDictionary[itemId] !== undefined;
  };
  this.sortItems = (sortFn) => {
    if (typeof sortFn !== 'function') {
      throw Error(`findItem(${sortFn}): 1st parameter "sortFn" must be a function.`);
    }
    internalDataList.sort(sortFn);
    return this;
  };
}

module.exports = { Table };
