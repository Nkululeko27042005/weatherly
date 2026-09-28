/* =========================================================
   api.js — All backend communication lives here.
   ========================================================= */
(function (global) {
  "use strict";

  async function request(url, options = {}) {
    const res = await fetch(url, {
      headers: { "Accept": "application/json", ...(options.headers || {}) },
      ...options,
    });

    let body = null;
    const text = await res.text();
    if (text) {
      try { body = JSON.parse(text); } catch { body = text; }
    }

    if (!res.ok) {
      const message =
        (body && body.error) ||
        (typeof body === "string" ? body : null) ||
        `Request failed (${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      throw err;
    }
    return body;
  }

  const qs = (params) => {
    const s = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") s.append(k, v);
    });
    return s.toString();
  };

  const API = {
    /* --- Weather --- */
getCurrent({ lat, lon, city, units } = {}) {
    return request(`/api/weather/current?${qs({ lat, lon, city, units })}`);
  },
  getForecast({ lat, lon, city, units } = {}) {
    return request(`/api/weather/forecast?${qs({ lat, lon, city, units })}`);
  },
  getWeekly({ lat, lon, city, units } = {}) {
    return request(`/api/weather/weekly?${qs({ lat, lon, city, units })}`);
  },
  getAirQuality({ lat, lon } = {}) {
    return request(`/api/weather/air?${qs({ lat, lon })}`);
  },
    searchCities(q) {
      return request(`/api/weather/search?${qs({ q })}`);
    },
    reverseGeocode(lat, lon) {
      return request(`/api/weather/reverse?${qs({ lat, lon })}`);
    },

    /* --- Favourites --- */
    listFavourites() {
      return request(`/api/favourites`);
    },
    addFavourite(payload) {
      return request(`/api/favourites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    deleteFavourite(id) {
      return request(`/api/favourites/${id}`, { method: "DELETE" });
    },
    setPrimaryFavourite(id) {
      return request(`/api/favourites/${id}/primary`, { method: "PUT" });
    },
    reorderFavourites(order) {
      return request(`/api/favourites/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
    },

    /* --- History (optional) --- */
    listHistory() {
      return request(`/api/favourites/history`);
    },
    addHistory(payload) {
      return request(`/api/favourites/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
  };

  global.API = API;
})(window);