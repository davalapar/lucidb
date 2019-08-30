
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
  const fields = ['id', 'name', 'age'];
  const records = [];
  const index = {};
  this.insert = (item) => {
    const keys = Object.keys(item);
    const record = new Array(fields.length);
    for (let i = 0, l = fields.length; i < l; i += 1) {
      const field = fields[i];
      if (item[field] === undefined) {
        record[i] = undefined;
      } else {
        record[i] = item[field];
        keys.splice(keys.indexOf(field), 1);
      }
    }
    if (keys.length > 0) {
      throw Error('Unexpected key in item!');
    }
    records.push(record);
    index[item.id] = record;
  };
  this.records = () => console.log({ records, index });
}

(async () => {
  const t = new Table();
  t.insert({ id: 'aliceId', name: 'alice' });
  t.records();
})();
