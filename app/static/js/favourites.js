/* =========================================================
   favourites.js — Manage favourite cities + render list.
   ========================================================= */
(function (global) {
  "use strict";

  const state = { items: [], handlers: {} };

  async function refresh() {
    try {
      state.items = await global.API.listFavourites();
      global.UI.renderFavourites(state.items, state.handlers);
      return state.items;
    } catch (err) {
      global.UI.toast(`Could not load favourites: ${err.message}`, { type: "error" });
      return [];
    }
  }

  async function add(city) {
    if (!city || city.latitude === undefined || city.longitude === undefined) return;
    try {
      const fav = await global.API.addFavourite({
        name: city.name,
        country: city.country,
        state: city.state,
        latitude: city.latitude,
        longitude: city.longitude,
        is_primary: state.items.length === 0,
      });
      global.UI.toast(`${fav.name} added to favourites.`, { type: "success" });
      await refresh();
      return fav;
    } catch (err) {
      global.UI.toast(`Could not save city: ${err.message}`, { type: "error" });
    }
  }

  async function remove(id) {
    try {
      await global.API.deleteFavourite(id);
      global.UI.toast("Removed from favourites.", { type: "info" });
      await refresh();
    } catch (err) {
      global.UI.toast(`Could not remove: ${err.message}`, { type: "error" });
    }
  }

  async function setPrimary(id) {
    try {
      await global.API.setPrimaryFavourite(id);
      global.UI.toast("Set as main city.", { type: "success" });
      await refresh();
    } catch (err) {
      global.UI.toast(`Could not set main: ${err.message}`, { type: "error" });
    }
  }

  function isFavourited(city) {
    if (!city) return false;
    return state.items.some(
      (f) => f.name === city.name && (f.country || "") === (city.country || "")
    );
  }

  function configure(handlers) {
    state.handlers = { ...state.handlers, ...handlers };
  }

  function getPrimary() {
    return state.items.find((f) => f.is_primary) || state.items[0] || null;
  }

  global.Favourites = {
    state,
    refresh, add, remove, setPrimary,
    isFavourited, configure, getPrimary,
  };
})(window);