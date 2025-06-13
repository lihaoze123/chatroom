# app/api/__init__.py
# API蓝图

from flask import Blueprint

bp = Blueprint('api', __name__)

from app.api import auth, chat, user_profile, upload