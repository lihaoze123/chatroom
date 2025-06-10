from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_socketio import SocketIO
import os

# 初始化扩展
db = SQLAlchemy()
login_manager = LoginManager()
login_manager.login_view = 'auth.login'
socketio = SocketIO()

def create_app(config_class=None):
    """应用工厂函数"""
    app = Flask(__name__)
    
    # 配置应用
    _configure_app(app, config_class)
    
    # 初始化扩展
    _init_extensions(app)
    
    # 设置日志
    _setup_logging(app)
    
    # 注册蓝图
    _register_blueprints(app)
    
    # 创建数据库表
    _create_database_tables(app)
    
    # 注册错误处理器
    _register_error_handlers(app)
    
    # 注册CLI命令
    _register_cli_commands(app)
    
    return app

def _configure_app(app, config_class):
    """配置应用"""
    if config_class:
        app.config.from_object(config_class)
    else:
        # 加载默认配置
        try:
            from config import config
            config_name = os.environ.get('FLASK_ENV', 'development')
            config_class = config.get(config_name, config['default'])
            app.config.from_object(config_class)
            
            # 调用配置类的初始化方法
            config_class.init_app(app)
        except ImportError:
            # 如果没有配置文件，使用默认配置
            app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'dev-secret-key'
            app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or \
                'sqlite:///' + os.path.join(app.root_path, '..', 'instance', 'app.db')
            app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # 确保实例文件夹存在
    instance_path = os.path.join(app.root_path, '..', 'instance')
    os.makedirs(instance_path, exist_ok=True)

def _init_extensions(app):
    """初始化Flask扩展"""
    # 初始化数据库
    db.init_app(app)
    
    # 初始化登录管理器
    login_manager.init_app(app)
    socketio.init_app(app, cors_allowed_origins='*')

    # 配置 login_manager
    login_manager.login_view = 'auth.login'
    login_manager.login_message = '请先登录以访问此页面。'
    login_manager.login_message_category = 'info'
    
    # 设置用户加载器
    @login_manager.user_loader
    def load_user(user_id):
        # 延迟导入避免循环导入
        from app.models import User
        try:
            return User.query.get(int(user_id))
        except (ValueError, TypeError):
            return None

def _register_blueprints(app):
    """注册应用蓝图"""
    try:
        # 注册主页蓝图
        from app.main import bp as main_bp
        app.register_blueprint(main_bp)
    except ImportError:
        app.logger.warning("主页蓝图导入失败")
    
    # 注册蓝图
    from app.main import bp as main_bp
    app.register_blueprint(main_bp)

    from app.auth import bp as auth_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')

    from app.chat import bp as chat_bp
    app.register_blueprint(chat_bp, url_prefix='/chat')

    # 注册 Socket.IO 事件处理程序
    from app.chat import events

def _create_database_tables(app):
    """创建数据库表"""
    with app.app_context():
        try:
            # 导入所有模型以确保它们被注册
            from app import models
            db.create_all()
            app.logger.info("数据库表创建成功")
        except Exception as e:
            app.logger.error(f"数据库表创建失败: {e}")

def _register_error_handlers(app):
    """注册错误处理器"""
    from flask import jsonify, render_template, request
    
    @app.errorhandler(404)
    def not_found_error(error):
        if request.path.startswith('/api/'):
            return jsonify({'error': '资源未找到'}), 404
        return render_template('errors/404.html'), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        if request.path.startswith('/api/'):
            return jsonify({'error': '服务器内部错误'}), 500
        return render_template('errors/500.html'), 500
    
    @app.errorhandler(403)
    def forbidden_error(error):
        if request.path.startswith('/api/'):
            return jsonify({'error': '访问被禁止'}), 403
        return render_template('errors/403.html'), 403

from app import models
