from flask import Flask
from config import get_config
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from flask_login import LoginManager

# 创建扩展实例
db = SQLAlchemy()
socketio = SocketIO()
login_manager = LoginManager()

def create_app(config=None):
    """应用工厂函数"""
    # 初始化 Flask 应用
    app = Flask(__name__)
    
    # 加载配置
    if config is None:
        app.config.from_object(get_config())
    else:
        app.config.from_object(config)
    
    # 初始化扩展
    db.init_app(app)
    socketio.init_app(app)
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
    
    from app.chat import bp as chat_bp
    app.register_blueprint(chat_bp, url_prefix='/chat')
    
    return app


