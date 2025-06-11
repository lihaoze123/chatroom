# app/api/auth.py
# 认证API

from flask import request, jsonify, session, current_app
from flask_login import login_user, logout_user, current_user, login_required
from app import db
from app.api import bp
from app.models import User
from app.utils import get_client_ip, log_security_event, log_user_action
import re
import logging

def validate_email(email):
    """验证邮箱格式"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """验证密码强度"""
    if len(password) < 6:
        return False, "密码长度至少6个字符"
    return True, ""

@bp.route('/auth/register', methods=['POST'])
def api_register():
    """用户注册API"""
    client_ip = get_client_ip()
    current_app.logger.info(f'用户注册请求 - IP: {client_ip}')
    
    # 支持JSON和FormData两种格式
    if request.is_json:
        data = request.get_json()
        if not data:
            current_app.logger.warning(f'注册失败：无效的JSON数据 - IP: {client_ip}')
            return jsonify({'error': '请提供有效的JSON数据'}), 400
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
    else:
        # FormData格式
        username = request.form.get('username', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
    
    current_app.logger.debug(f'注册尝试 - 用户名: {username}, 邮箱: {email}, IP: {client_ip}')
    
    # 验证必填字段
    if not all([username, email, password]):
        current_app.logger.warning(f'注册失败：缺少必填字段 - 用户名: {username}, 邮箱: {email}, IP: {client_ip}')
        return jsonify({'error': '用户名、邮箱和密码都是必填项'}), 400
    
    # 验证用户名长度
    if len(username) < 3 or len(username) > 20:
        current_app.logger.warning(f'注册失败：用户名长度无效 - 用户名: {username}, 长度: {len(username)}, IP: {client_ip}')
        return jsonify({'error': '用户名长度必须在3-20个字符之间'}), 400
    
    # 验证邮箱格式
    if not validate_email(email):
        current_app.logger.warning(f'注册失败：邮箱格式无效 - 邮箱: {email}, IP: {client_ip}')
        return jsonify({'error': '请输入有效的邮箱地址'}), 400
    
    # 验证密码强度
    is_valid, error_msg = validate_password(password)
    if not is_valid:
        current_app.logger.warning(f'注册失败：密码强度不足 - 用户名: {username}, IP: {client_ip}')
        return jsonify({'error': error_msg}), 400
    
    # 检查用户名是否已存在
    if User.query.filter_by(username=username).first():
        log_security_event('重复用户名注册尝试', f'用户名: {username}')
        return jsonify({'error': '用户名已存在，请选择其他用户名'}), 409
    
    # 检查邮箱是否已存在
    if User.query.filter_by(email=email).first():
        log_security_event('重复邮箱注册尝试', f'邮箱: {email}')
        return jsonify({'error': '邮箱已被注册，请使用其他邮箱'}), 409
    
    try:
        # 创建新用户
        user = User(username=username, email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        log_user_action('用户注册', user.id, f'用户名: {username}, 邮箱: {email}')
        
        return jsonify({
            'message': '注册成功！',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'注册失败：数据库错误 - 用户名: {username}, 邮箱: {email}, IP: {client_ip}, 错误: {str(e)}')
        return jsonify({'error': '注册失败，请稍后重试'}), 500

@bp.route('/auth/login', methods=['POST'])
def api_login():
    """用户登录API"""
    client_ip = get_client_ip()
    current_app.logger.info(f'用户登录请求 - IP: {client_ip}')
    
    # 支持JSON和FormData两种格式
    if request.is_json:
        data = request.get_json()
        if not data:
            current_app.logger.warning(f'登录失败：无效的JSON数据 - IP: {client_ip}')
            return jsonify({'error': '请提供有效的JSON数据'}), 400
        username = data.get('username', '').strip()
        password = data.get('password', '')
        remember_me = data.get('remember_me', False)
    else:
        # FormData格式
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        remember_me = request.form.get('remember_me') == 'on'
    
    current_app.logger.debug(f'登录尝试 - 用户名: {username}, 记住我: {remember_me}, 密码: {password}, IP: {client_ip}')
    
    # 验证必填字段
    if not username or not password:
        current_app.logger.warning(f'登录失败：缺少必填字段 - 用户名: {username}, IP: {client_ip}')
        return jsonify({'error': '用户名和密码都是必填项'}), 400
    
    # 查找用户
    user = User.query.filter_by(username=username).first()
    
    if not user or not user.check_password(password):
        log_security_event('登录失败', f'用户名或密码错误 - 用户名: {username}', severity='WARNING')
        return jsonify({'error': '用户名或密码错误'}), 401
    
    try:
        # 登录用户
        login_user(user, remember=remember_me)
        user.set_online_status(True)
        
        # 添加会话调试信息
        from flask import session
        current_app.logger.debug(f'登录成功 - 用户名: {username}, 记住我: {remember_me}, Session ID: {session.get("_id", "无")}, 用户ID: {session.get("_user_id", "无")}, IP: {client_ip}')
        
        response = jsonify({
            'message': f'欢迎回来，{user.username}！',
            'user': user.to_dict()
        })
        
        # 调试响应头中的Cookie设置
        current_app.logger.debug(f'登录响应Cookie设置: {response.headers.get("Set-Cookie", "无Cookie设置")}')
        
        return response, 200
        
    except Exception as e:
        current_app.logger.error(f'登录失败：系统错误 - 用户名: {username}, IP: {client_ip}, 错误: {str(e)}')
        return jsonify({'error': '登录失败，请稍后重试'}), 500

@bp.route('/auth/logout', methods=['POST'])
@login_required
def api_logout():
    """用户登出API"""
    client_ip = get_client_ip()
    user_id = current_user.id if current_user.is_authenticated else None
    username = current_user.username if current_user.is_authenticated else None
    
    current_app.logger.info(f'用户登出请求 - 用户ID: {user_id}, 用户名: {username}, IP: {client_ip}')
    
    try:
        if current_user.is_authenticated:
            current_user.set_online_status(False)
        logout_user()
        
        log_user_action('用户登出', user_id, f'用户名: {username}')
        
        return jsonify({'message': '已成功登出'}), 200
        
    except Exception as e:
        current_app.logger.error(f'登出失败：系统错误 - 用户ID: {user_id}, IP: {client_ip}, 错误: {str(e)}')
        return jsonify({'error': '登出失败'}), 500

@bp.route('/auth/me', methods=['GET'])
@login_required
def api_current_user():
    """获取当前用户信息API"""
    client_ip = get_client_ip()
    current_app.logger.debug(f'获取当前用户信息 - 用户ID: {current_user.id}, IP: {client_ip}')
    
    return jsonify({
        'user': current_user.to_dict()
    }), 200

@bp.route('/auth/profile', methods=['PUT'])
@login_required
def api_update_profile():
    """更新用户资料API"""
    client_ip = get_client_ip()
    current_app.logger.info(f'更新用户资料请求 - 用户ID: {current_user.id}, IP: {client_ip}')
    
    data = request.get_json()
    
    if not data:
        current_app.logger.warning(f'更新资料失败：无效的JSON数据 - 用户ID: {current_user.id}, IP: {client_ip}')
        return jsonify({'error': '请提供有效的JSON数据'}), 400
    
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    avatar_url = data.get('avatar_url', '').strip()
    
    current_app.logger.debug(f'资料更新尝试 - 用户ID: {current_user.id}, 新用户名: {username}, 新邮箱: {email}, IP: {client_ip}')
    
    # 验证必填字段
    if not username or not email:
        current_app.logger.warning(f'更新资料失败：缺少必填字段 - 用户ID: {current_user.id}, IP: {client_ip}')
        return jsonify({'error': '用户名和邮箱都是必填项'}), 400
    
    # 验证用户名长度
    if len(username) < 3 or len(username) > 20:
        current_app.logger.warning(f'更新资料失败：用户名长度无效 - 用户ID: {current_user.id}, 用户名: {username}, IP: {client_ip}')
        return jsonify({'error': '用户名长度必须在3-20个字符之间'}), 400
    
    # 验证邮箱格式
    if not validate_email(email):
        current_app.logger.warning(f'更新资料失败：邮箱格式无效 - 用户ID: {current_user.id}, 邮箱: {email}, IP: {client_ip}')
        return jsonify({'error': '请输入有效的邮箱地址'}), 400
    
    # 检查用户名是否已被其他用户使用
    if username != current_user.username:
        if User.query.filter_by(username=username).first():
            current_app.logger.warning(f'更新资料失败：用户名已存在 - 用户ID: {current_user.id}, 用户名: {username}, IP: {client_ip}')
            return jsonify({'error': '用户名已存在，请选择其他用户名'}), 409
    
    # 检查邮箱是否已被其他用户使用
    if email != current_user.email:
        if User.query.filter_by(email=email).first():
            current_app.logger.warning(f'更新资料失败：邮箱已被注册 - 用户ID: {current_user.id}, 邮箱: {email}, IP: {client_ip}')
            return jsonify({'error': '邮箱已被注册，请使用其他邮箱'}), 409
    
    try:
        # 记录原始信息
        old_username = current_user.username
        old_email = current_user.email
        
        # 更新用户信息
        current_user.username = username
        current_user.email = email
        current_user.avatar_url = avatar_url
        
        db.session.commit()
        
        log_user_action('资料更新', current_user.id, f'原用户名: {old_username} -> 新用户名: {username}, 原邮箱: {old_email} -> 新邮箱: {email}')
        
        return jsonify({
            'message': '资料更新成功！',
            'user': current_user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'更新资料失败：数据库错误 - 用户ID: {current_user.id}, IP: {client_ip}, 错误: {str(e)}')
        return jsonify({'error': '更新失败，请稍后重试'}), 500

@bp.route('/auth/change-password', methods=['PUT'])
@login_required
def api_change_password():
    """修改密码API"""
    client_ip = get_client_ip()
    current_app.logger.info(f'修改密码请求 - 用户ID: {current_user.id}, IP: {client_ip}')
    
    data = request.get_json()
    
    if not data:
        current_app.logger.warning(f'修改密码失败：无效的JSON数据 - 用户ID: {current_user.id}, IP: {client_ip}')
        return jsonify({'error': '请提供有效的JSON数据'}), 400
    
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')
    
    # 验证必填字段
    if not current_password or not new_password:
        current_app.logger.warning(f'修改密码失败：缺少必填字段 - 用户ID: {current_user.id}, IP: {client_ip}')
        return jsonify({'error': '当前密码和新密码都是必填项'}), 400
    
    # 验证当前密码
    if not current_user.check_password(current_password):
        log_security_event('密码修改失败', '当前密码错误', current_user.id, 'WARNING')
        return jsonify({'error': '当前密码错误'}), 401
    
    # 验证新密码强度
    is_valid, error_msg = validate_password(new_password)
    if not is_valid:
        current_app.logger.warning(f'修改密码失败：新密码强度不足 - 用户ID: {current_user.id}, IP: {client_ip}')
        return jsonify({'error': error_msg}), 400
    
    try:
        # 更新密码
        current_user.set_password(new_password)
        db.session.commit()
        
        log_user_action('密码修改', current_user.id, f'用户名: {current_user.username}')
        
        return jsonify({'message': '密码修改成功！'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'修改密码失败：数据库错误 - 用户ID: {current_user.id}, IP: {client_ip}, 错误: {str(e)}')
        return jsonify({'error': '密码修改失败，请稍后重试'}), 500

@bp.route('/auth/check', methods=['GET'])
def api_check_auth():
    """检查认证状态API"""
    client_ip = get_client_ip()
    
    # 添加更详细的会话调试信息
    from flask import session, request
    cookies = dict(request.cookies)
    current_app.logger.debug(f'会话调试 - Session ID: {session.get("_id", "无")}, 用户ID: {session.get("_user_id", "无")}, IP: {client_ip}')
    current_app.logger.debug(f'Cookie调试 - 收到的Cookies: {cookies}')
    
    if current_user.is_authenticated:
        current_app.logger.debug(f'认证状态检查：已认证 - 用户ID: {current_user.id}, IP: {client_ip}')
        return jsonify({
            'authenticated': True,
            'user': current_user.to_dict()
        }), 200
    else:
        current_app.logger.debug(f'认证状态检查：未认证 - IP: {client_ip}')
        return jsonify({
            'authenticated': False,
            'user': None
        }), 200 