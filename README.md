# Weatherly

Weatherly is a Flask weather dashboard. Search for cities or use browser location to view current conditions, a multi-day forecast, hourly forecast details, and air quality. Save favourite cities, choose a primary city, and switch between metric and imperial units.

Weather and geocoding data are provided by OpenWeatherMap. Favourite cities and recent search history are stored in a local SQLite database.

## Requirements

- Python 3.10 or newer
- An OpenWeatherMap API key with access to the weather, air pollution, and geocoding APIs

## Setup

From the project directory, create and activate a virtual environment, then install dependencies:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Create your local environment file from the example:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and set `OPENWEATHER_API_KEY` to your own API key. Do not commit `.env` or publish your API key.

Available settings:

| Variable | Purpose | Default |
| --- | --- | --- |
| `OPENWEATHER_API_KEY` | API key for OpenWeatherMap | Required for weather and location requests |
| `SECRET_KEY` | Flask secret key | Development value; set a private value for deployment |
| `DATABASE_URL` | SQLAlchemy database connection URL | SQLite database at `weather.db` |
| `DEFAULT_UNITS` | Default temperature units (`metric` or `imperial`) | `metric` |
| `CACHE_TTL_SECONDS` | Weather response cache lifetime | `600` seconds |

Start the development server:

```powershell
python run.py
```

Open <http://127.0.0.1:5000/>. The server runs in Flask debug mode; do not use it as a production server.

## API

Weather endpoints are prefixed with `/api/weather`:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/current?lat={lat}&lon={lon}` or `/current?city={name}` | Current conditions; optional `units=metric` or `units=imperial` |
| `GET` | `/forecast?lat={lat}&lon={lon}` or `/forecast?city={name}` | Normalized five-day forecast |
| `GET` | `/weekly?lat={lat}&lon={lon}` or `/weekly?city={name}` | Daily forecast summaries |
| `GET` | `/air?lat={lat}&lon={lon}` | Air-quality index and pollutant components |
| `GET` | `/search?q={text}` | City search suggestions |
| `GET` | `/reverse?lat={lat}&lon={lon}` | Reverse geocode coordinates |

Favourite and search-history endpoints are prefixed with `/api/favourites`:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/` | List saved cities |
| `POST` | `/` | Save a city; requires `name`, `latitude`, and `longitude` |
| `DELETE` | `/{id}` | Remove a saved city |
| `PUT` | `/{id}/primary` | Set the primary city |
| `PUT` | `/reorder` | Update city ordering with an `order` array of IDs |
| `GET` | `/history` | List recent searches |
| `POST` | `/history` | Add a search; requires `name`, `latitude`, and `longitude` |
| `DELETE` | `/history` | Clear search history |

Example request:

```text
GET /api/weather/current?city=London&units=metric
```

Successful responses return JSON. Errors return a JSON object with an `error` field and an appropriate HTTP status.

## Project Layout

```text
app/
  routes/       Flask page and API routes
  services/     OpenWeatherMap weather and geocoding clients
  static/       CSS and browser-side JavaScript
  templates/    Jinja templates and dashboard partials
config.py       Environment-based application configuration
run.py          Development server entry point
requirements.txt
```
