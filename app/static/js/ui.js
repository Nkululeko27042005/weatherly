/* =========================================================
   ui.js — Pure UI helpers (render + format + toast).
   ========================================================= */
(function (global) {
  "use strict";

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- Icons ---------- */
  // Delegates to icons.js (inline animated SVGs). Falls back to emoji
  // if icons.js failed to load for any reason.
  const FALLBACK_ICONS = {
    "01d": "☀️", "01n": "🌙",
    "02d": "🌤️", "02n": "☁️",
    "03d": "☁️", "03n": "☁️",
    "04d": "☁️", "04n": "☁️",
    "09d": "🌧️", "09n": "🌧️",
    "10d": "🌦️", "10n": "🌧️",
    "11d": "⛈️", "11n": "⛈️",
    "13d": "❄️", "13n": "❄️",
    "50d": "🌫️", "50n": "🌫️",
  };
  const iconFor = (code) => {
    if (global.Icons && typeof global.Icons.render === "function") {
      return global.Icons.render(code);
    }
    return FALLBACK_ICONS[code] || "🌡️";
  };

  /* ---------- Formatters ---------- */
  const fmtTemp = (v) => (v === null || v === undefined ? "--°" : `${Math.round(v)}°`);

  const fmtSpeed = (v, units = "metric") => {
    if (v === null || v === undefined) return units === "imperial" ? "-- mph" : "-- m/s";
    return units === "imperial" ? `${v} mph` : `${v} m/s`;
  };

  const fmtDay = (isoDate) =>
    new Date(isoDate + "T12:00:00").toLocaleDateString(undefined, { weekday: "short" });

  const fmtTime = (unix) =>
    unix ? new Date(unix * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--";

  /**
   * Formats a UTC unix timestamp into the *local* time of the target city.
   * `tzOffsetSeconds` is what OpenWeatherMap's `city.timezone` field returns.
   */
  const fmtLocalTime = (unixSeconds, tzOffsetSeconds = 0) => {
    if (unixSeconds === null || unixSeconds === undefined) return "--:--";
    const d = new Date((unixSeconds + tzOffsetSeconds) * 1000);
    // Use UTC getters because we've already shifted the clock
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const fmtRelativeFromNow = (unixSeconds) => {
    if (!unixSeconds) return "—";
    const diff = Math.round(Date.now() / 1000 - unixSeconds);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
    return new Date(unixSeconds * 1000).toLocaleDateString();
  };

  const windDir = (deg) => {
    if (deg === null || deg === undefined) return "--";
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round(deg / 45) % 8];
  };

  /* ---------- Toast ---------- */
  function toast(message, { type = "info", timeout = 3200 } = {}) {
    const host = document.getElementById("toast-host");
    if (!host) return alert(message);

    const el = document.createElement("div");
    // Beach-toned toasts
    const bg = {
      info:    "background:#d6f0ff;color:#036a91;border:1px solid #aee1ff",
      success: "background:#fff2d8;color:#c97e05;border:1px solid #ffc93c",
      error:   "background:#fee2e2;color:#b91c1c;border:1px solid #fecaca",
    }[type] || "background:#fff";

    el.setAttribute("style", `
      ${bg};
      padding:12px 16px;border-radius:8px;font-weight:700;font-size:.9rem;
      box-shadow:0 8px 24px rgba(2,132,184,.18);
      opacity:0;transform:translateY(8px);transition:all .25s ease;
      max-width:320px;
    `);
    el.textContent = message;
    host.appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    });
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
      setTimeout(() => el.remove(), 250);
    }, timeout);
  }

  /* ---------- Skeleton / loading ---------- */
  function setLoading(container, isLoading) {
    if (!container) return;
    if (isLoading) container.setAttribute("data-loading", "true");
    else container.removeAttribute("data-loading");
  }

  /* ---------- Sun arc ---------- */
  function renderSunArc(sunrise, sunset, now) {
    const host = document.getElementById("sun-arc-host");
    if (!host) return;
    if (!sunrise || !sunset) {
      host.innerHTML = "";
      return;
    }

    const total = sunset - sunrise;
    const elapsed = Math.max(0, Math.min(total, (now || Date.now() / 1000) - sunrise));
    const pct = total > 0 ? elapsed / total : 0;

    // Semicircle geometry
    const cx = 100, cy = 90, r = 85;
    const angle = Math.PI * (1 - pct);
    const x = cx + r * Math.cos(angle);
    const y = cy - r * Math.sin(angle);

    host.innerHTML = `
      <svg viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0"   stop-color="#ffc93c" stop-opacity=".25"/>
            <stop offset="0.5" stop-color="#ffe3ad" stop-opacity=".95"/>
            <stop offset="1"   stop-color="#ffc93c" stop-opacity=".25"/>
          </linearGradient>
        </defs>
        <path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}"
              fill="none" stroke="url(#arcGrad)" stroke-width="3"
              stroke-dasharray="3 5" stroke-linecap="round"/>
        <circle cx="${x}" cy="${y}" r="11" fill="#ffc93c" opacity=".28"/>
        <circle cx="${x}" cy="${y}" r="6"  fill="#ffc93c" stroke="#ffffff" stroke-width="2"/>
      </svg>
      <div class="arc-time">
        <span>↑ ${fmtTime(sunrise)}</span>
        <span>↓ ${fmtTime(sunset)}</span>
      </div>
    `;
  }

  /* ---------- Comfort bar (humidity) ---------- */
  function comfortFor(h) {
    if (h < 30) return { label: "Dry",        color: "#f4a715" };
    if (h < 60) return { label: "Comfortable", color: "#34c39a" };
    if (h < 80) return { label: "Humid",      color: "#0ea5d9" };
    return            { label: "Very humid",  color: "#036a91" };
  }

  function renderComfort(humidity) {
    const host = document.getElementById("comfort-host");
    if (!host || humidity === null || humidity === undefined) return;

    const { label, color } = comfortFor(humidity);
    host.innerHTML = `
      <div class="comfort">
        <div class="comfort-track">
          <div class="comfort-fill" style="width:${humidity}%;background:${color}"></div>
        </div>
        <div class="comfort-label">
          <span>Dry</span>
          <span style="color:${color};font-weight:800">${label} · ${humidity}%</span>
          <span>Humid</span>
        </div>
      </div>
    `;
  }

  /* ---------- AQI ---------- */
  function renderAQI(data) {
    const host = document.getElementById("aqi-host");
    if (!host) return;

    if (!data || data.aqi == null) {
      host.innerHTML = `<span class="text-muted" style="font-size:.75rem">AQI unavailable</span>`;
      return;
    }

    host.innerHTML = `
      <span class="aqi-badge" style="background:${data.tone}22;color:${data.tone}">
        <span class="aqi-dot"></span>
        AQI ${data.aqi} · ${data.label}
      </span>
    `;
  }

  /* ---------- Renderers ---------- */

  function renderCurrent(data, extra = {}) {
    const set = (id, value) => {
      const node = document.getElementById(id);
      if (node) node.textContent = value;
    };

    const units = extra.units || "metric";
    const tz = extra.timezone || 0;

    set("current-city",
      `${data.location.name}${data.location.country ? ", " + data.location.country : ""}`);
    set("current-desc", data.summary.description || "—");

    // Icon needs innerHTML (animated SVG)
    const iconHost = document.getElementById("current-icon");
    if (iconHost) iconHost.innerHTML = iconFor(data.summary.icon);

    set("current-temp", fmtTemp(data.temperature.current));
    set("current-feels", fmtTemp(data.temperature.feels_like));
    set("current-wind", `${data.wind.speed ?? "--"} ${units === "imperial" ? "mph" : "m/s"} ${windDir(data.wind.deg)}`);
    set("current-humidity", data.temperature.humidity ?? "--");
    set("current-rain", data.rain ?? 0);

    // Time chips
    set("current-time", fmtLocalTime(data.timestamp, tz));
    set("current-updated", fmtRelativeFromNow(data.timestamp));

    // Sun arc + comfort
    renderSunArc(data.sunrise, data.sunset, data.timestamp);
    renderComfort(data.temperature.humidity);

    const detailLink = document.getElementById("open-detail-link");
    if (detailLink && data.location.name) {
      detailLink.href = `/city/${encodeURIComponent(data.location.name)}`;
    }

    return data;
  }

  function renderDetail(data, extra = {}) {
    const set = (id, value) => {
      const node = document.getElementById(id);
      if (node) node.textContent = value;
    };

    const units = extra.units || "metric";

    set("detail-wind", fmtSpeed(data.wind.speed, units));
    set("detail-wind-dir", data.wind.deg ?? "--");
    set("detail-feels", fmtTemp(data.temperature.feels_like));
    set("detail-humidity", data.temperature.humidity ?? "--");
    set("detail-pressure", data.temperature.pressure ?? "--");
    set("detail-clouds", data.clouds ?? "--");
    set("detail-visibility", data.visibility ? `${(data.visibility / 1000).toFixed(1)} km` : "--");
    set("detail-pop", data.pop !== undefined ? Math.round(data.pop * 100) : 0);
    set("detail-sunrise", fmtTime(data.sunrise));
    set("detail-sunset", fmtTime(data.sunset));
  }

  function renderWeekly(days) {
    const host = document.getElementById("weekly-grid");
    if (!host) return;

    if (!days || !days.length) {
      host.innerHTML = `<div class="text-muted text-sm">No forecast available.</div>`;
      return;
    }

    host.innerHTML = days.map((d) => `
      <article class="day-card">
        <div class="day-name">${fmtDay(d.date)}</div>
        <div class="icon">${iconFor(d.summary.icon)}</div>
        <div class="text-xs text-muted mt-1">${d.summary.description}</div>
        <div class="temp-range mt-2">
          ${Math.round(d.temp_max)}°
          <span class="temp-min">/ ${Math.round(d.temp_min)}°</span>
        </div>
        <div class="text-xs text-muted mt-1">💧 ${d.pop_max}% · 💨 ${d.wind_avg}</div>
      </article>
    `).join("");
  }

  function renderHourly(entries) {
    const host = document.getElementById("hourly-strip");
    if (!host) return;

    if (!entries || !entries.length) {
      host.innerHTML = `<div class="text-muted text-sm">No hourly data.</div>`;
      return;
    }

    host.innerHTML = entries.slice(0, 12).map((e) => `
      <div class="hour-card">
        <div class="hour">${fmtLocalTime(e.dt)}</div>
        <div class="icon">${iconFor(e.summary.icon)}</div>
        <div class="temp">${fmtTemp(e.temperature.current)}</div>
        <div class="text-muted" style="font-size:.7rem">💧 ${Math.round((e.pop || 0) * 100)}%</div>
      </div>
    `).join("");
  }

  function renderFavourites(items, handlers = {}) {
    const host = document.getElementById("favourites-list");
    const counter = document.getElementById("favourites-count");
    if (counter) counter.textContent = items.length;

    if (!host) return;

    if (!items.length) {
      host.innerHTML = `<div class="text-muted text-sm">No saved cities yet.</div>`;
      return;
    }

    host.innerHTML = items.map((fav) => `
      <div class="fav-item ${fav.is_primary ? "is-primary" : ""}" data-id="${fav.id}">
        <div>
          <div class="fav-name">
            ${fav.name}
            ${fav.is_primary ? '<span class="badge badge--primary" style="margin-left:6px">Main</span>' : ''}
          </div>
          <div class="fav-country">${[fav.state, fav.country].filter(Boolean).join(", ")}</div>
        </div>
        <div class="flex gap-1">
          ${!fav.is_primary ? `<button class="btn--icon" data-action="primary" title="Set as main">★</button>` : ""}
          <button class="btn--icon" data-action="remove" title="Remove">✕</button>
        </div>
      </div>
    `).join("");

    host.querySelectorAll(".fav-item").forEach((row) => {
      const id = Number(row.dataset.id);

      row.querySelector('[data-action="primary"]')?.addEventListener("click", (e) => {
        e.stopPropagation();
        handlers.onPrimary?.(id);
      });

      row.querySelector('[data-action="remove"]')?.addEventListener("click", (e) => {
        e.stopPropagation();
        handlers.onRemove?.(id);
      });

      row.addEventListener("click", () => handlers.onOpen?.(id));
    });
  }

  function showError(containerId, message) {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = `<div class="text-muted text-sm">⚠ ${message}</div>`;
  }

  global.UI = {
    $, $$,
    iconFor,
    fmtTemp, fmtSpeed, fmtDay, fmtTime, fmtLocalTime, fmtRelativeFromNow, windDir,
    toast, setLoading,
    renderCurrent, renderDetail, renderWeekly, renderHourly, renderFavourites,
    renderSunArc, renderComfort, renderAQI,
    comfortFor,
    showError,
  };
})(window);