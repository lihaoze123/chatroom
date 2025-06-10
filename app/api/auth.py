# app/api/auth.py
# 认证API

from flask import request, jsonify, session
from flask_login import login_user, logout_user, current_user, login_required
from app import db
from app.api import bp
from app.models import User
import re

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
    # 支持JSON和FormData两种格式
    if request.is_json:
        data = request.get_json()
        if not data:
            return jsonify({'error': '请提供有效的JSON数据'}), 400
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
    else:
        # FormData格式
        username = request.form.get('username', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
    
    # 验证必填字段
    if not all([username, email, password]):
        return jsonify({'error': '用户名、邮箱和密码都是必填项'}), 400
    
    # 验证用户名长度
    if len(username) < 3 or len(username) > 20:
        return jsonify({'error': '用户名长度必须在3-20个字符之间'}), 400
    
    # 验证邮箱格式
    if not validate_email(email):
        return jsonify({'error': '请输入有效的邮箱地址'}), 400
    
    # 验证密码强度
    is_valid, error_msg = validate_password(password)
    if not is_valid:
        return jsonify({'error': error_msg}), 400
    
    # 检查用户名是否已存在
    if User.query.filter_by(username=username).first():
        return jsonify({'error': '用户名已存在，请选择其他用户名'}), 409
    
    # 检查邮箱是否已存在
    if User.query.filter_by(email=email).first():
        return jsonify({'error': '邮箱已被注册，请使用其他邮箱'}), 409
    
    try:
        # 创建新用户
        user = User(username=username, email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': '注册成功！',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '注册失败，请稍后重试'}), 500

@bp.route('/auth/login', methods=['POST'])
def api_login():
    """用户登录API"""
    # 支持JSON和FormData两种格式
    if request.is_json:
        data = request.get_json()
        if not data:
            return jsonify({'error': '请提供有效的JSON数据'}), 400
        username = data.get('username', '').strip()
        password = data.get('password', '')
        remember_me = data.get('remember_me', False)
    else:
        # FormData格式
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        remember_me = request.form.get('remember_me') == 'on'
    
    # 验证必填字段
    if not username or not password:
        return jsonify({'error': '用户名和密码都是必填项'}), 400
    
    # 查找用户
    user = User.query.filter_by(username=username).first()
    
    if not user or not user.check_password(password):
        return jsonify({'error': '用户名或密码错误'}), 401
    
    try:
        # 登录用户
        login_user(user, remember=remember_me)
        user.set_online_status(True)
        
        return jsonify({
            'message': f'欢迎回来，{user.username}！',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': '登录失败，请稍后重试'}), 500

@bp.route('/auth/logout', methods=['POST'])
@login_required
def api_logout():
    """用户登出API"""
    try:
        if current_user.is_authenticated:
            current_user.set_online_status(False)
        logout_user()
        
        return jsonify({'message': '已成功登出'}), 200
        
    except Exception as e:
        return jsonify({'error': '登出失败'}), 500

@bp.route('/auth/me', methods=['GET'])
@login_required
def api_current_user():
    """获取当前用户信息API"""
    return jsonify({
        'user': current_user.to_dict()
    }), 200

@bp.route('/auth/profile', methods=['PUT'])
@login_required
def api_update_profile():
    """更新用户资料API"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': '请提供有效的JSON数据'}), 400
    
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    avatar_url = data.get('avatar_url', '').strip()
    
    # 验证必填字段
    if not username or not email:
        return jsonify({'error': '用户名和邮箱都是必填项'}), 400
    
    # 验证用户名长度
    if len(username) < 3 or len(username) > 20:
        return jsonify({'error': '用户名长度必须在3-20个字符之间'}), 400
    
    # 验证邮箱格式
    if not validate_email(email):
        return jsonify({'error': '请输入有效的邮箱地址'}), 400
    
    # 检查用户名是否已被其他用户使用
    if username != current_user.username:
        if User.query.filter_by(username=username).first():
            return jsonify({'error': '用户名已存在，请选择其他用户名'}), 409
    
    # 检查邮箱是否已被其他用户使用
    if email != current_user.email:
        if User.query.filter_by(email=email).first():
            return jsonify({'error': '邮箱已被注册，请使用其他邮箱'}), 409
    
    try:
        # 更新用户信息
        current_user.username = username
        current_user.email = email
        current_user.avatar_url = avatar_url
        
        db.session.commit()
        
        return jsonify({
            'message': '资料更新成功！',
            'user': current_user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '更新失败，请稍后重试'}), 500

@bp.route('/auth/change-password', methods=['PUT'])
@login_required
def api_change_password():
    """修改密码API"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': '请提供有效的JSON数据'}), 400
    
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')
    
    # 验证必填字段
    if not current_password or not new_password:
        return jsonify({'error': '当前密码和新密码都是必填项'}), 400
    
    # 验证当前密码
    if not current_user.check_password(current_password):
        return jsonify({'error': '当前密码错误'}), 401
    
    # 验证新密码强度
    is_valid, error_msg = validate_password(new_password)
    if not is_valid:
        return jsonify({'error': error_msg}), 400
    
    try:
        # 更新密码
        current_user.set_password(new_password)
        db.session.commit()
        
        return jsonify({'message': '密码修改成功！'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '密码修改失败，请稍后重试'}), 500

@bp.route('/auth/check', methods=['GET'])
def api_check_auth():
    """检查认证状态API"""
    if current_user.is_authenticated:
        return jsonify({
            'authenticated': True,
            'user': current_user.to_dict()
        }), 200
    else:
        return jsonify({
            'authenticated': False,
            'user': None
        }), 200 