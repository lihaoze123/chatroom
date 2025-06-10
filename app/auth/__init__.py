# app/auth/__init__.py
# Create a blueprint for authentication routes.

from flask import Blueprint

bp = Blueprint('auth', __name__)

from app.auth import routes # Import routes to associate them with the blueprint