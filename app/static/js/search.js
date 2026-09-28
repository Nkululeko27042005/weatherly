/* =========================================================
   search.js — City search bar with debounced autocomplete.
   ========================================================= */
(function (global) {
  "use strict";

  function attachSearch({ onSelect } = {}) {
    const input = document.getElementById("city-search");
    const results = document.getElementById("search-results");
    if (!input || !results) return;

    let timer = null;
    let lastQuery = "";
    let abortController = null;
    let activeIndex = -1;
    let currentItems = [];

    /* ---------- Open / close ---------- */
    function close() {
      results.classList.remove("open");
      results.innerHTML = "";
      activeIndex = -1;
      currentItems = [];
    }

    /* ---------- Selection ---------- */
    function choose(index) {
      const item = currentItems[index];
      if (!item) return;
      input.value = item.name;
      close();
      onSelect?.(item);
    }

    /* ---------- Render ---------- */
    function render(items) {
      currentItems = items;
      activeIndex = -1;

      if (!items.length) {
        results.innerHTML = `<div class="search-result-item text-muted">No matches.</div>`;
        results.classList.add("open");
        return;
      }

      results.innerHTML = items.map((c, i) => `
        <div class="search-result-item" role="option" data-index="${i}">
          <strong>${c.name}</strong>
          <span class="text-muted text-xs"> — ${[c.state, c.country].filter(Boolean).join(", ")}</span>
        </div>
      `).join("");
      results.classList.add("open");

      results.querySelectorAll(".search-result-item").forEach((el) => {
        el.addEventListener("click", () => choose(Number(el.dataset.index)));
      });
    }

    /* ---------- Highlight helper ---------- */
    function setActive(index) {
      const nodes = results.querySelectorAll(".search-result-item");
      if (!nodes.length) return;

      // Clamp
      if (index < 0) index = 0;
      if (index > nodes.length - 1) index = nodes.length - 1;
      activeIndex = index;

      nodes.forEach((el, i) => el.classList.toggle("active", i === activeIndex));
      nodes[activeIndex].scrollIntoView({ block: "nearest" });
    }

    /* ---------- Input (debounced fetch) ---------- */
    input.addEventListener("input", () => {
      const q = input.value.trim();
      if (q === lastQuery) return;
      lastQuery = q;

      clearTimeout(timer);
      if (q.length < 2) { close(); return; }

      timer = setTimeout(async () => {
        abortController?.abort();
        abortController = new AbortController();
        try {
          const items = await global.API.searchCities(q);
          render(items);
        } catch (_) {
          render([]);
        }
      }, 280);
    });

    /* ---------- Keyboard ---------- */
    input.addEventListener("keydown", (e) => {
      const isOpen = results.classList.contains("open");

      if (e.key === "ArrowDown" && isOpen) {
        e.preventDefault();
        setActive(activeIndex + 1);
      } else if (e.key === "ArrowUp" && isOpen) {
        e.preventDefault();
        setActive(activeIndex - 1);
      } else if (e.key === "Enter" && isOpen) {
        e.preventDefault();
        if (activeIndex >= 0) {
          choose(activeIndex);
        } else if (currentItems.length) {
          choose(0);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        close();
        input.blur();
      }
    });

    /* ---------- Global keyboard shortcut: '/' focuses search ---------- */
    document.addEventListener("keydown", (e) => {
      // Don't hijack when the user is already typing in an input/textarea
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "textarea" || document.activeElement?.isContentEditable;

      if (e.key === "/" && !typing) {
        e.preventDefault();
        input.focus();
        input.select();
      }
    });

    /* ---------- Click outside to close ---------- */
    document.addEventListener("click", (e) => {
      if (!results.contains(e.target) && e.target !== input) close();
    });
  }

  global.Search = { attach: attachSearch };
})(window);