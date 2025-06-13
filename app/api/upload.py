# 文件上传API

import os
import uuid
from flask import request, jsonify, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from app.api import bp
from app import db
from app.utils import get_client_ip, log_user_action

# 允许的文件扩展名
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
# 最大文件大小 (5MB)
MAX_FILE_SIZE = 5 * 1024 * 1024

def allowed_file(filename):
    """检查文件扩展名是否允许"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('/upload/avatar', methods=['POST'])
@login_required
def upload_avatar():
    """上传头像API"""
    client_ip = get_client_ip()
    current_app.logger.info(f'头像上传请求 - 用户ID: {current_user.id}, IP: {client_ip}')
    
    # 检查是否有文件
    if 'avatar' not in request.files:
        current_app.logger.warning(f'头像上传失败：未找到文件 - 用户ID: {current_user.id}, IP: {client_ip}')
        return jsonify({'error': '请选择要上传的头像文件'}), 400
    
    file = request.files['avatar']
    
    # 检查文件名
    if file.filename == '':
        current_app.logger.warning(f'头像上传失败：文件名为空 - 用户ID: {current_user.id}, IP: {client_ip}')
        return jsonify({'error': '请选择要上传的头像文件'}), 400
    
    # 检查文件类型
    if not allowed_file(file.filename):
        current_app.logger.warning(f'头像上传失败：文件类型不支持 - 用户ID: {current_user.id}, 文件名: {file.filename}, IP: {client_ip}')
        return jsonify({'error': '只支持 PNG、JPG、JPEG、GIF、WEBP 格式的图片'}), 400
    
    # 检查文件大小
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        current_app.logger.warning(f'头像上传失败：文件过大 - 用户ID: {current_user.id}, 文件大小: {file_size}, IP: {client_ip}')
        return jsonify({'error': '文件大小不能超过5MB'}), 400
    
    try:
        # 生成唯一文件名
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        
        # 确保上传目录存在
        upload_dir = os.path.join(current_app.root_path, '..', 'uploads', 'avatars')
        os.makedirs(upload_dir, exist_ok=True)
        
        # 保存文件
        file_path = os.path.join(upload_dir, unique_filename)
        file.save(file_path)
        
        # 生成访问URL
        avatar_url = f"/uploads/avatars/{unique_filename}"
        
        # 删除旧头像文件（如果存在且不是默认头像）
        if current_user.avatar_url and current_user.avatar_url.startswith('/uploads/avatars/'):
            old_file_path = os.path.join(current_app.root_path, '..', current_user.avatar_url.lstrip('/'))
            if os.path.exists(old_file_path):
                try:
                    os.remove(old_file_path)
                    current_app.logger.info(f'删除旧头像文件: {old_file_path}')
                except Exception as e:
                    current_app.logger.warning(f'删除旧头像文件失败: {e}')
        
        # 更新用户头像URL
        old_avatar_url = current_user.avatar_url
        current_user.avatar_url = avatar_url
        db.session.commit()
        
        log_user_action('头像上传', current_user.id, f'原头像: {old_avatar_url} -> 新头像: {avatar_url}')
        
        current_app.logger.info(f'头像上传成功 - 用户ID: {current_user.id}, 文件: {unique_filename}, IP: {client_ip}')
        
        return jsonify({
            'message': '头像上传成功！',
            'avatar_url': avatar_url,
            'user': current_user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'头像上传失败：服务器错误 - 用户ID: {current_user.id}, IP: {client_ip}, 错误: {str(e)}')
        return jsonify({'error': '上传失败，请稍后重试'}), 500