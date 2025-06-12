# app/socket_events.py
# Socket.IO事件处理器

from flask_socketio import emit, join_room, leave_room, disconnect
from flask_login import current_user
from app import socketio, db
from app.models import Room, Message, User, PrivateChat
from app.crypto_utils import encrypt_private_message, decrypt_private_message, validate_message_integrity, sanitize_message
import logging

logger = logging.getLogger(__name__)

# 全局变量来跟踪每个房间的输入状态
typing_users = {}  # {room_id: set(username)}

@socketio.on('connect')
def handle_connect():
    """处理客户端连接"""
    if current_user.is_authenticated:
        logger.info(f'用户 {current_user.username} 已连接 Socket.IO')
        emit('user_status_update', {
            'user_id': current_user.id,
            'username': current_user.username,
            'is_online': True
        }, broadcast=True)
    else:
        logger.warning('未认证用户尝试连接 Socket.IO')
        disconnect()

@socketio.on('disconnect')
def handle_disconnect():
    """处理客户端断开连接"""
    if current_user.is_authenticated:
        logger.info(f'用户 {current_user.username} 已断开 Socket.IO 连接')
        
        # 清理用户的输入状态
        for room_id in list(typing_users.keys()):
            if current_user.username in typing_users[room_id]:
                typing_users[room_id].discard(current_user.username)
                if not typing_users[room_id]:
                    del typing_users[room_id]
                else:
                    # 通知房间内其他用户更新输入状态
                    other_typing_users = [username for username in typing_users[room_id] if username != current_user.username]
                    emit('typing_update', {
                        'room_id': room_id,
                        'typing_users': other_typing_users
                    }, room=str(room_id))
        
        emit('user_status_update', {
            'user_id': current_user.id,
            'username': current_user.username,
            'is_online': False
        }, broadcast=True)

@socketio.on('join_room')
def handle_join_room(data):
    """处理加入房间"""
    if not current_user.is_authenticated:
        emit('error', {'message': '未认证用户无法加入房间'})
        return
    
    room_id = data.get('room_id')
    if not room_id:
        emit('error', {'message': '房间ID不能为空'})
        return
    
    room = Room.query.get(room_id)
    if not room:
        emit('error', {'message': '房间不存在'})
        return
    
    # 检查权限
    if room.is_private and not room.is_member(current_user):
        emit('error', {'message': '无权限加入此房间'})
        return
    
    # 加入Socket.IO房间
    join_room(str(room_id))
    
    # 获取房间在线成员
    online_members = []
    for member in room.get_online_members():
        online_members.append({
            'id': member.id,
            'username': member.username,
            'avatar_url': member.avatar_url
        })
    
    # 通知用户成功加入房间
    emit('room_joined', {
        'room_id': room.id,
        'room_name': room.name,
        'member_count': len(room.get_members()),
        'online_members': online_members
    })
    
    # 通知房间内其他用户有新用户加入
    emit('user_joined', {
        'user_id': str(current_user.id),
        'username': current_user.username,
        'room_id': str(room_id)
    }, room=str(room_id), include_self=False)
    
    logger.info(f'用户 {current_user.username} 加入房间 {room.name}')

@socketio.on('leave_room')
def handle_leave_room(data):
    """处理离开房间"""
    if not current_user.is_authenticated:
        return
    
    room_id = data.get('room_id')
    if not room_id:
        return
    
    room = Room.query.get(room_id)
    if not room:
        return
    
    # 离开Socket.IO房间
    leave_room(str(room_id))
    
    # 通知房间内其他用户有用户离开
    emit('user_left', {
        'user_id': str(current_user.id),
        'username': current_user.username,
        'room_id': str(room_id)
    }, room=str(room_id), include_self=False)
    
    logger.info(f'用户 {current_user.username} 离开房间 {room.name}')

@socketio.on('send_message')
def handle_send_message(data):
    """处理发送消息"""
    if not current_user.is_authenticated:
        emit('error', {'message': '未认证用户无法发送消息'})
        return
    
    room_id = data.get('room_id')
    content = data.get('content', '').strip()
    
    if not room_id or not content:
        emit('error', {'message': '房间ID和消息内容不能为空'})
        return
    
    room = Room.query.get(room_id)
    if not room:
        emit('error', {'message': '房间不存在'})
        return
    
    # 检查权限
    if room.is_private and not room.is_member(current_user):
        emit('error', {'message': '无权限在此房间发送消息'})
        return
    
    if len(content) > 1000:
        emit('error', {'message': '消息内容不能超过1000个字符'})
        return
    
    try:
        # 验证和清理消息内容
        if not validate_message_integrity(content):
            emit('error', {'message': '消息格式无效'})
            return
        
        sanitized_content = sanitize_message(content)
        
        # 处理消息加密（仅私聊）
        stored_content = sanitized_content
        is_encrypted = False
        
        if room.room_type == 'private':
            private_chat = PrivateChat.query.filter_by(room_id=room_id).first()
            if private_chat:
                # 加密私聊消息
                encrypted_content = encrypt_private_message(
                    sanitized_content, 
                    private_chat.user1_id, 
                    private_chat.user2_id, 
                    room_id
                )
                if encrypted_content:
                    stored_content = encrypted_content
                    is_encrypted = True
        
        # 创建消息
        message = Message(
            content=stored_content,
            message_type='text',
            user_id=current_user.id,
            room_id=room_id,
            is_encrypted=is_encrypted
        )
        db.session.add(message)
        
        # 如果是私聊房间，更新最后消息时间
        if room.room_type == 'private':
            private_chat = PrivateChat.query.filter_by(room_id=room_id).first()
            if private_chat:
                private_chat.last_message_at = message.timestamp
        
        db.session.commit()
        
        # 准备广播消息数据
        broadcast_content = sanitized_content  # 广播时使用原始内容
        
        # 如果是加密消息，需要为每个接收者解密
        if is_encrypted and room.room_type == 'private':
            private_chat = PrivateChat.query.filter_by(room_id=room_id).first()
            if private_chat:
                # 解密消息用于广播
                decrypted_content = decrypt_private_message(
                    stored_content,
                    private_chat.user1_id,
                    private_chat.user2_id,
                    room_id
                )
                if decrypted_content:
                    broadcast_content = decrypted_content
        
        # 构建消息数据
        message_data = message.to_dict()
        message_data['content'] = broadcast_content
        message_data['is_encrypted'] = is_encrypted
        
        # 广播消息到房间内所有用户
        emit('new_message', message_data, room=str(room_id))
        
        # 如果是私聊，发送特殊的私聊消息通知
        if room.room_type == 'private':
            private_chat = PrivateChat.query.filter_by(room_id=room_id).first()
            if private_chat:
                other_user = private_chat.get_other_user(current_user.id)
                if other_user:
                    emit('private_message_notification', {
                        'message': message_data,
                        'from_user': current_user.to_dict(),
                        'private_chat_id': private_chat.id
                    }, room=str(room_id))
        
        logger.info(f'用户 {current_user.username} 在房间 {room.name} 发送消息: {content[:50]}...')
        
    except Exception as e:
        db.session.rollback()
        logger.error(f'发送消息失败: {e}')
        emit('error', {'message': '发送消息失败'})

@socketio.on('typing_start')
def handle_typing_start(data):
    """处理开始输入"""
    if not current_user.is_authenticated:
        return
    
    room_id = data.get('room_id')
    if not room_id:
        return
    
    # 添加用户到输入列表
    if room_id not in typing_users:
        typing_users[room_id] = set()
    typing_users[room_id].add(current_user.username)
    
    # 发送更新的输入用户列表（排除当前用户）
    other_typing_users = [username for username in typing_users[room_id] if username != current_user.username]
    emit('typing_update', {
        'room_id': room_id,
        'typing_users': other_typing_users
    }, room=str(room_id))

@socketio.on('typing_stop')
def handle_typing_stop(data):
    """处理停止输入"""
    if not current_user.is_authenticated:
        return
    
    room_id = data.get('room_id')
    if not room_id:
        return
    
    # 从输入列表中移除用户
    if room_id in typing_users:
        typing_users[room_id].discard(current_user.username)
        if not typing_users[room_id]:  # 如果集合为空，删除该房间的记录
            del typing_users[room_id]
    
    # 发送更新的输入用户列表（排除当前用户）
    other_typing_users = []
    if room_id in typing_users:
        other_typing_users = [username for username in typing_users[room_id] if username != current_user.username]
    
    emit('typing_update', {
        'room_id': room_id,
        'typing_users': other_typing_users
    }, room=str(room_id))

@socketio.on('get_online_users')
def handle_get_online_users(data):
    """获取在线用户"""
    if not current_user.is_authenticated:
        return
    
    room_id = data.get('room_id')
    if room_id:
        room = Room.query.get(room_id)
        if room:
            online_users = []
            for member in room.get_online_members():
                online_users.append({
                    'id': member.id,
                    'username': member.username,
                    'avatar_url': member.avatar_url
                })
            
            emit('online_users_update', {
                'room_id': room_id,
                'online_users': online_users
            })

@socketio.on('ping')
def handle_ping():
    """处理心跳检测"""
    emit('pong')