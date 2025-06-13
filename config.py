# config.py
# Flask应用配置文件
import os
import sys

def get_base_path():
    """获取应用基础路径，兼容开发环境和打包后的环境"""
    if getattr(sys, 'frozen', False):
        # 如果是打包后的可执行文件
        return os.path.dirname(sys.executable)
    else:
        # 开发环境
        return os.path.abspath(os.path.dirname(__file__))

class Config:
    """基础配置类"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess-this-secret'
    
    # 获取基础路径
    BASE_PATH = get_base_path()
    
    # 数据库配置 - 使用绝对路径
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
                              'sqlite:///' + os.path.join(BASE_PATH, 'instance', 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # 会话配置
    SESSION_COOKIE_SECURE = False  # 开发环境设为False，生产环境应设为True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'  # 允许跨站请求携带Cookie
    SESSION_COOKIE_DOMAIN = None  # 允许所有域名，开发环境使用
    PERMANENT_SESSION_LIFETIME = 86400  # 24小时
    
    # 日志配置 - 使用绝对路径
    LOG_LEVEL = os.environ.get('LOG_LEVEL') or 'INFO'
    LOG_FILE = os.environ.get('LOG_FILE') or os.path.join(BASE_PATH, 'logs', 'app.log')
    LOG_MAX_BYTES = int(os.environ.get('LOG_MAX_BYTES', 10 * 1024 * 1024))  # 10MB
    LOG_BACKUP_COUNT = int(os.environ.get('LOG_BACKUP_COUNT', 5))

class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True
    LOG_LEVEL = 'DEBUG'

class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False
    LOG_LEVEL = 'WARNING'

class TestingConfig(Config):
    """测试环境配置"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    LOG_LEVEL = 'ERROR'

# 配置字典
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}