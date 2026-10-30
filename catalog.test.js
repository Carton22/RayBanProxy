const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('uistdemo catalog and combined filters', () => {
  const catalogPath = path.join(__dirname, 'catalog.js');
  assert.ok(fs.existsSync(catalogPath), 'Shared uistdemo catalog must exist');
  const { items, filters, matches } = require(catalogPath);
  assert.equal(items.length, 10);
  assert.deepEqual(filters.color.values, ['Yellow', 'Black', 'Green', 'Red']);
  assert.deepEqual(filters.topic.values, ['Art', 'CS']);
  assert.deepEqual(filters.type.values, ['Book', 'Pen', 'Box']);
  items.forEach((item, index) => {
    assert.equal(item.name, `item${index + 1}`);
    assert.ok(fs.existsSync(path.join(__dirname, item.image)));
    for (const key of Object.keys(filters)) assert.ok(filters[key].values.includes(item[key]));
  });
  const names = selection => items.filter(item => matches(item, selection)).map(item => item.name);
  assert.equal(names({}).length, 10);
  assert.deepEqual(names({type: 'Pen'}), ['item6', 'item8', 'item10']);
  assert.deepEqual(names({color: 'Green'}), ['item4', 'item7', 'item8']);
  assert.deepEqual(names({type: 'Book', topic: 'Art'}), ['item5']);
  assert.deepEqual(names({type: 'Pen', color: 'Red', topic: 'Art'}), ['item10']);
  assert.deepEqual(names({type: 'Pen', color: 'Yellow'}), []);
});
