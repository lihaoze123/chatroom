# app/chat/__init__.py
# 聊天蓝图

from flask import Blueprint

bp = Blueprint('chat', __name__)

from app.chat import routes, events 