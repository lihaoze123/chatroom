# app/__init__.py
# Flask应用工厂

# 修复PyInstaller构建问题 - 导入gevent异步驱动
try:
    from engineio.async_drivers import gevent
except ImportError:
    pass

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
    # 禁用Flask默认的静态文件处理，我们将自己处理
    app = Flask(__name__, static_folder=None)
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
        "http://localhost:5000",  # 允许从同一服务器访问（生产环境）
        "http://127.0.0.1:5000",
        "http://0.0.0.0:5000",
    ]
    
    # 如果是开发环境，允许局域网访问
    if app.config.get('ENV') == 'development' or app.config.get('DEBUG'):
        # 获取本机IP地址并添加到允许列表
        try:
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
            # 添加3000端口（前端开发服务器）
            local_origin_3000 = f"http://{local_ip}:3000"
            if local_origin_3000 not in cors_origins:
                cors_origins.append(local_origin_3000)
                app.logger.info(f"添加本机IP到CORS允许列表: {local_origin_3000}")
            
            # 添加5000端口（后端服务器，支持局域网直接访问）
            local_origin_5000 = f"http://{local_ip}:5000"
            if local_origin_5000 not in cors_origins:
                cors_origins.append(local_origin_5000)
                app.logger.info(f"添加本机IP到CORS允许列表: {local_origin_5000}")
                
        except Exception as e:
            app.logger.warning(f"无法获取本机IP: {e}")
        
        # 注意：当使用 supports_credentials=True 时，不能使用通配符 *
        # 因为这会导致浏览器拒绝发送Cookie
    
    app.logger.info(f"CORS允许的来源: {cors_origins}")
    
    # Flask CORS配置（用于HTTP API）- 移到这里，在蓝图注册之前
    CORS(app, 
         supports_credentials=True, 
         origins=cors_origins,  # 使用统一的origins列表
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
    
    # 先初始化Socket.IO，确保它的路由在我们的通配符路由之前注册
    socketio.init_app(app, 
                     cors_allowed_origins=cors_origins,
                     logger=True,
                     engineio_logger=True,
                     ping_timeout=60,
                     ping_interval=25)
    
    # 注册API蓝图
    from app.api import bp as api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # 添加静态文件服务 - 用于提供上传的头像文件
    from flask import send_from_directory
    import os
    
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        upload_folder = os.path.join(app.root_path, '..', 'uploads')
        return send_from_directory(upload_folder, filename)
    
    # 添加前端静态文件服务
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        """服务前端静态文件"""
        import sys
        
        # 确定静态文件目录
        if getattr(sys, 'frozen', False):
            # 如果是打包后的可执行文件
            static_folder = os.path.join(sys._MEIPASS, 'frontend', 'build')
        else:
            # 开发环境
            static_folder = os.path.join(app.root_path, '..', 'frontend', 'build')
        
        # 如果请求的是API路径、Socket.IO路径或uploads路径，跳过前端路由
        if path.startswith('api/') or path.startswith('uploads/') or path.startswith('socket.io/'):
            from flask import abort
            abort(404)
        
        # 处理静态文件请求（CSS、JS、图片等）
        if path.startswith('static/'):
            file_path = os.path.join(static_folder, path)
            if os.path.exists(file_path):
                return send_from_directory(static_folder, path)
            else:
                from flask import abort
                abort(404)
        
        # 处理其他静态资源（favicon.ico、manifest.json等）
        if path and os.path.exists(os.path.join(static_folder, path)):
            return send_from_directory(static_folder, path)
        
        # 对于所有其他路径，返回index.html（支持React Router）
        index_path = os.path.join(static_folder, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder, 'index.html')
        else:
            from flask import abort
            abort(404)
    

    
    # 确保instance文件夹存在（用于存储数据库文件）
    instance_dir = os.path.join(app.config.get('BASE_PATH', os.path.dirname(os.path.abspath(__file__))), 'instance')
    if not os.path.exists(instance_dir):
        os.makedirs(instance_dir)
        app.logger.info(f'创建instance文件夹: {instance_dir}')
    
    # 创建数据库表
    with app.app_context():
        db.create_all()
    
    return app

# 导入模型以确保它们被注册
from app import models

# 导入socket事件处理器
from app import socket_events
