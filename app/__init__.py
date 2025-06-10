# app/__init__.py
# This will be your main application initialization file.

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
import os

db = SQLAlchemy()
login_manager = LoginManager()
login_manager.login_view = 'auth.login' # 'auth' is the blueprint name, 'login' is the function name for the login route

def create_app(config_class=None):
    app = Flask(__name__)

    if config_class:
        app.config.from_object(config_class)
    else:
        # Load default configuration if not provided, e.g., from config.py
        from config import Config
        app.config.from_object(Config)

    # Ensure the instance folder exists
    instance_path = os.path.join(app.root_path, '..', 'instance')
    os.makedirs(instance_path, exist_ok=True)


    db.init_app(app)
    login_manager.init_app(app)

    # 配置 login_manager
    login_manager.login_view = 'auth.login'
    login_manager.login_message = '请先登录以访问此页面。'
    
    # 添加用户加载器回调函数
    @login_manager.user_loader
    def load_user(user_id):
        from app.models import User
        return User.query.get(int(user_id))
    
    # 注册蓝图
    from app.main import bp as main_bp
    app.register_blueprint(main_bp)

    from app.auth import bp as auth_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')

    from app.main import bp as main_bp
    app.register_blueprint(main_bp)

    # You might have other blueprints here for chat etc.
    # from app.chat import bp as chat_bp
    # app.register_blueprint(chat_bp, url_prefix='/chat')


    with app.app_context():
        db.create_all() # Create database tables for our models

    return app

from app import models # Import models after db is initialized to avoid circular imports.