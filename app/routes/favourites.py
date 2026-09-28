from flask import Blueprint, jsonify, request
from app import db
from app.models import FavouriteCity, SearchHistory

favourites_bp = Blueprint("favourites", __name__)


def _error(message, status=400):
    return jsonify({"error": message}), status


@favourites_bp.route("", methods=["GET"])
def list_favourites():
    """GET /api/favourites — all saved cities, primary first then sort_order."""
    items = FavouriteCity.query.order_by(
        FavouriteCity.is_primary.desc(),
        FavouriteCity.sort_order.asc(),
        FavouriteCity.created_at.asc(),
    ).all()
    return jsonify([item.to_dict() for item in items])


@favourites_bp.route("", methods=["POST"])
def add_favourite():
    """
    POST /api/favourites
    Body: { name, country, state, latitude, longitude, is_primary? }
    """
    payload = request.get_json(silent=True) or {}
    required = ["name", "latitude", "longitude"]
    missing = [f for f in required if payload.get(f) in (None, "")]
    if missing:
        return _error(f"Missing required fields: {', '.join(missing)}", 422)

    # Prevent duplicates by name+country
    existing = FavouriteCity.query.filter_by(
        name=payload["name"], country=payload.get("country")
    ).first()
    if existing:
        return jsonify(existing.to_dict()), 200

    if payload.get("is_primary"):
        FavouriteCity.query.update({FavouriteCity.is_primary: False})

    fav = FavouriteCity(
        name=payload["name"],
        country=payload.get("country"),
        state=payload.get("state"),
        latitude=float(payload["latitude"]),
        longitude=float(payload["longitude"]),
        is_primary=bool(payload.get("is_primary", False)),
        sort_order=int(payload.get("sort_order", 0)),
    )
    db.session.add(fav)
    db.session.commit()
    return jsonify(fav.to_dict()), 201


@favourites_bp.route("/<int:fav_id>", methods=["DELETE"])
def delete_favourite(fav_id):
    fav = FavouriteCity.query.get(fav_id)
    if not fav:
        return _error("Favourite not found.", 404)
    db.session.delete(fav)
    db.session.commit()
    return jsonify({"deleted": fav_id})


@favourites_bp.route("/<int:fav_id>/primary", methods=["PUT"])
def set_primary(fav_id):
    fav = FavouriteCity.query.get(fav_id)
    if not fav:
        return _error("Favourite not found.", 404)
    FavouriteCity.query.update({FavouriteCity.is_primary: False})
    fav.is_primary = True
    db.session.commit()
    return jsonify(fav.to_dict())


@favourites_bp.route("/reorder", methods=["PUT"])
def reorder_favourites():
    """
    PUT /api/favourites/reorder
    Body: { order: [id1, id2, id3, ...] }
    """
    payload = request.get_json(silent=True) or {}
    order = payload.get("order", [])
    if not isinstance(order, list):
        return _error("`order` must be a list of favourite ids.", 422)

    for index, fav_id in enumerate(order):
        fav = FavouriteCity.query.get(fav_id)
        if fav:
            fav.sort_order = index
    db.session.commit()
    return jsonify({"ok": True})


# ---------- Optional: search history ----------

@favourites_bp.route("/history", methods=["GET"])
def list_history():
    items = SearchHistory.query.order_by(SearchHistory.searched_at.desc()).limit(20).all()
    return jsonify([item.to_dict() for item in items])


@favourites_bp.route("/history", methods=["POST"])
def add_history():
    payload = request.get_json(silent=True) or {}
    required = ["name", "latitude", "longitude"]
    missing = [f for f in required if payload.get(f) in (None, "")]
    if missing:
        return _error(f"Missing required fields: {', '.join(missing)}", 422)

    entry = SearchHistory(
        name=payload["name"],
        country=payload.get("country"),
        latitude=float(payload["latitude"]),
        longitude=float(payload["longitude"]),
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify(entry.to_dict()), 201


@favourites_bp.route("/history", methods=["DELETE"])
def clear_history():
    SearchHistory.query.delete()
    db.session.commit()
    return jsonify({"ok": True})