# app/utils.py
# 工具函数模块

from flask import request, current_app
from functools import wraps
import time

def get_client_ip():
    """获取客户端IP地址"""
    if request.environ.get('HTTP_X_FORWARDED_FOR') is None:
        return request.environ['REMOTE_ADDR']
    else:
        return request.environ['HTTP_X_FORWARDED_FOR']

def log_api_call(func):
    """API调用日志装饰器"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        client_ip = get_client_ip()
        endpoint = request.endpoint
        method = request.method
        
        # 记录API调用开始
        current_app.logger.info(f'API调用开始 - {method} {endpoint} - IP: {client_ip}')
        
        try:
            result = func(*args, **kwargs)
            duration = time.time() - start_time
            
            # 记录API调用成功
            status_code = result[1] if isinstance(result, tuple) else 200
            current_app.logger.info(f'API调用成功 - {method} {endpoint} - 状态码: {status_code} - 耗时: {duration:.3f}s - IP: {client_ip}')
            
            return result
            
        except Exception as e:
            duration = time.time() - start_time
            
            # 记录API调用失败
            current_app.logger.error(f'API调用失败 - {method} {endpoint} - 错误: {str(e)} - 耗时: {duration:.3f}s - IP: {client_ip}')
            raise
    
    return wrapper

def log_security_event(event_type, details, user_id=None, severity='WARNING'):
    """记录安全事件"""
    client_ip = get_client_ip()
    log_message = f'安全事件 - 类型: {event_type} - 详情: {details} - IP: {client_ip}'
    
    if user_id:
        log_message += f' - 用户ID: {user_id}'
    
    if severity == 'ERROR':
        current_app.logger.error(log_message)
    elif severity == 'WARNING':
        current_app.logger.warning(log_message)
    else:
        current_app.logger.info(log_message)

def log_user_action(action, user_id, details=None):
    """记录用户操作"""
    client_ip = get_client_ip()
    log_message = f'用户操作 - 动作: {action} - 用户ID: {user_id} - IP: {client_ip}'
    
    if details:
        log_message += f' - 详情: {details}'
    
    current_app.logger.info(log_message) 