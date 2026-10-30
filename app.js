(function() {
  "use strict";

  var FILTER_DEFS = UISTCatalog.filters;
  var FILTER_MAPPINGS = {};
  Object.keys(FILTER_DEFS).forEach(function(key) {
    FILTER_MAPPINGS[key] = {};
    FILTER_DEFS[key].values.forEach(function(value) {
      FILTER_MAPPINGS[key][value] = UISTCatalog.items.reduce(function(indices, item, index) {
        if (item[key] === value) indices.push(index);
        return indices;
      }, []);
    });
  });

  function formatPrice(amount) {
    return "$" + amount;
  }

  function formatActivatedDetails(label) {
    return formatPrice(label.price) + (label.author ? ", " + label.author : "");
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatActivatedMarkup(label) {
    var markup = '<span class="proxy-price">' + escapeHTML(formatPrice(label.price)) + "</span>";
    if (label.author) {
      markup += '<span class="proxy-author">' + escapeHTML(label.author) + "</span>";
    }
    return markup;
  }

  var CONFIG = {
    inputRepeatMs: 115,
    labels: UISTCatalog.items,
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
    return indices;
  }

  function proxyImage(label) { return label.image; }

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
    if (!label) { status.textContent = "No matching items. Change or reset filters."; return; }
    var activatedCount = getActivatedIndices().length;
    if (isItemActivated(state.selectedIndex)) {
      status.textContent =
        label.name +
        " focused, " +
        formatActivatedDetails(label) +
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
    if (!CONFIG.labels[index] || !isItemVisible(index)) return;

    state.selectedIndex = index;

    if (isItemActivated(index)) {
      delete state.activated[index];
    } else {
      state.activated[index] = true;
    }

    updateSelection();
  }

  function selectItem(index) {
    if (!CONFIG.labels[index] || !isItemVisible(index)) return;
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
      state.selectedIndex = visible.length ? visible[0] : -1;
    }
    document.getElementById("empty-state").hidden = visible.length > 0;

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
      card.title = item.description + " · " + item.type + " · " + item.color + " · " + item.topic;
      card.tabIndex = -1;

      card.innerHTML =
        '<span class="proxy-image-frame">' +
          '<img class="proxy-image" alt="" data-src="' + proxyImage(item, index) + '" decoding="async">' +
          '<span class="proxy-price-overlay" aria-hidden="true">' +
            formatActivatedMarkup(item) +
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

  function ensureNearbyImagesLoaded() {
    var visible = getVisibleIndices();
    var position = visible.indexOf(state.selectedIndex);
    if (position === -1) position = 0;

    visible.forEach(function(itemIndex, visibleIndex) {
      if (Math.abs(visibleIndex - position) > 3) return;

      var image = strip.querySelector('.proxy-card[data-index="' + itemIndex + '"] .proxy-image');
      if (!image || image.src) return;
      image.src = image.dataset.src;
    });
  }

  function updateSelection() {
    ensureNearbyImagesLoaded();

    var cards = strip.querySelectorAll(".proxy-card");
    cards.forEach(function(card, index) {
      var focused = index === state.selectedIndex;
      var activated = isItemActivated(index);
      card.classList.toggle("is-focused", focused);
      card.classList.toggle("show-price", activated);
      card.setAttribute("aria-selected", focused ? "true" : "false");
      card.tabIndex = focused && state.panel === "proxy" ? 0 : -1;
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
    if (!visible.length) return;
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
        state.filterIndex = index;
        cycleActiveFilterValue();
      });
    });
  }

  function setupInput() {
    document.addEventListener("keydown", function(event) {
      if (event.target.closest(".preview-controls, [data-reset]") && (event.key === "Enter" || event.key === " ")) return;
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
    document.querySelectorAll("[data-reset]").forEach(function(button) {
      button.addEventListener("click", function() {
        CONFIG.filterKeys.forEach(function(key) { state.filterValueIndex[key] = 0; });
        renderFilterLabels(); applyFilters();
      });
    });
    document.getElementById("preview-filters").addEventListener("click", function() {
      if (state.panel === "filters") hideFilters(); else showFilters();
    });
    document.getElementById("preview-prev").addEventListener("click", function() { hideFilters(); moveSelection(-1); });
    document.getElementById("preview-next").addEventListener("click", function() { hideFilters(); moveSelection(1); });
    function fitDisplay() {
      var scale = Math.min(1, window.innerWidth / 600, window.innerHeight / 600);
      document.documentElement.style.setProperty("--display-scale", scale);
    }
    fitDisplay();
    window.addEventListener("resize", fitDisplay);
    window.addEventListener("load", schedulePositionStrip);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
