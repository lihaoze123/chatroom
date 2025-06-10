# app/main/routes.py
# 主要路由

from flask import render_template, redirect, url_for
from flask_login import current_user
from app.main import bp

@bp.route('/')
def index():
    """首页"""
    if current_user.is_authenticated:
        return redirect(url_for('chat.rooms'))
    return render_template('index.html')

@bp.route('/about')
def about():
    """关于页面"""
    return render_template('about.html')

@bp.route('/health')
def health():
    """健康检查端点"""
    return {'status': 'ok', 'message': '服务运行正常'} 