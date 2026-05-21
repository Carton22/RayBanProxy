(function() {
  "use strict";

  var BOOKSHELF_COUNT = 25;

  var FALLBACK_COLORS = [
    ["#f4df2e", "#25282b", "#d9dad8"],
    ["#dcdedc", "#efefea", "#a8adb2"],
    ["#24272b", "#313942", "#b8b09a"],
    ["#222529", "#f0ca35", "#8e9499"],
    ["#e9eaec", "#16191d", "#d34f44"],
    ["#385a79", "#e0d27b", "#f2f2ee"],
    ["#77b6c8", "#1e2228", "#f6f0d4"],
    ["#efe7c8", "#363a40", "#f0b24b"]
  ];

  var FILTER_DEFS = {
    type: { label: "Type", values: ["Book", "File", "Box"] },
    color: { label: "Color", values: ["Yellow", "Black", "White"] },
    topic: { label: "Topic", values: ["XR", "History", "HCI"] }
  };

  // Each value maps to bookshelf item indices (0-24).
  var FILTER_MAPPINGS = {
    type: {
      Book: [3, 4, 7, 8, 12, 13, 15, 16, 17, 18, 22, 23],
      File: [0, 1, 2, 6, 9, 10, 14, 19, 20, 21],
      Box: [5, 11, 24]
    },
    color: {
      Yellow: [0, 6, 21],
      Black: [1, 11, 20, 22],
      White: [2, 7, 8, 12, 14, 15, 24]
    },
    topic: {
      XR: [3, 15],
      History: [4, 16],
      HCI: [7, 17]
    }
  };

  function itemPrice(index) {
    return 10 + ((index * 13 + 7) % 41);
  }

  function buildBookshelfLabels() {
    var labels = [];
    for (var i = 0; i < BOOKSHELF_COUNT; i++) {
      labels.push({
        name: "item" + i,
        image: "Bookshelf/" + i + ".png",
        price: itemPrice(i)
      });
    }
    return labels;
  }

  function formatPrice(amount) {
    return "$" + amount;
  }

  var CONFIG = {
    inputRepeatMs: 115,
    labels: buildBookshelfLabels(),
    filterKeys: ["type", "color", "topic"]
  };

  var state = {
    selectedIndex: 0,
    activated: {},
    filterIndex: 1,
    panel: "proxy",
    lastInputAt: 0,
    filterValueIndex: {
      type: 0,
      color: 0,
      topic: 0
    }
  };

  var app = document.getElementById("app");
  var strip = document.getElementById("proxy-strip");
  var filterBar = document.getElementById("filter-bar");
  var status = document.getElementById("status");
  var viewport = null;
  var filterButtons = [];

  function normalizeIndex(index, total) {
    return (index + total) % total;
  }

  function mappingsReady() {
    var key;
    for (key in FILTER_MAPPINGS) {
      if (!FILTER_MAPPINGS.hasOwnProperty(key)) continue;
      var bucket = FILTER_MAPPINGS[key];
      var valueKey;
      for (valueKey in bucket) {
        if (bucket.hasOwnProperty(valueKey) && bucket[valueKey].length) return true;
      }
    }
    return false;
  }

  function getFilterCycleLength(filterKey) {
    return FILTER_DEFS[filterKey].values.length + 1;
  }

  function isFilterCleared(filterKey) {
    return state.filterValueIndex[filterKey] === 0;
  }

  function getFilterValue(filterKey) {
    var def = FILTER_DEFS[filterKey];
    if (isFilterCleared(filterKey)) return null;
    return def.values[state.filterValueIndex[filterKey] - 1];
  }

  function getFilterDisplayValue(filterKey) {
    var def = FILTER_DEFS[filterKey];
    if (isFilterCleared(filterKey)) return def.label;
    return getFilterValue(filterKey);
  }

  function indicesForFilterValue(filterKey, value) {
    var bucket = FILTER_MAPPINGS[filterKey];
    return bucket && bucket[value] ? bucket[value] : null;
  }

  function matchesFilterAxis(filterKey, index) {
    if (isFilterCleared(filterKey)) return true;

    var value = getFilterValue(filterKey);
    var indices = indicesForFilterValue(filterKey, value);
    if (!indices) return true;
    return indices.indexOf(index) !== -1;
  }

  function isItemVisible(index) {
    if (!mappingsReady()) return true;

    return (
      matchesFilterAxis("type", index) &&
      matchesFilterAxis("color", index) &&
      matchesFilterAxis("topic", index)
    );
  }

  function getVisibleIndices() {
    var indices = [];
    var i;
    for (i = 0; i < CONFIG.labels.length; i++) {
      if (isItemVisible(i)) indices.push(i);
    }
    if (!indices.length) {
      for (i = 0; i < CONFIG.labels.length; i++) indices.push(i);
    }
    return indices;
  }

  function encodeSvg(svg) {
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  function proxyImage(label, index) {
    if (label.image) return label.image;

    var colors = label.colors || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
    var shade = index % 2 === 0 ? "#11161a" : "#20252a";
    var accent = colors[0];
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="280" height="420" viewBox="0 0 280 420">' +
      '<rect width="280" height="420" rx="14" fill="' + shade + '"/>' +
      '<rect x="24" y="28" width="232" height="364" rx="8" fill="#0b0d10"/>' +
      '<rect x="36" y="40" width="36" height="340" rx="4" fill="' + colors[0] + '"/>' +
      '<rect x="78" y="40" width="34" height="340" rx="4" fill="' + colors[1] + '"/>' +
      '<rect x="118" y="40" width="32" height="340" rx="4" fill="' + colors[2] + '"/>' +
      '<rect x="156" y="40" width="88" height="340" rx="4" fill="#2c3034"/>' +
      '<rect x="24" y="28" width="232" height="364" rx="8" fill="none" stroke="#3a4046" stroke-width="4"/>' +
      '<circle cx="220" cy="58" r="14" fill="' + accent + '" opacity="0.55"/>' +
      "</svg>";

    return encodeSvg(svg);
  }

  function renderFilterLabels() {
    filterButtons.forEach(function(button) {
      var filterKey = button.dataset.filter;
      var def = FILTER_DEFS[filterKey];
      var display = getFilterDisplayValue(filterKey);
      var nameEl = button.querySelector(".filter-name");
      var valueEl = button.querySelector(".filter-value");
      var cleared = isFilterCleared(filterKey);

      if (nameEl) nameEl.textContent = def.label;
      if (valueEl) valueEl.textContent = display;
      button.classList.toggle("is-cleared", cleared);
      button.setAttribute(
        "aria-label",
        cleared ? def.label + " (no filter)" : def.label + ": " + display
      );
    });
  }

  function getFilterSummary() {
    return CONFIG.filterKeys.map(function(key) {
      return getFilterDisplayValue(key);
    }).join(", ");
  }

  function updateStatus() {
    if (state.panel === "filters") {
      var activeKey = CONFIG.filterKeys[state.filterIndex];
      status.textContent =
        "Filter " +
        getFilterDisplayValue(activeKey) +
        ". Enter to change. " +
        getFilterSummary();
      return;
    }

    var label = CONFIG.labels[state.selectedIndex];
    var activatedCount = getActivatedIndices().length;
    if (isItemActivated(state.selectedIndex)) {
      status.textContent =
        label.name +
        " focused, " +
        formatPrice(label.price) +
        (activatedCount > 1 ? ", " + activatedCount + " selected" : "");
      return;
    }

    status.textContent =
      label.name +
      " focused" +
      (activatedCount ? ", " + activatedCount + " selected" : "");
  }

  function isItemActivated(index) {
    return !!state.activated[index];
  }

  function getActivatedIndices() {
    return Object.keys(state.activated)
      .map(function(key) {
        return parseInt(key, 10);
      })
      .filter(function(index) {
        return isItemVisible(index);
      })
      .sort(function(a, b) {
        return a - b;
      });
  }

  function hidePrice() {
    state.activated = {};
    updateSelection();
  }

  function toggleItemActivate(index) {
    if (!isItemVisible(index)) return;

    state.selectedIndex = index;

    if (isItemActivated(index)) {
      delete state.activated[index];
    } else {
      state.activated[index] = true;
    }

    updateSelection();
  }

  function selectItem(index) {
    if (!isItemVisible(index)) return;
    state.selectedIndex = index;
    updateSelection();
  }

  function focusSelected() {
    var selected = strip.querySelector(".proxy-card.is-focused:not(.is-hidden)");
    if (!selected) return;

    try {
      selected.focus({ preventScroll: true });
    } catch (error) {
      selected.focus();
    }
  }

  function updateFilterFocus() {
    filterButtons.forEach(function(button, index) {
      var active = index === state.filterIndex;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    var focused = filterButtons[state.filterIndex];
    if (!focused) return;

    try {
      focused.focus({ preventScroll: true });
    } catch (error) {
      focused.focus();
    }

    updateStatus();
  }

  function showFilters() {
    if (state.panel === "filters") return;

    state.panel = "filters";
    hidePrice();
    app.classList.add("filters-open");
    filterBar.hidden = false;
    updateFilterFocus();
    schedulePositionStrip();
  }

  function hideFilters() {
    if (state.panel !== "filters") return;

    state.panel = "proxy";
    app.classList.remove("filters-open");
    filterBar.hidden = true;
    focusSelected();
    updateStatus();
    schedulePositionStrip();
  }

  function getStripTranslateX() {
    var transform = window.getComputedStyle(strip).transform;
    if (!transform || transform === "none") return 0;

    var match = transform.match(/matrix\(([^)]+)\)/);
    if (!match) return 0;

    var values = match[1].split(",").map(function(value) {
      return parseFloat(value.trim());
    });

    return values.length >= 6 ? values[4] : 0;
  }

  function positionStrip() {
    if (!viewport) viewport = strip.parentElement;

    var selected = strip.querySelector(".proxy-card.is-focused:not(.is-hidden)");
    if (!viewport || !selected) return;

    var appRect = app.getBoundingClientRect();
    var cardRect = selected.getBoundingClientRect();
    var targetCenterX = appRect.left + appRect.width / 2;
    var cardCenterX = cardRect.left + cardRect.width / 2;
    var delta = targetCenterX - cardCenterX;
    var nextX = getStripTranslateX() + delta;

    strip.style.transform = "translateX(" + nextX + "px)";
  }

  function schedulePositionStrip() {
    requestAnimationFrame(function() {
      positionStrip();
      requestAnimationFrame(positionStrip);
    });
  }

  function applyFilters() {
    var cards = strip.querySelectorAll(".proxy-card");
    var visible = getVisibleIndices();

    cards.forEach(function(card, index) {
      var show = isItemVisible(index);
      card.classList.toggle("is-hidden", !show);
      card.setAttribute("aria-hidden", show ? "false" : "true");
    });

    if (visible.indexOf(state.selectedIndex) === -1) {
      state.selectedIndex = visible[0];
    }

    Object.keys(state.activated).forEach(function(key) {
      var index = parseInt(key, 10);
      if (!isItemVisible(index)) delete state.activated[key];
    });

    updateSelection();
  }

  function cycleActiveFilterValue() {
    var filterKey = CONFIG.filterKeys[state.filterIndex];
    state.filterValueIndex[filterKey] = normalizeIndex(
      state.filterValueIndex[filterKey] + 1,
      getFilterCycleLength(filterKey)
    );
    renderFilterLabels();
    updateFilterFocus();
    applyFilters();
  }

  function buildStrip() {
    strip.innerHTML = "";

    CONFIG.labels.forEach(function(item, index) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "proxy-card";
      card.setAttribute("role", "option");
      card.setAttribute("aria-selected", "false");
      card.setAttribute("aria-label", item.name);
      card.dataset.index = String(index);

      card.innerHTML =
        '<span class="proxy-image-frame">' +
          '<img class="proxy-image" alt="" src="' + proxyImage(item, index) + '">' +
          '<span class="proxy-price-overlay" aria-hidden="true">' +
            '<span class="proxy-price">' + formatPrice(item.price) + "</span>" +
          "</span>" +
        "</span>" +
        '<span class="proxy-label">' + item.name + "</span>";

      card.addEventListener("click", function() {
        if (state.panel !== "proxy") hideFilters();
        toggleItemActivate(index);
      });

      strip.appendChild(card);
    });
  }

  function updateSelection() {
    var cards = strip.querySelectorAll(".proxy-card");
    cards.forEach(function(card, index) {
      var focused = index === state.selectedIndex;
      var activated = isItemActivated(index);
      card.classList.toggle("is-focused", focused);
      card.classList.toggle("show-price", activated);
      card.setAttribute("aria-selected", focused ? "true" : "false");
    });

    updateStatus();

    if (state.panel === "proxy") {
      focusSelected();
    }

    schedulePositionStrip();
  }

  function moveSelection(delta) {
    var now = Date.now();
    if (now - state.lastInputAt < CONFIG.inputRepeatMs) return;

    var visible = getVisibleIndices();
    var position = visible.indexOf(state.selectedIndex);
    if (position === -1) position = 0;

    state.lastInputAt = now;
    position = normalizeIndex(position + delta, visible.length);
    selectItem(visible[position]);
  }

  function moveFilter(delta) {
    var now = Date.now();
    if (now - state.lastInputAt < CONFIG.inputRepeatMs) return;

    state.lastInputAt = now;
    state.filterIndex = normalizeIndex(
      state.filterIndex + delta,
      filterButtons.length
    );
    updateFilterFocus();
  }

  function setupFilters() {
    filterButtons = Array.prototype.slice.call(
      filterBar.querySelectorAll(".filter-pill")
    );

    renderFilterLabels();

    filterButtons.forEach(function(button, index) {
      button.addEventListener("click", function() {
        showFilters();
        if (state.filterIndex === index && state.panel === "filters") {
          cycleActiveFilterValue();
          return;
        }
        state.filterIndex = index;
        updateFilterFocus();
      });
    });
  }

  function setupInput() {
    document.addEventListener("keydown", function(event) {
      if (state.panel === "proxy") {
        switch (event.key) {
          case "ArrowLeft":
            moveSelection(-1);
            event.preventDefault();
            break;
          case "ArrowRight":
            moveSelection(1);
            event.preventDefault();
            break;
          case "ArrowDown":
            showFilters();
            event.preventDefault();
            break;
          case "Enter":
            toggleItemActivate(state.selectedIndex);
            event.preventDefault();
            break;
          case "Escape":
            hidePrice();
            selectItem(getVisibleIndices()[0]);
            event.preventDefault();
            break;
        }
        return;
      }

      switch (event.key) {
        case "ArrowLeft":
          moveFilter(-1);
          event.preventDefault();
          break;
        case "ArrowRight":
          moveFilter(1);
          event.preventDefault();
          break;
        case "ArrowUp":
          hideFilters();
          event.preventDefault();
          break;
        case "Enter":
          cycleActiveFilterValue();
          event.preventDefault();
          break;
        case "Escape":
          hideFilters();
          event.preventDefault();
          break;
      }
    });
  }

  function render() {
    buildStrip();
    applyFilters();
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
      navigator.serviceWorker.register("sw.js").catch(function() {});
    }
  }

  function setupLayoutSync() {
    var proxyStage = document.querySelector(".proxy-stage");

    if (window.ResizeObserver) {
      var resizeObserver = new ResizeObserver(schedulePositionStrip);
      resizeObserver.observe(app);
      resizeObserver.observe(proxyStage);
    }

    proxyStage.addEventListener("transitionend", function(event) {
      if (event.propertyName === "height") schedulePositionStrip();
    });

    strip.addEventListener("transitionend", function(event) {
      if (
        event.target.classList.contains("proxy-card") &&
        (event.propertyName === "width" || event.propertyName === "height")
      ) {
        schedulePositionStrip();
      }
    });
  }

  function init() {
    viewport = strip.parentElement;
    setupFilters();
    setupLayoutSync();
    render();
    setupInput();
    registerServiceWorker();
    window.addEventListener("load", schedulePositionStrip);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
