# app/main/__init__.py
# 主要蓝图

from flask import Blueprint

bp = Blueprint('main', __name__)

from app.main import routes 