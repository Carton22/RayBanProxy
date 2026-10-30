(function(root) {
  'use strict';
  var filters = {
    type: { label: 'Type', values: ['Book', 'Pen', 'Box'] },
    color: { label: 'Color', values: ['Yellow', 'Black', 'Green', 'Red'] },
    topic: { label: 'Topic', values: ['Art', 'CS'] }
  };
  var rows = [
    ['Yellow binder', 'Book', 'Yellow', 'CS', 'Binder classified as Book within the requested types.'],
    ['Black binder', 'Book', 'Black', 'CS', 'Binder classified as Book within the requested types.'],
    ['Ray-Ban display box', 'Box', 'Yellow', 'CS', 'Beige packaging assigned Yellow for this preview.'],
    ['UbiComp adjunct proceedings', 'Book', 'Green', 'CS', ''],
    ['National Geographic · Picasso', 'Book', 'Yellow', 'Art', ''],
    ['Black Sharpie', 'Pen', 'Black', 'Art', ''],
    ['Kleenex tissue box', 'Box', 'Green', 'Art', ''],
    ['Green Expo marker', 'Pen', 'Green', 'Art', ''],
    ['New York magnet box', 'Box', 'Red', 'Art', 'Multicolored design assigned Red for this preview.'],
    ['Red Expo marker', 'Pen', 'Red', 'Art', '']
  ];
  var items = rows.map(function(row, index) {
    return { name: 'item' + (index + 1), image: 'items/item' + (index + 1) + '.png',
      description: row[0], type: row[1], color: row[2], topic: row[3], note: row[4],
      price: 10 + ((index * 13 + 7) % 41) };
  });
  function matches(item, selected) {
    return Object.keys(filters).every(function(key) {
      return !selected[key] || item[key] === selected[key];
    });
  }
  var catalog = { items: items, filters: filters, matches: matches };
  if (typeof module !== 'undefined' && module.exports) module.exports = catalog;
  else root.UISTCatalog = catalog;
})(typeof window !== 'undefined' ? window : this);
