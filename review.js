'use strict';
var colors = { Yellow: '#f4df2e', Black: '#151719', Green: '#24a45b', Red: '#eb4141' };
var tbody = document.getElementById('items');
UISTCatalog.items.forEach(function(item) {
  var tr = document.createElement('tr');
  var imageCell = tr.insertCell();
  var img = document.createElement('img');
  img.src = item.image; img.alt = item.description; imageCell.appendChild(img);
  var objectCell = tr.insertCell();
  var title = document.createElement('strong'); title.textContent = item.name; objectCell.appendChild(title);
  var description = document.createElement('div'); description.textContent = item.description; objectCell.appendChild(description);
  if (item.note) { var note = document.createElement('small'); note.textContent = item.note; objectCell.appendChild(note); }
  tr.insertCell().textContent = item.type;
  var colorCell = tr.insertCell();
  var chip = document.createElement('span'); chip.className = 'chip';
  var dot = document.createElement('span'); dot.className = 'dot'; dot.style.background = colors[item.color];
  chip.appendChild(dot); chip.appendChild(document.createTextNode(item.color)); colorCell.appendChild(chip);
  tr.insertCell().textContent = item.topic;
  tbody.appendChild(tr);
});
