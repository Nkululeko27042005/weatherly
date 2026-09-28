import requests
from flask import current_app
from app.services.weather_service import WeatherServiceError


class LocationService:
    """Handles geocoding + reverse geocoding via OpenWeatherMap's Geo API."""

    @classmethod
    def _key(cls):
        key = current_app.config.get("OPENWEATHER_API_KEY")
        if not key:
            raise WeatherServiceError("OPENWEATHER_API_KEY is not configured.")
        return key

    @classmethod
    def geocode(cls, query, limit=5):
        """Convert a city name into a list of matches."""
        base = current_app.config["OPENWEATHER_GEO_URL"]
        try:
            resp = requests.get(
                f"{base}/direct",
                params={"q": query, "limit": limit, "appid": cls._key()},
                timeout=10,
            )
        except requests.RequestException as exc:
            raise WeatherServiceError(f"Network error: {exc}") from exc

        if resp.status_code == 401:
            raise WeatherServiceError("Invalid OpenWeatherMap API key.")
        if not resp.ok:
            raise WeatherServiceError(f"Geocoding failed ({resp.status_code}).")

        results = []
        for item in resp.json():
            results.append({
                "name": item.get("name"),
                "country": item.get("country"),
                "state": item.get("state"),
                "latitude": item.get("lat"),
                "longitude": item.get("lon"),
            })
        return results

    @classmethod
    def reverse_geocode(cls, lat, lon, limit=1):
        """Convert coordinates to a friendly place name."""
        base = current_app.config["OPENWEATHER_GEO_URL"]
        try:
            resp = requests.get(
                f"{base}/reverse",
                params={"lat": lat, "lon": lon, "limit": limit, "appid": cls._key()},
                timeout=10,
            )
        except requests.RequestException as exc:
            raise WeatherServiceError(f"Network error: {exc}") from exc

        if not resp.ok:
            raise WeatherServiceError(f"Reverse geocoding failed ({resp.status_code}).")

        data = resp.json()
        if not data:
            return None

        item = data[0]
        return {
            "name": item.get("name"),
            "country": item.get("country"),
            "state": item.get("state"),
            "latitude": item.get("lat"),
            "longitude": item.get("lon"),
        }