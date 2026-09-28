import time
from unittest import result
import requests
from flask import current_app


class WeatherServiceError(Exception):
    """Raised when the weather provider fails."""


class WeatherService:
    """Thin wrapper around the OpenWeatherMap API with a simple in-memory cache."""
    AIR_BASE_URL = "https://api.openweathermap.org/data/2.5"

    _cache: dict = {}

    # ---------- internal helpers ----------
    @classmethod
    def _cache_get(cls, key):
        entry = cls._cache.get(key)
        if not entry:
            return None
        value, expires_at = entry
        if time.time() > expires_at:
            cls._cache.pop(key, None)
            return None
        return value

    @classmethod
    def _cache_set(cls, key, value, ttl=None):
        ttl = ttl or current_app.config["CACHE_TTL_SECONDS"]
        cls._cache[key] = (value, time.time() + ttl)

    @classmethod
    def _api_key(cls):
        key = current_app.config.get("OPENWEATHER_API_KEY")
        if not key:
            raise WeatherServiceError(
                "OPENWEATHER_API_KEY is not configured. Add it to your .env file."
            )
        return key

    @classmethod
    def _request(cls, path, params, units=None):
        base = current_app.config["OPENWEATHER_BASE_URL"]
        params = {
        **params,
        "appid": cls._api_key(),
        "units": units or current_app.config["DEFAULT_UNITS"],
         }
        url = f"{base}{path}"

        try:
            resp = requests.get(url, params=params, timeout=10)
        except requests.RequestException as exc:
            raise WeatherServiceError(f"Network error: {exc}") from exc

        if resp.status_code == 404:
            raise WeatherServiceError("Location not found.")
        if resp.status_code == 401:
            raise WeatherServiceError("Invalid OpenWeatherMap API key.")
        if not resp.ok:
            raise WeatherServiceError(f"Provider error ({resp.status_code}).")

        return resp.json()

    # ---------- public API ----------
    @classmethod
    def get_current_weather(cls, lat, lon, units=None):
        u = units or current_app.config["DEFAULT_UNITS"]
        key = f"current:{lat}:{lon}:{u}"
        cached = cls._cache_get(key)
        if cached: return cached
        data = cls._request("/weather", {"lat": lat, "lon": lon}, units=u)
        result = cls._normalize_current(data)
        cls._cache_set(key, result)
        return result

    @classmethod
    def get_forecast(cls, lat, lon):
        """Returns a normalised 5-day / 3-hour forecast."""
        cache_key = f"forecast:{lat}:{lon}"
        cached = cls._cache_get(cache_key)
        if cached:
            return cached

        data = cls._request("/forecast", {"lat": lat, "lon": lon})
        result = cls._normalize_forecast(data)
        cls._cache_set(cache_key, result)
        return result

    @classmethod
    def get_weekly_summary(cls, lat, lon):
        """Groups the 3-hour forecast into daily summaries for the next 5-7 days."""
        forecast = cls.get_forecast(lat, lon)
        return cls._build_daily_summary(forecast["list"])

    @classmethod
    def get_air_quality(cls, lat, lon):
        key = f"air:{lat}:{lon}"
        cached = cls._cache_get(key)
        if cached:
            return cached

        params = {"lat": lat, "lon": lon, "appid": cls._api_key()}
        try:
            resp = requests.get(
                f"{cls.AIR_BASE_URL}/air_pollution",
                params=params,
                timeout=10,
            )
        except requests.RequestException as exc:
            raise WeatherServiceError(f"Network error: {exc}") from exc
        if not resp.ok:
            raise WeatherServiceError(f"Air quality failed ({resp.status_code}).")

        payload = resp.json()
        entry = (payload.get("list") or [{}])[0]
        aqi = (entry.get("main") or {}).get("aqi")
        components = entry.get("components", {})
        label, tone = cls._aqi_label(aqi)
        result = {
            "aqi": aqi,
            "label": label,
            "tone": tone,
            "components": components,
            "timestamp": entry.get("dt"),
        }
        cls._cache_set(key, result, ttl=1800)
        return result

    @staticmethod
    def _aqi_label(aqi):
        # OWM scale: 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor
        table = {
            1: ("Good", "#34c39a"),
            2: ("Fair", "#9fe8d0"),
            3: ("Moderate", "#ffc93c"),
            4: ("Poor", "#f4a715"),
            5: ("Very Poor", "#e05353"),
        }
        return table.get(aqi, ("Unknown", "#8ea3b3"))

    # ---------- normalisers ----------
    @staticmethod
    def _normalize_current(data):
        main = data.get("main", {})
        wind = data.get("wind", {})
        weather = (data.get("weather") or [{}])[0]

        return {
            "location": {
                "name": data.get("name"),
                "country": (data.get("sys") or {}).get("country"),
                "latitude": (data.get("coord") or {}).get("lat"),
                "longitude": (data.get("coord") or {}).get("lon"),
            },
            "summary": {
                "description": weather.get("description", "").title(),
                "icon": weather.get("icon"),
                "main": weather.get("main"),
            },
            "temperature": {
                "current": main.get("temp"),
                "feels_like": main.get("feels_like"),
                "min": main.get("temp_min"),
                "max": main.get("temp_max"),
                "humidity": main.get("humidity"),
                "pressure": main.get("pressure"),
            },
            "wind": {
                "speed": wind.get("speed"),
                "deg": wind.get("deg"),
                "gust": wind.get("gust"),
            },
            "clouds": (data.get("clouds") or {}).get("all"),
            "rain": (data.get("rain") or {}).get("1h", 0),
            "snow": (data.get("snow") or {}).get("1h", 0),
            "visibility": data.get("visibility"),
            "sunrise": (data.get("sys") or {}).get("sunrise"),
            "sunset": (data.get("sys") or {}).get("sunset"),
            "timestamp": data.get("dt"),
        }

    @staticmethod
    def _normalize_forecast(data):
        city = data.get("city", {})
        entries = []
        for item in data.get("list", []):
            weather = (item.get("weather") or [{}])[0]
            main = item.get("main", {})
            wind = item.get("wind", {})
            entries.append({
                "dt": item.get("dt"),
                "dt_txt": item.get("dt_txt"),
                "temperature": {
                    "current": main.get("temp"),
                    "feels_like": main.get("feels_like"),
                    "min": main.get("temp_min"),
                    "max": main.get("temp_max"),
                    "humidity": main.get("humidity"),
                    "pressure": main.get("pressure"),
                },
                "wind": {"speed": wind.get("speed"), "deg": wind.get("deg")},
                "rain": (item.get("rain") or {}).get("3h", 0),
                "snow": (item.get("snow") or {}).get("3h", 0),
                "clouds": (item.get("clouds") or {}).get("all"),
                "pop": item.get("pop", 0),  # probability of precipitation
                "summary": {
                    "description": weather.get("description", "").title(),
                    "icon": weather.get("icon"),
                    "main": weather.get("main"),
                },
            })

        return {
            "location": {
                "name": city.get("name"),
                "country": city.get("country"),
                "latitude": (city.get("coord") or {}).get("lat"),
                "longitude": (city.get("coord") or {}).get("lon"),
                "timezone": city.get("timezone"),
            },
            "list": entries,
        }

    @staticmethod
    def _build_daily_summary(entries):
        """Collapse 3-hour entries into per-day summaries."""
        days = {}
        for entry in entries:
            day = entry["dt_txt"].split(" ")[0]
            bucket = days.setdefault(day, {
                "date": day,
                "temps": [],
                "feels_like": [],
                "humidity": [],
                "wind_speeds": [],
                "rain_total": 0,
                "snow_total": 0,
                "pop_max": 0,
                "descriptions": [],
                "icons": [],
                "main": [],
            })
            bucket["temps"].append(entry["temperature"]["current"])
            bucket["feels_like"].append(entry["temperature"]["feels_like"])
            bucket["humidity"].append(entry["temperature"]["humidity"])
            bucket["wind_speeds"].append(entry["wind"]["speed"])
            bucket["rain_total"] += entry["rain"] or 0
            bucket["snow_total"] += entry["snow"] or 0
            bucket["pop_max"] = max(bucket["pop_max"], entry["pop"] or 0)
            bucket["descriptions"].append(entry["summary"]["description"])
            bucket["icons"].append(entry["summary"]["icon"])
            bucket["main"].append(entry["summary"]["main"])

        summary = []
        for day, b in sorted(days.items()):
            summary.append({
                "date": day,
                "temp_min": round(min(b["temps"]), 1),
                "temp_max": round(max(b["temps"]), 1),
                "feels_like_avg": round(sum(b["feels_like"]) / len(b["feels_like"]), 1),
                "humidity_avg": round(sum(b["humidity"]) / len(b["humidity"])),
                "wind_avg": round(sum(b["wind_speeds"]) / len(b["wind_speeds"]), 1),
                "rain_total": round(b["rain_total"], 2),
                "snow_total": round(b["snow_total"], 2),
                "pop_max": round(b["pop_max"] * 100),  # as %
                "summary": {
                    "description": max(set(b["descriptions"]), key=b["descriptions"].count),
                    "icon": b["icons"][len(b["icons"]) // 2],  # midday-ish icon
                    "main": max(set(b["main"]), key=b["main"].count),
                },
            })
        return summary

