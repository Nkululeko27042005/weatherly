from flask import Blueprint, jsonify, request
from app.services.weather_service import WeatherService, WeatherServiceError
from app.services.location_service import LocationService

weather_bp = Blueprint("weather", __name__)


def _error(message, status=400):
    return jsonify({"error": message}), status

def _units_from_request():
    u = request.args.get("units")
    return u if u in ("metric", "imperial") else None

@weather_bp.route("/current", methods=["GET"])
def current_weather():
    lat, lon, city = request.args.get("lat"), request.args.get("lon"), request.args.get("city")
    units = _units_from_request()
    try:
        if city:
            matches = LocationService.geocode(city, limit=1)
            if not matches: return _error("City not found.", 404)
            lat, lon = matches[0]["latitude"], matches[0]["longitude"]
        elif lat is None or lon is None:
            return _error("Provide lat & lon, or a city query param.", 422)
        return jsonify(WeatherService.get_current_weather(lat, lon, units=units))
    except WeatherServiceError as exc:
        return _error(str(exc), 502)


@weather_bp.route("/forecast", methods=["GET"])
def forecast():
    """
    GET /api/weather/forecast?lat=..&lon=..
    or  /api/weather/forecast?city=Cape+Town
    """
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    city = request.args.get("city")

    try:
        if city:
            matches = LocationService.geocode(city, limit=1)
            if not matches:
                return _error("City not found.", 404)
            lat, lon = matches[0]["latitude"], matches[0]["longitude"]
        elif lat is None or lon is None:
            return _error("Provide lat & lon, or a city query param.", 422)

        return jsonify(WeatherService.get_forecast(lat, lon))
    except WeatherServiceError as exc:
        return _error(str(exc), 502)


@weather_bp.route("/weekly", methods=["GET"])
def weekly():
    """
    GET /api/weather/weekly?lat=..&lon=..
    or  /api/weather/weekly?city=Cape+Town
    Returns a per-day summary (great for the dashboard cards).
    """
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    city = request.args.get("city")

    try:
        if city:
            matches = LocationService.geocode(city, limit=1)
            if not matches:
                return _error("City not found.", 404)
            lat, lon = matches[0]["latitude"], matches[0]["longitude"]
        elif lat is None or lon is None:
            return _error("Provide lat & lon, or a city query param.", 422)

        return jsonify(WeatherService.get_weekly_summary(lat, lon))
    except WeatherServiceError as exc:
        return _error(str(exc), 502)


@weather_bp.route("/search", methods=["GET"])
def search_cities():
    """
    GET /api/weather/search?q=Johannesburg
    Returns a list of matching locations for the search dropdown.
    """
    query = request.args.get("q", "").strip()
    if len(query) < 2:
        return jsonify([])

    try:
        return jsonify(LocationService.geocode(query, limit=8))
    except WeatherServiceError as exc:
        return _error(str(exc), 502)


@weather_bp.route("/reverse", methods=["GET"])
def reverse_geocode():
    """
    GET /api/weather/reverse?lat=..&lon=..
    Turns browser-supplied coordinates into a friendly name.
    """
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    if lat is None or lon is None:
        return _error("lat and lon are required.", 422)

    try:
        result = LocationService.reverse_geocode(lat, lon)
        if not result:
            return _error("Could not resolve location.", 404)
        return jsonify(result)
    except WeatherServiceError as exc:
        return _error(str(exc), 502)

@weather_bp.route("/air", methods=["GET"])
def air_quality():
    lat, lon = request.args.get("lat"), request.args.get("lon")
    if lat is None or lon is None:
        return _error("lat and lon are required.", 422)
    try:
        return jsonify(WeatherService.get_air_quality(lat, lon))
    except WeatherServiceError as exc:
        return _error(str(exc), 502)