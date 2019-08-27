/* eslint-disable no-console */


/**
 * - Databases are comprised by Tables
 * - Tables are comprised by Records
 */

/**
 * Table(tableId):
 * - insert(itemId, itemData)
 * - update(itemId, itemData)
 * - fetch(itemId)
 * - remove(itemId)
 * - has(itemId)
 *
 * Transaction(tablesSource):
 * - table(tableId)
 * - item(tableId, itemId)
 */

function Table(tableId) {
  const items = [];
  const index = {};
  this.id = tableId;
  this.insert = (itemId, itemData) => {
    if (typeof itemData !== 'object' || itemData === null) {
      throw Error('');
    }
    const frozenItem = Object.freeze({ id: itemId, ...itemData });
    items.push(frozenItem);
    index[itemId] = frozenItem;
    return frozenItem;
  };

  this.update = (itemId, itemData) => {
    if (typeof itemData !== 'object' || itemData === null) {
      throw Error('');
    }
    if (itemId !== 'string' || itemId === '') {
      throw Error('');
    }
    const existingItem = items.find(({ id }) => id === itemId);
    if (existingItem === undefined) {
      throw Error('');
    }
    const frozenItem = Object.freeze({ id: itemId, ...itemData });
    items[items.indexOf(existingItem)] = frozenItem;
    index[itemId] = frozenItem;
    return frozenItem;
  };

  this.fetch = (itemId) => {
    if (index.has(itemId) === false) {
      throw Error('');
    }
    return index[itemId];
  };

  this.remove = (itemId) => {
    const existingItem = items.find(({ id }) => id === itemId);
    if (existingItem === undefined) {
      throw Error('');
    }
    items.splice(items.indexOf(existingItem), 1);
    delete index[itemId];
    return existingItem;
  };
}

function Transaction(tablesSource) {
  const tables = tablesSource.map(table => table.slice());
  const index = tablesSource.reduce((previous, current) => ({ [current.id]: current, ...previous }), {});
  this.Table = label => tables.find(table => table.label === label);
  this.Table = (tableId) => {

  };
}

function Database() {
  const tables = [];
  const index = {};
  this.Transaction = () => new Transaction(tables);
}

const users = new Table();

const user = users.insert('alice-id', { name: 'alice' });

user.x = 1;

console.log({ user, users });
