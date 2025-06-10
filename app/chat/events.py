from flask import current_app
from flask_login import current_user
from flask_socketio import emit, join_room, leave_room
from .. import socketio, db
from ..models import ChatRoom, Message, User
from datetime import datetime

# 存储在线用户信息
online_users = {}
# 存储正在输入的用户信息
typing_users = {}

@socketio.on('connect')
def handle_connect():
    if not current_user.is_authenticated:
        return False
    
    # 记录用户上线状态
    user_id = str(current_user.id)
    online_users[user_id] = {
        'username': current_user.username,
        'rooms': []
    }
    
    # 广播用户上线消息
    emit('user_connected', {
        'user_id': user_id,
        'username': current_user.username
    }, broadcast=True)

@socketio.on('disconnect')
def handle_disconnect():
    if not current_user.is_authenticated:
        return
    
    user_id = str(current_user.id)
    
    # 从所有房间中移除用户
    if user_id in online_users:
        for room_id in online_users[user_id]['rooms']:
            leave_room(room_id)
            emit('user_left', {
                'user_id': user_id,
                'username': current_user.username,
                'room_id': room_id
            }, room=room_id)
        
        # 清理用户状态
        del online_users[user_id]
        if user_id in typing_users:
            del typing_users[user_id]
    
    # 广播用户下线消息
    emit('user_disconnected', {
        'user_id': user_id,
        'username': current_user.username
    }, broadcast=True)

@socketio.on('join_room')
def handle_join_room(data):
    if not current_user.is_authenticated:
        return
    
    room_id = str(data['room_id'])
    user_id = str(current_user.id)
    
    # 加入房间
    join_room(room_id)
    if user_id in online_users:
        if room_id not in online_users[user_id]['rooms']:
            online_users[user_id]['rooms'].append(room_id)
    
    # 广播用户加入消息
    emit('user_joined', {
        'user_id': user_id,
        'username': current_user.username,
        'room_id': room_id
    }, room=room_id)

@socketio.on('leave_room')
def handle_leave_room(data):
    if not current_user.is_authenticated:
        return
    
    room_id = str(data['room_id'])
    user_id = str(current_user.id)
    
    # 离开房间
    leave_room(room_id)
    if user_id in online_users:
        if room_id in online_users[user_id]['rooms']:
            online_users[user_id]['rooms'].remove(room_id)
    
    # 广播用户离开消息
    emit('user_left', {
        'user_id': user_id,
        'username': current_user.username,
        'room_id': room_id
    }, room=room_id)

@socketio.on('send_message')
def handle_send_message(data):
    if not current_user.is_authenticated:
        return
    
    room_id = str(data['room_id'])
    message_content = data['message']
    
    # 创建新消息
    new_message = Message(
        content=message_content,
        sender_id=current_user.id,
        room_id=room_id,
        created_at=datetime.utcnow()
    )
    db.session.add(new_message)
    db.session.commit()
    
    # 广播消息
    emit('new_message', {
        'message_id': new_message.id,
        'content': message_content,
        'sender_id': str(current_user.id),
        'sender_name': current_user.username,
        'room_id': room_id,
        'created_at': new_message.created_at.isoformat()
    }, room=room_id)

@socketio.on('typing')
def handle_typing(data):
    if not current_user.is_authenticated:
        return
    
    room_id = str(data['room_id'])
    is_typing = data['typing']
    user_id = str(current_user.id)
    
    if is_typing:
        # 记录正在输入状态
        if user_id not in typing_users:
            typing_users[user_id] = set()
        typing_users[user_id].add(room_id)
    else:
        # 清除输入状态
        if user_id in typing_users and room_id in typing_users[user_id]:
            typing_users[user_id].remove(room_id)
    
    # 广播输入状态
    emit('user_typing', {
        'user_id': user_id,
        'username': current_user.username,
        'room_id': room_id,
        'is_typing': is_typing
    }, room=room_id)