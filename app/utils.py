# app/utils.py
# 应用工具模块

import os
import logging
from datetime import datetime
from functools import wraps
from flask import current_app, request, jsonify
from flask_login import current_user

def setup_logging(app):
    """设置应用日志"""
    if not app.debug and not app.testing:
        # 创建日志目录
        if not os.path.exists('logs'):
            os.mkdir('logs')
        
        # 设置文件日志处理器
        file_handler = logging.FileHandler('logs/chatroom.log')
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        
        app.logger.setLevel(logging.INFO)
        app.logger.info('聊天室应用启动')

def require_json(f):
    """装饰器：要求请求必须是JSON格式"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.is_json:
            return jsonify({'error': '请求必须是JSON格式'}), 400
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """装饰器：要求用户必须是管理员"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({'error': '需要登录'}), 401
        if not getattr(current_user, 'is_admin', False):
            return jsonify({'error': '需要管理员权限'}), 403
        return f(*args, **kwargs)
    return decorated_function

def format_datetime(dt):
    """格式化日期时间"""
    if dt is None:
        return ''
    return dt.strftime('%Y-%m-%d %H:%M:%S')

def get_client_ip():
    """获取客户端IP地址"""
    if request.environ.get('HTTP_X_FORWARDED_FOR') is None:
        return request.environ['REMOTE_ADDR']
    else:
        return request.environ['HTTP_X_FORWARDED_FOR']

def validate_password(password):
    """验证密码强度"""
    if len(password) < 8:
        return False, '密码长度至少8位'
    
    if not any(c.isupper() for c in password):
        return False, '密码必须包含大写字母'
    
    if not any(c.islower() for c in password):
        return False, '密码必须包含小写字母'
    
    if not any(c.isdigit() for c in password):
        return False, '密码必须包含数字'
    
    return True, '密码符合要求'

def sanitize_filename(filename):
    """清理文件名，移除危险字符"""
    import re
    # 移除路径分隔符和其他危险字符
    filename = re.sub(r'[<>:"/\\|?*]', '', filename)
    # 移除控制字符
    filename = ''.join(c for c in filename if ord(c) >= 32)
    return filename.strip()

class RateLimiter:
    """简单的速率限制器"""
    def __init__(self):
        self.requests = {}
    
    def is_allowed(self, key, limit=10, window=60):
        """检查是否允许请求"""
        now = datetime.now().timestamp()
        
        if key not in self.requests:
            self.requests[key] = []
        
        # 清理过期的请求记录
        self.requests[key] = [
            req_time for req_time in self.requests[key]
            if now - req_time < window
        ]
        
        # 检查是否超过限制
        if len(self.requests[key]) >= limit:
            return False
        
        # 记录当前请求
        self.requests[key].append(now)
        return True

# 全局速率限制器实例
rate_limiter = RateLimiter() 