import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, ".env"))


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", f"sqlite:///{os.path.join(basedir, 'weather.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # OpenWeatherMap
    OPENWEATHER_API_KEY = os.environ.get("OPENWEATHER_API_KEY", "")
    OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5"
    OPENWEATHER_GEO_URL = "https://api.openweathermap.org/geo/1.0"

    # App settings
    DEFAULT_UNITS = os.environ.get("DEFAULT_UNITS", "metric")  # metric | imperial
    CACHE_TTL_SECONDS = int(os.environ.get("CACHE_TTL_SECONDS", 600))  # 10 min