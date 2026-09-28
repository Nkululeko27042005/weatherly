/* =========================================================
   icons.js — Inline animated weather SVGs.
   ========================================================= */
(function (global) {
  "use strict";

  const wrap = (inner, size = "1em", cls = "") =>
    `<span class="wi ${cls}" style="width:${size};height:${size}">${inner}</span>`;

  const SVG_OPEN  = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%">`;
  const SVG_CLOSE = `</svg>`;

  const sun = (cls = "wi-spin-slow") =>
    wrap(
      `${SVG_OPEN}
        <circle cx="32" cy="32" r="12" fill="#ffc93c" stroke="#f4a715" stroke-width="2"/>
        <g stroke="#f4a715" stroke-width="3">
          <line x1="32" y1="6"  x2="32" y2="14"/>
          <line x1="32" y1="50" x2="32" y2="58"/>
          <line x1="6"  y1="32" x2="14" y2="32"/>
          <line x1="50" y1="32" x2="58" y2="32"/>
          <line x1="13" y1="13" x2="19" y2="19"/>
          <line x1="45" y1="45" x2="51" y2="51"/>
          <line x1="13" y1="51" x2="19" y2="45"/>
          <line x1="45" y1="19" x2="51" y2="13"/>
        </g>
      ${SVG_CLOSE}`,
      "1em", cls
    );

  const moon = (cls = "wi-pulse") =>
    wrap(
      `${SVG_OPEN}
        <path d="M46 38a16 16 0 1 1-20-20 13 13 0 0 0 20 20z"
              fill="#ffe3ad" stroke="#f4a715" stroke-width="2"/>
      ${SVG_CLOSE}`,
      "1em", cls
    );

  const cloud = (cls = "wi-float") =>
    wrap(
      `${SVG_OPEN}
        <path d="M20 44h24a10 10 0 0 0 1-20 14 14 0 0 0-27 3 8 8 0 0 0 2 17z"
              fill="#eef9ff" stroke="#38b6e6" stroke-width="2"/>
      ${SVG_CLOSE}`,
      "1em", cls
    );

  const partly = (cls = "wi-float") =>
    wrap(
      `${SVG_OPEN}
        <circle cx="22" cy="22" r="9" fill="#ffc93c" stroke="#f4a715" stroke-width="2"/>
        <g stroke="#f4a715" stroke-width="2.5">
          <line x1="22" y1="6"  x2="22" y2="11"/>
          <line x1="22" y1="33" x2="22" y2="38"/>
          <line x1="6"  y1="22" x2="11" y2="22"/>
          <line x1="33" y1="22" x2="38" y2="22"/>
        </g>
        <path d="M24 50h20a8 8 0 0 0 1-16 12 12 0 0 0-23 3 6.5 6.5 0 0 0 2 13z"
              fill="#eef9ff" stroke="#38b6e6" stroke-width="2"/>
      ${SVG_CLOSE}`,
      "1em", cls
    );

  const rain = (cls = "wi-bob") =>
    wrap(
      `${SVG_OPEN}
        <path d="M18 38h28a9 9 0 0 0 1-18 13 13 0 0 0-25 3 7 7 0 0 0-4 15z"
              fill="#eef9ff" stroke="#38b6e6" stroke-width="2"/>
        <g stroke="#0ea5d9" stroke-width="3" stroke-linecap="round">
          <line x1="22" y1="46" x2="20" y2="54"/>
          <line x1="32" y1="46" x2="30" y2="54"/>
          <line x1="42" y1="46" x2="40" y2="54"/>
        </g>
      ${SVG_CLOSE}`,
      "1em", cls
    );

  const storm = (cls = "wi-bob") =>
    wrap(
      `${SVG_OPEN}
        <path d="M18 38h28a9 9 0 0 0 1-18 13 13 0 0 0-25 3 7 7 0 0 0-4 15z"
              fill="#d6f0ff" stroke="#036a91" stroke-width="2"/>
        <path d="M32 44l-6 12h8l-4 10 12-14h-8l6-8z"
              fill="#ffc93c" stroke="#f4a715" stroke-width="1.6"/>
      ${SVG_CLOSE}`,
      "1em", cls
    );

  const snow = (cls = "wi-pulse") =>
    wrap(
      `${SVG_OPEN}
        <path d="M18 38h28a9 9 0 0 0 1-18 13 13 0 0 0-25 3 7 7 0 0 0-4 15z"
              fill="#eef9ff" stroke="#38b6e6" stroke-width="2"/>
        <g stroke="#aee1ff" stroke-width="2.6" stroke-linecap="round">
          <line x1="22" y1="48" x2="22" y2="56"/>
          <line x1="18" y1="52" x2="26" y2="52"/>
          <line x1="32" y1="48" x2="32" y2="56"/>
          <line x1="28" y1="52" x2="36" y2="52"/>
          <line x1="42" y1="48" x2="42" y2="56"/>
          <line x1="38" y1="52" x2="46" y2="52"/>
        </g>
      ${SVG_CLOSE}`,
      "1em", cls
    );

  const fog = (cls = "wi-drift") =>
    wrap(
      `${SVG_OPEN}
        <g stroke="#8ea3b3" stroke-width="3" stroke-linecap="round">
          <line x1="12" y1="24" x2="52" y2="24"/>
          <line x1="18" y1="34" x2="46" y2="34"/>
          <line x1="12" y1="44" x2="52" y2="44"/>
        </g>
      ${SVG_CLOSE}`,
      "1em", cls
    );

  const ICONS = {
    "01d": sun,  "01n": moon,
    "02d": partly, "02n": partly,
    "03d": cloud, "03n": cloud,
    "04d": cloud, "04n": cloud,
    "09d": rain, "09n": rain,
    "10d": rain, "10n": rain,
    "11d": storm, "11n": storm,
    "13d": snow, "13n": snow,
    "50d": fog,  "50n": fog,
  };

  const render = (code) => {
    const fn = ICONS[code] || sun;
    return fn();
  };

  global.Icons = { render, sun, moon, cloud, partly, rain, storm, snow, fog };
})(window);