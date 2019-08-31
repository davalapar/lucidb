
function Table2(tableId) {
  const items = [];
  const index = {};
  this.insert = (itemId, itemData) => {
    if (typeof itemData !== 'object' || itemData === null) {
      throw Error('');
    }
    const frozenItem = Object.freeze({ id: itemId, ...itemData });
    items.push(frozenItem);
    index[itemId] = frozenItem;
    return frozenItem;
  };
  this.save = () => {

  };
}

function Table() {
  const fields = ['id', 'name', 'age']; // needs to be sorted
  const records = [];
  const index = {};
  this.insert = (item) => {
    // item var needs type checks
    const keys = Object.keys(item);

    // fixed-length initialization = fast
    const record = new Array(fields.length);

    for (let i = 0, l = fields.length; i < l; i += 1) {
      const field = fields[i];
      if (item[field] === undefined) {
        // holes makes things slow
        record[i] = undefined;
      } else {
        // also needs type-checks
        record[i] = item[field];

        // O(N) but shouldn't be an issue with our very small array
        keys.splice(keys.indexOf(field), 1);
      }
    }

    // throw error
    if (keys.length > 0) {
      throw Error('Unexpected key in item!');
    }

    // push item to array
    records.push(record);

    // map item to index
    index[item.id] = record;
  };
  this.records = () => console.log({ records, index });
}

(async () => {
  const t = new Table();
  t.insert({ id: 'aliceId', name: 'alice' });
  t.records();
})();
