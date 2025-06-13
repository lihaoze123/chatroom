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
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'}
ALLOWED_FILE_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt', 'zip', 'rar', 'mp3', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'ppt', 'pptx', 'xls', 'xlsx', 'csv', 'json', 'xml', 'html', 'css', 'js', 'py', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'sql', 'md', 'rtf', 'odt', 'ods', 'odp', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso', 'dmg', 'exe', 'msi', 'deb', 'rpm', 'apk', 'ipa'}
ALL_ALLOWED_EXTENSIONS = ALLOWED_IMAGE_EXTENSIONS | ALLOWED_FILE_EXTENSIONS

# 最大文件大小
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB for avatars
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB for images
MAX_CHAT_FILE_SIZE = 50 * 1024 * 1024   # 50MB for files

def allowed_file(filename):
    """检查文件扩展名是否允许"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def allowed_chat_file(filename, file_type='image'):
    """检查聊天文件扩展名是否允许"""
    if '.' not in filename:
        return False
    
    ext = filename.rsplit('.', 1)[1].lower()
    if file_type == 'image':
        return ext in ALLOWED_IMAGE_EXTENSIONS
    else:
        # 允许所有文件类型
        return True

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

@bp.route('/upload/chat-file', methods=['POST'])
@login_required
def upload_chat_file():
    """上传聊天文件API"""
    client_ip = get_client_ip()
    current_app.logger.info(f'聊天文件上传请求 - 用户ID: {current_user.id}, IP: {client_ip}')
    
    # 检查是否有文件
    if 'file' not in request.files:
        return jsonify({'error': '请选择要上传的文件'}), 400
    
    file = request.files['file']
    file_type = request.form.get('type', 'file')  # 'image' or 'file'
    
    # 检查文件名
    if file.filename == '':
        return jsonify({'error': '请选择要上传的文件'}), 400
    
    # 检查文件类型
    if not allowed_chat_file(file.filename, file_type):
        if file_type == 'image':
            return jsonify({'error': '只支持 PNG、JPG、JPEG、GIF、WEBP、BMP 格式的图片'}), 400
        else:
            # 现在允许所有文件类型，这个分支理论上不会执行
            return jsonify({'error': '文件格式验证失败'}), 400
    
    # 检查文件大小
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    
    max_size = MAX_IMAGE_SIZE if file_type == 'image' else MAX_CHAT_FILE_SIZE
    if file_size > max_size:
        size_limit = '10MB' if file_type == 'image' else '50MB'
        return jsonify({'error': f'文件大小不能超过{size_limit}'}), 400
    
    try:
        # 生成唯一文件名
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        
        # 确保上传目录存在
        upload_dir = os.path.join(current_app.root_path, '..', 'uploads', 'chat-files')
        os.makedirs(upload_dir, exist_ok=True)
        
        # 保存文件
        file_path = os.path.join(upload_dir, unique_filename)
        file.save(file_path)
        
        # 生成访问URL
        file_url = f"/uploads/chat-files/{unique_filename}"
        
        current_app.logger.info(f'聊天文件上传成功 - 用户ID: {current_user.id}, 文件: {unique_filename}, IP: {client_ip}')
        
        return jsonify({
            'message': '文件上传成功！',
            'file_url': file_url,
            'file_name': file.filename,
            'file_size': file_size,
            'file_type': file_type
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'聊天文件上传失败：服务器错误 - 用户ID: {current_user.id}, IP: {client_ip}, 错误: {str(e)}')
        return jsonify({'error': '上传失败，请稍后重试'}), 500