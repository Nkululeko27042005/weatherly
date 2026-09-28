from datetime import datetime
from app import db


class FavouriteCity(db.Model):
    """A city the user has favourited for quick access on their dashboard."""

    __tablename__ = "favourite_cities"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    country = db.Column(db.String(8), nullable=True)
    state = db.Column(db.String(120), nullable=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    is_primary = db.Column(db.Boolean, default=False, nullable=False)
    sort_order = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "country": self.country,
            "state": self.state,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "is_primary": self.is_primary,
            "sort_order": self.sort_order,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<FavouriteCity {self.name}, {self.country}>"


class SearchHistory(db.Model):
    """Optional: track cities the user has recently searched for."""

    __tablename__ = "search_history"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    country = db.Column(db.String(8), nullable=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    searched_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "country": self.country,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "searched_at": self.searched_at.isoformat(),
        }