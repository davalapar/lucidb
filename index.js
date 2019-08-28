/* eslint-disable no-console */


/**
 * - Databases are comprised by Tables
 * - Tables are comprised by Records
 */

/**
 * - Database provides Transactions
 * - Transactions provides Tables, Queries, and Items
 *
 * Table(tableId):
 * - insert(itemId, itemData)
 * - update(itemId, itemData)
 * - fetch(itemId)
 * - remove(itemId)
 * - has(itemId)
 *
 * Transaction(tablesSource):
 * - table(tableId) -> Table
 * - query(tableId) -> Query
 * - item(tableId, itemId) -> Item
 *
 * Query(itemsSource):
 * - offset(value)
 * - limit(value)
 * - ascend(field)
 * - descend(field)
 * - deprecated, merged with ascend: ascendHaversine (field, lat, long)
 * - deprecated, merged with descend: descendHaversine (field, lat, long)
 * - sortBy(sortFunction)
 * - gt(field, value)
 * - gte(field, value)
 * - lt(field, value)
 * - lte(field, value)
 * - eq(field, value)
 * - neq(field, value)
 * - eqAny(field, values)
 * - neqAll(field, values)
 * - includes(field, value)
 * - includesAny(field, values)
 * - includesAll(field, values)
 * - includesNoneOfAny(field, values)
 * - includesNoneOfAll(field, values)
 * - reveal(fields)
 * - conceal(fields)
 * - filterBy(filterFunction)
 * - results() -> Items
 * - firstResult() -> Item
 * - hasResults() -> Boolean
 * - countResults() -> Number
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
