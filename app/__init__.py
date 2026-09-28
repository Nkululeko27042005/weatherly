from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config import Config

db = SQLAlchemy()
migrate = Migrate()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)

    # Register blueprints
    from app.routes.main import main_bp
    from app.routes.weather import weather_bp
    from app.routes.favourites import favourites_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(weather_bp, url_prefix="/api/weather")
    app.register_blueprint(favourites_bp, url_prefix="/api/favourites")

    # Create tables on first run (dev convenience)
    with app.app_context():
        db.create_all()

    return app