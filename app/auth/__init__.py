# app/auth/__init__.py
# 认证蓝图

from flask import Blueprint

bp = Blueprint('auth', __name__)

from app.auth import routes 