from flask import Blueprint, render_template, current_app

main_bp = Blueprint("main", __name__)


@main_bp.route("/")
def index():
    """Renders the main dashboard shell (frontend logic hydrates it)."""
    return render_template("index.html")


@main_bp.route("/city/<path:city_name>")
def city_detail(city_name):
    """Renders a dedicated full-detail page for a specific city."""
    return render_template(
        "city.html",
        city_name=str(city_name),                      # ensure it's a string
        default_units=current_app.config.get("DEFAULT_UNITS", "metric"),
    )