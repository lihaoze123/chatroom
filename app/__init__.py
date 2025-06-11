# app/__init__.py
# Flask应用工厂

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_socketio import SocketIO
from flask_cors import CORS
import logging
import os
from logging.handlers import RotatingFileHandler
import socket

# 初始化扩展
db = SQLAlchemy()
login_manager = LoginManager()
socketio = SocketIO()

def setup_logging(app):
    """设置日志配置"""
    if not app.debug and not app.testing:
        # 确保日志目录存在
        log_dir = os.path.dirname(app.config['LOG_FILE'])
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)
        
        # 设置文件日志处理器
        file_handler = RotatingFileHandler(
            app.config['LOG_FILE'],
            maxBytes=app.config['LOG_MAX_BYTES'],
            backupCount=app.config['LOG_BACKUP_COUNT']
        )
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(getattr(logging, app.config['LOG_LEVEL']))
        app.logger.addHandler(file_handler)
    
    # 设置控制台日志处理器
    if not app.logger.handlers:
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s'
        ))
        console_handler.setLevel(getattr(logging, app.config['LOG_LEVEL']))
        app.logger.addHandler(console_handler)
    
    app.logger.setLevel(getattr(logging, app.config['LOG_LEVEL']))
    app.logger.info('应用启动完成')

def create_app(config_class):
    """应用工厂函数"""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # 设置日志
    setup_logging(app)
    
    # 初始化扩展
    db.init_app(app)
    login_manager.init_app(app)
    
    # 动态CORS配置 - 支持局域网访问
    cors_origins = [
        "http://localhost:3000", 
        "http://127.0.0.1:3000", 
        "http://0.0.0.0:3000",
        "http://10.121.11.229:3000",  # 当前检测到的IP
        "http://10.121.18.103:3000",  # 另一个设备的IP
    ]
    
    # 如果是开发环境，允许局域网访问
    if app.config.get('ENV') == 'development' or app.config.get('DEBUG'):
        # 获取本机IP地址并添加到允许列表
        try:
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
            local_origin = f"http://{local_ip}:3000"
            if local_origin not in cors_origins:
                cors_origins.append(local_origin)
                app.logger.info(f"添加本机IP到CORS允许列表: {local_origin}")
        except Exception as e:
            app.logger.warning(f"无法获取本机IP: {e}")
        
        # 对于开发环境，添加通配符（Socket.IO支持"*"字符串）
        cors_origins.append("*")
    
    app.logger.info(f"CORS允许的来源: {cors_origins}")
    
    # 初始化Socket.IO
    socketio.init_app(app, 
                     cors_allowed_origins=cors_origins,
                     logger=True,
                     engineio_logger=True,
                     ping_timeout=60,
                     ping_interval=25)
    
    # Flask CORS配置（用于HTTP API）
    flask_cors_origins = [
        "http://localhost:3000", 
        "http://127.0.0.1:3000", 
        "http://0.0.0.0:3000",
        "http://10.121.11.229:3000",
        "http://10.121.18.103:3000",
        "*"  # Flask CORS可以使用通配符
    ]
    
    CORS(app, 
         supports_credentials=True, 
         origins=flask_cors_origins,
         allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    # 配置登录管理器
    login_manager.login_view = None  # 禁用自动重定向，因为这是API应用
    login_manager.login_message = '请先登录以访问此页面。'
    login_manager.login_message_category = 'info'
    
    # 自定义未授权处理函数
    @login_manager.unauthorized_handler
    def unauthorized():
        from flask import jsonify
        return jsonify({'error': '未授权访问，请先登录'}), 401
    
    # 注册蓝图
    from app.api import bp as api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # 创建数据库表
    with app.app_context():
        db.create_all()
    
    return app

# 导入模型以确保它们被注册
from app import models 