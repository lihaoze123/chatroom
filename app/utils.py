# app/utils.py
# 工具函数模块

from fastapi import Request
from functools import wraps
import time
import logging
import asyncio
import inspect

logger = logging.getLogger(__name__)

def get_client_ip(request: Request) -> str:
    """获取客户端IP地址"""
    # 检查代理头
    forwarded_for = request.headers.get('X-Forwarded-For')
    if forwarded_for:
        return forwarded_for.split(',')[0].strip()
    
    real_ip = request.headers.get('X-Real-IP')
    if real_ip:
        return real_ip
    
    # 返回客户端IP
    return request.client.host if request.client else "unknown"

def log_api_call(func):
    """API调用日志装饰器"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        
        # 尝试从参数中获取request对象
        request = None
        for arg in args:
            if isinstance(arg, Request):
                request = arg
                break
        
        client_ip = get_client_ip(request) if request else "unknown"
        endpoint = request.url.path if request else "unknown"
        method = request.method if request else "unknown"
        
        # 记录API调用开始
        logger.info(f'API调用开始 - {method} {endpoint} - IP: {client_ip}')
        
        try:
            result = await func(*args, **kwargs) if inspect.iscoroutinefunction(func) else func(*args, **kwargs)
            duration = time.time() - start_time
            
            # 记录API调用成功
            logger.info(f'API调用成功 - {method} {endpoint} - 耗时: {duration:.3f}s - IP: {client_ip}')
            
            return result
            
        except Exception as e:
            duration = time.time() - start_time
            
            # 记录API调用失败
            logger.error(f'API调用失败 - {method} {endpoint} - 错误: {str(e)} - 耗时: {duration:.3f}s - IP: {client_ip}')
            raise
    
    return wrapper

def log_security_event(event_type: str, details: str, user_id: int = None, severity: str = 'WARNING', request: Request = None):
    """记录安全事件"""
    client_ip = get_client_ip(request) if request else "unknown"
    log_message = f'安全事件 - 类型: {event_type} - 详情: {details} - IP: {client_ip}'
    
    if user_id:
        log_message += f' - 用户ID: {user_id}'
    
    if severity == 'ERROR':
        logger.error(log_message)
    elif severity == 'WARNING':
        logger.warning(log_message)
    else:
        logger.info(log_message)

def log_user_action(action: str, user_id: int, details: str = None, request: Request = None):
    """记录用户操作"""
    client_ip = get_client_ip(request) if request else "unknown"
    log_message = f'用户操作 - 动作: {action} - 用户ID: {user_id} - IP: {client_ip}'
    
    if details:
        log_message += f' - 详情: {details}'
    
    logger.info(log_message) 