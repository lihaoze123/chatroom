# app/api/chat.py
# 聊天API

from flask import request, jsonify
from flask_login import login_required, current_user
from sqlalchemy import desc
from app import db
from app.api import bp
from app.models import Room, Message, RoomMembership, User, PrivateChat
from app.crypto_utils import decrypt_private_message

@bp.route('/rooms', methods=['GET'])
@login_required
def api_get_rooms():
    """获取房间列表API"""
    from app.utils import get_client_ip
    from flask import current_app
    from flask_login import current_user
    
    client_ip = get_client_ip()
    current_app.logger.debug(f'获取房间列表请求 - 用户ID: {current_user.id}, 用户名: {current_user.username}, IP: {client_ip}')
    
    try:
        # 获取用户加入的房间
        user_rooms = Room.query.join(RoomMembership).filter(
            RoomMembership.user_id == current_user.id
        ).all()
        
        # 获取公共房间
        public_rooms = Room.query.filter_by(is_private=False).all()
        
        current_app.logger.debug(f'房间列表获取成功 - 用户房间数: {len(user_rooms)}, 公共房间数: {len(public_rooms)}, 用户ID: {current_user.id}')
        
        return jsonify({
            'user_rooms': [room.to_dict() for room in user_rooms],
            'public_rooms': [room.to_dict() for room in public_rooms]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'获取房间列表失败 - 用户ID: {current_user.id}, IP: {client_ip}, 错误: {str(e)}')
        return jsonify({'error': '获取房间列表失败'}), 500

@bp.route('/private-chats', methods=['GET'])
@login_required
def api_get_private_chats():
    """获取私聊列表API"""
    from app.utils import get_client_ip
    from flask import current_app
    
    client_ip = get_client_ip()
    current_app.logger.debug(f'获取私聊列表请求 - 用户ID: {current_user.id}, IP: {client_ip}')
    
    try:
        # 获取用户的所有私聊
        private_chats = PrivateChat.query.filter(
            (PrivateChat.user1_id == current_user.id) | 
            (PrivateChat.user2_id == current_user.id)
        ).order_by(PrivateChat.last_message_at.desc()).all()
        
        private_chats_data = []
        for chat in private_chats:
            other_user = chat.get_other_user(current_user.id)
            if other_user:
                # 获取最后一条消息
                last_message = Message.query.filter_by(
                    room_id=chat.room_id,
                    is_deleted=False
                ).order_by(Message.timestamp.desc()).first()
            
                last_message_content = None
                last_message_time = None
                if last_message:
                    # 解密私聊消息
                    if hasattr(last_message, 'is_encrypted') and last_message.is_encrypted:
                        decrypted_content = decrypt_private_message(
                            last_message.content,
                            chat.user1_id,
                            chat.user2_id,
                            chat.room_id
                        )
                        last_message_content = decrypted_content if decrypted_content else "[加密消息]"
                    else:
                        last_message_content = last_message.content
                    last_message_time = last_message.timestamp.isoformat()
                
                chat_data = {
                    'id': chat.id,
                    'room_id': chat.room_id,
                    'other_user': other_user.to_dict(),
                    'last_message': last_message.to_dict() if last_message else None,
                    'last_message_at': chat.last_message_at.isoformat() if chat.last_message_at else None
                }
                private_chats_data.append(chat_data)
        
        current_app.logger.debug(f'私聊列表获取成功 - 私聊数量: {len(private_chats_data)}, 用户ID: {current_user.id}')
        
        return jsonify({
            'private_chats': private_chats_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'获取私聊列表失败 - 用户ID: {current_user.id}, IP: {client_ip}, 错误: {str(e)}')
        return jsonify({'error': '获取私聊列表失败'}), 500

@bp.route('/private-chats', methods=['POST'])
@login_required
def api_create_private_chat():
    """创建私聊API"""
    from app.utils import get_client_ip
    from flask import current_app
    
    client_ip = get_client_ip()
    data = request.get_json()
    
    if not data:
        current_app.logger.warning(f'创建私聊失败：无效的JSON数据 - 用户ID: {current_user.id}, IP: {client_ip}')
        return jsonify({'error': '请提供有效的JSON数据'}), 400
    
    target_user_id = data.get('target_user_id')
    if not target_user_id:
        current_app.logger.warning(f'创建私聊失败：缺少目标用户ID - 用户ID: {current_user.id}, IP: {client_ip}')
        return jsonify({'error': '请提供目标用户ID'}), 400
    
    if target_user_id == current_user.id:
        current_app.logger.warning(f'创建私聊失败：不能与自己私聊 - 用户ID: {current_user.id}, IP: {client_ip}')
        return jsonify({'error': '不能与自己私聊'}), 400
    
    # 检查目标用户是否存在
    target_user = User.query.get(target_user_id)
    if not target_user:
        current_app.logger.warning(f'创建私聊失败：目标用户不存在 - 用户ID: {current_user.id}, 目标用户ID: {target_user_id}, IP: {client_ip}')
        return jsonify({'error': '目标用户不存在'}), 404
    
    try:
        # 获取或创建私聊
        private_chat = PrivateChat.get_or_create_private_chat(current_user.id, target_user_id)
        
        if not private_chat:
            current_app.logger.error(f'创建私聊失败 - 用户ID: {current_user.id}, 目标用户ID: {target_user_id}, IP: {client_ip}')
            return jsonify({'error': '创建私聊失败'}), 500
        
        current_app.logger.info(f'私聊创建成功 - 用户ID: {current_user.id}, 目标用户ID: {target_user_id}, 房间ID: {private_chat.room_id}')
        
        return jsonify({
            'private_chat': private_chat.to_dict(current_user.id),
            'room': private_chat.room.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'创建私聊失败 - 用户ID: {current_user.id}, 目标用户ID: {target_user_id}, IP: {client_ip}, 错误: {str(e)}')
        return jsonify({'error': '创建私聊失败'}), 500

@bp.route('/users', methods=['GET'])
@login_required
def api_get_users():
    """获取用户列表API（用于创建私聊）"""
    from app.utils import get_client_ip
    from flask import current_app
    
    client_ip = get_client_ip()
    current_app.logger.debug(f'获取用户列表请求 - 用户ID: {current_user.id}, IP: {client_ip}')
    
    try:
        # 获取搜索关键词
        search = request.args.get('search', '').strip()
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 50)  # 限制每页最多50个
        
        # 构建查询
        query = User.query.filter(User.id != current_user.id)  # 排除当前用户
        
        if search:
            query = query.filter(
                (User.username.contains(search)) |
                (User.email.contains(search))
            )
        
        # 分页查询
        users_pagination = query.order_by(User.username).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        users_data = []
        for user in users_pagination.items:
            user_data = user.to_dict()
            # 检查是否已有私聊
            existing_chat = PrivateChat.query.filter(
                ((PrivateChat.user1_id == current_user.id) & (PrivateChat.user2_id == user.id)) |
                ((PrivateChat.user1_id == user.id) & (PrivateChat.user2_id == current_user.id))
            ).first()
            user_data['has_private_chat'] = existing_chat is not None
            if existing_chat:
                user_data['private_chat_room_id'] = existing_chat.room_id
            users_data.append(user_data)
        
        current_app.logger.debug(f'用户列表获取成功 - 用户数量: {len(users_data)}, 当前用户ID: {current_user.id}')
        
        return jsonify({
            'users': users_data,
            'pagination': {
                'page': users_pagination.page,
                'pages': users_pagination.pages,
                'per_page': users_pagination.per_page,
                'total': users_pagination.total,
                'has_next': users_pagination.has_next,
                'has_prev': users_pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'获取用户列表失败 - 用户ID: {current_user.id}, IP: {client_ip}, 错误: {str(e)}')
        return jsonify({'error': '获取用户列表失败'}), 500

@bp.route('/rooms', methods=['POST'])
@login_required
def api_create_room():
    """创建房间API"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': '请提供有效的JSON数据'}), 400
    
    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    is_private = data.get('is_private', False)
    
    # 验证房间名称
    if not name:
        return jsonify({'error': '房间名称不能为空'}), 400
    
    if len(name) < 2 or len(name) > 50:
        return jsonify({'error': '房间名称长度必须在2-50个字符之间'}), 400
    
    # 检查房间名是否已存在
    if Room.query.filter_by(name=name).first():
        return jsonify({'error': '房间名称已存在，请选择其他名称'}), 409
    
    try:
        # 创建房间
        room = Room(
            name=name,
            description=description,
            is_private=is_private,
            created_by=current_user.id
        )
        db.session.add(room)
        db.session.commit()
        
        # 创建者自动加入房间
        room.add_member(current_user)
        
        return jsonify({
            'message': f'聊天室 "{name}" 创建成功！',
            'room': room.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '创建房间失败，请稍后重试'}), 500

@bp.route('/rooms/<int:room_id>', methods=['GET'])
@login_required
def api_get_room(room_id):
    """获取房间详情API"""
    room = Room.query.get_or_404(room_id)
    
    # 检查权限
    if room.is_private and not room.is_member(current_user):
        return jsonify({'error': '无权限访问此房间'}), 403
    
    try:
        # 如果是公共房间且用户未加入，自动加入
        if not room.is_private and not room.is_member(current_user):
            room.add_member(current_user)
        
        # 获取房间成员
        members = room.get_members()
        online_members = room.get_online_members()
        
        room_data = room.to_dict()
        room_data.update({
            'members': [user.to_dict() for user in members],
            'online_members': [user.to_dict() for user in online_members],
            'is_member': room.is_member(current_user)
        })
        
        return jsonify({'room': room_data}), 200
        
    except Exception as e:
        return jsonify({'error': '获取房间信息失败'}), 500

@bp.route('/rooms/<int:room_id>/join', methods=['POST'])
@login_required
def api_join_room(room_id):
    """加入房间API"""
    room = Room.query.get_or_404(room_id)
    
    if room.is_private:
        return jsonify({'error': '无法加入私有房间'}), 403
    
    try:
        if room.is_member(current_user):
            return jsonify({'message': '您已经是该房间的成员'}), 200
        
        room.add_member(current_user)
        
        return jsonify({
            'message': f'成功加入聊天室 "{room.name}"',
            'room': room.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': '加入房间失败'}), 500

@bp.route('/rooms/<int:room_id>/leave', methods=['POST'])
@login_required
def api_leave_room(room_id):
    """离开房间API"""
    room = Room.query.get_or_404(room_id)
    
    try:
        if not room.is_member(current_user):
            return jsonify({'error': '您不是该房间的成员'}), 400
        
        room.remove_member(current_user)
        
        return jsonify({
            'message': f'已离开聊天室 "{room.name}"'
        }), 200
        
    except Exception as e:
        return jsonify({'error': '离开房间失败'}), 500

@bp.route('/rooms/<int:room_id>/messages', methods=['GET'])
@login_required
def api_get_messages(room_id):
    """获取房间消息API"""
    room = Room.query.get_or_404(room_id)
    
    # 检查权限
    if room.is_private and not room.is_member(current_user):
        return jsonify({'error': '无权限访问此房间'}), 403
    
    try:
        # 获取分页参数
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)  # 限制最大每页数量
        
        # 查询消息
        messages_query = Message.query.filter_by(room_id=room_id, is_deleted=False)\
                                    .order_by(desc(Message.timestamp))
        
        messages = messages_query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        # 获取私聊信息（如果是私聊房间）
        private_chat = None
        if hasattr(room, 'room_type') and room.room_type == 'private':
            private_chat = PrivateChat.query.filter_by(room_id=room_id).first()
        
        # 处理消息列表
        message_list = []
        for msg in reversed(messages.items):
            message_dict = msg.to_dict()
            
            # 解密私聊消息
            if hasattr(msg, 'is_encrypted') and msg.is_encrypted and private_chat:
                decrypted_content = decrypt_private_message(
                    msg.content,
                    private_chat.user1_id,
                    private_chat.user2_id,
                    room_id
                )
                if decrypted_content:
                    message_dict['content'] = decrypted_content
            
            message_list.append(message_dict)
        
        return jsonify({
            'messages': message_list,
            'pagination': {
                'page': messages.page,
                'pages': messages.pages,
                'per_page': messages.per_page,
                'total': messages.total,
                'has_next': messages.has_next,
                'has_prev': messages.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': '获取消息失败'}), 500

@bp.route('/rooms/<int:room_id>/messages', methods=['POST'])
@login_required
def api_send_message(room_id):
    """发送消息API"""
    room = Room.query.get_or_404(room_id)
    
    # 检查权限
    if room.is_private and not room.is_member(current_user):
        return jsonify({'error': '无权限在此房间发送消息'}), 403
    
    data = request.get_json()
    if not data:
        return jsonify({'error': '请提供有效的JSON数据'}), 400
    
    content = data.get('content', '').strip()
    message_type = data.get('message_type', 'text')
    
    if not content:
        return jsonify({'error': '消息内容不能为空'}), 400
    
    if len(content) > 1000:
        return jsonify({'error': '消息内容不能超过1000个字符'}), 400
    
    try:
        # 创建消息
        message = Message(
            content=content,
            message_type=message_type,
            user_id=current_user.id,
            room_id=room_id
        )
        db.session.add(message)
        db.session.commit()
        
        return jsonify({
            'message': '消息发送成功',
            'data': message.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '发送消息失败'}), 500

@bp.route('/messages/<int:message_id>', methods=['PUT'])
@login_required
def api_edit_message(message_id):
    """编辑消息API"""
    message = Message.query.get_or_404(message_id)
    
    # 检查权限（只能编辑自己的消息）
    if message.user_id != current_user.id:
        return jsonify({'error': '无权限编辑此消息'}), 403
    
    data = request.get_json()
    if not data:
        return jsonify({'error': '请提供有效的JSON数据'}), 400
    
    content = data.get('content', '').strip()
    
    if not content:
        return jsonify({'error': '消息内容不能为空'}), 400
    
    if len(content) > 1000:
        return jsonify({'error': '消息内容不能超过1000个字符'}), 400
    
    try:
        from datetime import datetime
        message.content = content
        message.edited_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': '消息编辑成功',
            'data': message.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '编辑消息失败'}), 500

@bp.route('/messages/<int:message_id>', methods=['DELETE'])
@login_required
def api_delete_message(message_id):
    """删除消息API"""
    message = Message.query.get_or_404(message_id)
    
    # 检查权限（只能删除自己的消息）
    if message.user_id != current_user.id:
        return jsonify({'error': '无权限删除此消息'}), 403
    
    try:
        message.is_deleted = True
        db.session.commit()
        
        return jsonify({'message': '消息删除成功'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '删除消息失败'}), 500

@bp.route('/users/online', methods=['GET'])
@login_required
def api_get_online_users():
    """获取在线用户列表API"""
    try:
        online_users = User.query.filter_by(is_online=True).all()
        
        return jsonify({
            'online_users': [user.to_dict() for user in online_users],
            'count': len(online_users)
        }), 200
        
    except Exception as e:
        return jsonify({'error': '获取在线用户失败'}), 500

@bp.route('/rooms/<int:room_id>/members', methods=['GET'])
@login_required
def api_get_room_members(room_id):
    """获取房间成员API"""
    room = Room.query.get_or_404(room_id)
    
    # 检查权限
    if room.is_private and not room.is_member(current_user):
        return jsonify({'error': '无权限访问此房间'}), 403
    
    try:
        members = room.get_members()
        online_members = room.get_online_members()
        
        return jsonify({
            'members': [user.to_dict() for user in members],
            'online_members': [user.to_dict() for user in online_members],
            'member_count': len(members),
            'online_count': len(online_members)
        }), 200
        
    except Exception as e:
        return jsonify({'error': '获取房间成员失败'}), 500