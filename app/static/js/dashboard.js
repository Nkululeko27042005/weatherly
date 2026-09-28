/* =========================================================
   dashboard.js — Main controller for the weather dashboard.
   ========================================================= */
(function (global) {
  "use strict";

  const state = {
    currentLocation: null,               // { name, country, latitude, longitude }
    mode: "dashboard",                   // "dashboard" | "city"
    units: localStorage.getItem("weatherly.units") || "metric",
  };

  /* ---------- Units ---------- */
  function setUnits(units) {
    state.units = units === "imperial" ? "imperial" : "metric";
    localStorage.setItem("weatherly.units", state.units);
    document.querySelectorAll(".unit-toggle button").forEach((b) => {
      b.classList.toggle("active", b.dataset.units === state.units);
    });
  }

  function wireUnitToggle() {
    const buttons = document.querySelectorAll(".unit-toggle button");
    if (!buttons.length) return;

    // Reflect the current state on load
    buttons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.units === state.units);
      btn.addEventListener("click", async () => {
        if (btn.dataset.units === state.units) return;
        setUnits(btn.dataset.units);
        if (state.currentLocation) {
          await loadLocation(state.currentLocation);
        }
      });
    });
  }

  /* ---------- Loading pipeline ---------- */
  async function loadLocation({ name, country, latitude, longitude }) {
    if (!latitude || !longitude) return;

    state.currentLocation = { name, country, latitude, longitude };
    const card = document.getElementById("current-card");
    global.UI.setLoading(card, true);

    try {
      const [currentRes, weeklyRes, forecastRes, airRes] = await Promise.allSettled([
        global.API.getCurrent({ lat: latitude, lon: longitude, units: state.units }),
        global.API.getWeekly({ lat: latitude, lon: longitude, units: state.units }),
        global.API.getForecast({ lat: latitude, lon: longitude, units: state.units }),
        global.API.getAirQuality({ lat: latitude, lon: longitude }),
      ]);

      // Current weather is the only one we *require*
      if (currentRes.status !== "fulfilled") throw currentRes.reason;
      const current = currentRes.value;

      const weekly   = weeklyRes.status   === "fulfilled" ? weeklyRes.value   : [];
      const forecast = forecastRes.status === "fulfilled" ? forecastRes.value : { list: [], location: {} };
      const air      = airRes.status      === "fulfilled" ? airRes.value      : null;

      // If the API returned a canonical name, prefer it
      if (current.location?.name) {
        state.currentLocation.name = current.location.name;
        state.currentLocation.country = current.location.country || state.currentLocation.country;
      }

      // The timezone offset is only on the forecast response
      const tz = forecast.location?.timezone || 0;

      global.UI.renderCurrent(current, { units: state.units, timezone: tz });
      global.UI.renderDetail(current, { units: state.units });
      global.UI.renderWeekly(weekly);
      global.UI.renderHourly(forecast.list || []);
      global.UI.renderAQI(air);
      document.title = `Weatherly — ${state.currentLocation.name}`;
    } catch (err) {
      global.UI.toast(`Weather load failed: ${err.message}`, { type: "error" });
      global.UI.showError("weekly-grid", "Could not load forecast.");
    } finally {
      global.UI.setLoading(card, false);
    }
  }

  /* ---------- Geolocation ---------- */
  async function useBrowserLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 8000 }
      );
    });
  }

  async function loadFromBrowser() {
    const coords = await useBrowserLocation();
    if (!coords) return false;

    try {
      const place = await global.API.reverseGeocode(coords.lat, coords.lon);
      if (place) {
        await loadLocation(place);
        return true;
      }
    } catch (_) { /* fall through */ }

    // Fallback: raw coordinates
    await loadLocation({ name: "My location", latitude: coords.lat, longitude: coords.lon });
    return true;
  }

  /* ---------- Read server config from DOM ---------- */
  function readAppConfig() {
    const el = document.getElementById("app-config");
    if (!el) return {};
    return {
      mode: el.dataset.mode || "dashboard",
      cityName: el.dataset.cityName || null,
      defaultUnits: el.dataset.defaultUnits || "metric",
    };
  }

  /* ---------- Add-current-to-favourites button ---------- */
  function wireFavouriteButton() {
    const btn = document.getElementById("add-favourite-btn");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      const loc = state.currentLocation;
      if (!loc) return;
      if (global.Favourites.isFavourited(loc)) {
        global.UI.toast(`${loc.name} is already in your favourites.`, { type: "info" });
        return;
      }
      await global.Favourites.add(loc);
    });
  }

  /* ---------- Favourite click handling ---------- */
  function wireFavourites() {
    global.Favourites.configure({
      onOpen: async (id) => {
        const fav = global.Favourites.state.items.find((f) => f.id === id);
        if (fav) await loadLocation(fav);
      },
      onPrimary: (id) => global.Favourites.setPrimary(id),
      onRemove: (id) => global.Favourites.remove(id),
    });
  }

  /* ---------- Boot ---------- */
  async function boot() {
    const cfg = readAppConfig();
    state.mode = cfg.mode;

    // If the user has never picked a unit, fall back to server default
    if (!localStorage.getItem("weatherly.units") && cfg.defaultUnits) {
      setUnits(cfg.defaultUnits);
    } else {
      setUnits(state.units);
    }

    wireUnitToggle();
    wireFavouriteButton();
    wireFavourites();

    // Attach search
    global.Search.attach({
      onSelect: async (city) => {
        // store to history (best effort)
        global.API.addHistory({
          name: city.name, country: city.country,
          latitude: city.latitude, longitude: city.longitude,
        }).catch(() => {});

        await loadLocation(city);
      },
    });

    // Load favourites list first (so "isFavourited" is accurate)
    await global.Favourites.refresh();

    // Mode: city page → use the name from URL
    if (state.mode === "city" && cfg.cityName) {
      try {
        const matches = await global.API.searchCities(cfg.cityName);
        if (matches.length) {
          await loadLocation(matches[0]);
          return;
        }
      } catch (_) { /* fall through */ }
    }

    // Mode: dashboard → try favourites' primary, then geolocation, then a default
    const primary = global.Favourites.getPrimary();
    if (primary) {
      await loadLocation(primary);
      return;
    }

    const usedGeo = await loadFromBrowser();
    if (usedGeo) return;

    // Last resort: a pleasant default
    await loadLocation({ name: "Cape Town", country: "ZA", latitude: -33.9249, longitude: 18.4241 });
  }

  global.Dashboard = { boot, loadLocation, setUnits, state };

  document.addEventListener("DOMContentLoaded", () => {
    global.Dashboard.boot();
  });
})(window);