# app/chat/events.py
# Socket.IO 事件处理

from flask import request
from flask_login import current_user
from flask_socketio import emit, join_room, leave_room, disconnect
from app import socketio, db
from app.models import Room, Message, User
from datetime import datetime

# 存储用户的在线状态和正在输入状态
online_users = {}
typing_users = {}

@socketio.on('connect')
def on_connect():
    """用户连接事件"""
    if current_user.is_authenticated:
        # 更新用户在线状态
        current_user.set_online_status(True)
        online_users[current_user.id] = request.sid
        
        print(f'用户 {current_user.username} 已连接 (SID: {request.sid})')
        
        # 通知其他用户该用户上线
        emit('user_status_update', {
            'user_id': current_user.id,
            'username': current_user.username,
            'is_online': True
        }, broadcast=True)
    else:
        disconnect()

@socketio.on('disconnect')
def on_disconnect():
    """用户断开连接事件"""
    if current_user.is_authenticated:
        # 更新用户离线状态
        current_user.set_online_status(False)
        
        # 从在线用户列表中移除
        if current_user.id in online_users:
            del online_users[current_user.id]
        
        # 清除正在输入状态
        if current_user.id in typing_users:
            room_id = typing_users[current_user.id]
            del typing_users[current_user.id]
            emit('typing_update', {
                'room_id': room_id,
                'typing_users': [User.query.get(u).username for u, r in typing_users.items() if r == room_id and u != current_user.id]
            }, room=f'room_{room_id}')
        
        print(f'用户 {current_user.username} 已断开连接')
        
        # 通知其他用户该用户下线
        emit('user_status_update', {
            'user_id': current_user.id,
            'username': current_user.username,
            'is_online': False
        }, broadcast=True)

@socketio.on('join_room')
def on_join_room(data):
    """加入房间事件"""
    if not current_user.is_authenticated:
        return
    
    room_id = data.get('room_id')
    if not room_id:
        return
    
    room = Room.query.get(room_id)
    if not room:
        emit('error', {'message': '房间不存在'})
        return
    
    # 检查权限
    if room.is_private and not room.is_member(current_user):
        emit('error', {'message': '无权限访问此房间'})
        return
    
    # 如果是公共房间且用户未加入，自动加入
    if not room.is_private and not room.is_member(current_user):
        room.add_member(current_user)
    
    # 加入Socket.IO房间
    join_room(f'room_{room_id}')
    
    # 通知房间内其他用户
    emit('user_joined', {
        'user_id': current_user.id,
        'username': current_user.username,
        'room_id': room_id,
        'message': f'{current_user.username} 加入了房间'
    }, room=f'room_{room_id}', include_self=False)
    
    # 发送房间信息给用户
    emit('room_joined', {
        'room_id': room_id,
        'room_name': room.name,
        'member_count': room.memberships.count(),
        'online_members': [user.to_dict() for user in room.get_online_members()]
    })
    
    print(f'用户 {current_user.username} 加入房间 {room.name}')

@socketio.on('leave_room')
def on_leave_room(data):
    """离开房间事件"""
    if not current_user.is_authenticated:
        return
    
    room_id = data.get('room_id')
    if not room_id:
        return
    
    room = Room.query.get(room_id)
    if not room:
        return
    
    # 离开Socket.IO房间
    leave_room(f'room_{room_id}')
    
    # 清除该房间的正在输入状态
    if current_user.id in typing_users and typing_users[current_user.id] == room_id:
        del typing_users[current_user.id]
        emit('typing_update', {
            'room_id': room_id,
            'typing_users': [User.query.get(u).username for u, r in typing_users.items() if r == room_id and u != current_user.id]
        }, room=f'room_{room_id}')
    
    # 通知房间内其他用户
    emit('user_left', {
        'user_id': current_user.id,
        'username': current_user.username,
        'room_id': room_id,
        'message': f'{current_user.username} 离开了房间'
    }, room=f'room_{room_id}')
    
    print(f'用户 {current_user.username} 离开房间 {room.name}')

@socketio.on('send_message')
def on_send_message(data):
    """发送消息事件"""
    if not current_user.is_authenticated:
        return
    
    room_id = data.get('room_id')
    content = data.get('content', '').strip()
    message_type = data.get('message_type', 'text')
    
    if not room_id or not content:
        emit('error', {'message': '消息内容不能为空'})
        return
    
    room = Room.query.get(room_id)
    if not room:
        emit('error', {'message': '房间不存在'})
        return
    
    # 检查权限
    if room.is_private and not room.is_member(current_user):
        emit('error', {'message': '无权限在此房间发送消息'})
        return
    
    # 创建消息
    message = Message(
        content=content,
        message_type=message_type,
        user_id=current_user.id,
        room_id=room_id
    )
    db.session.add(message)
    db.session.commit()
    
    # 清除发送者的正在输入状态
    if current_user.id in typing_users and typing_users[current_user.id] == room_id:
        del typing_users[current_user.id]
    
    # 广播消息到房间
    message_data = message.to_dict()
    emit('new_message', message_data, room=f'room_{room_id}')
    
    # 更新正在输入状态
    emit('typing_update', {
        'room_id': room_id,
        'typing_users': [User.query.get(u).username for u, r in typing_users.items() if r == room_id and u != current_user.id]
    }, room=f'room_{room_id}')
    
    print(f'用户 {current_user.username} 在房间 {room.name} 发送消息: {content[:50]}...')

@socketio.on('typing_start')
def on_typing_start(data):
    """开始输入事件"""
    if not current_user.is_authenticated:
        return
    
    room_id = data.get('room_id')
    if not room_id:
        return
    
    room = Room.query.get(room_id)
    if not room or (room.is_private and not room.is_member(current_user)):
        return
    
    # 记录正在输入状态
    typing_users[current_user.id] = room_id
    
    # 通知房间内其他用户
    emit('typing_update', {
        'room_id': room_id,
        'typing_users': [User.query.get(u).username for u, r in typing_users.items() if r == room_id and u != current_user.id]
    }, room=f'room_{room_id}')

@socketio.on('typing_stop')
def on_typing_stop(data):
    """停止输入事件"""
    if not current_user.is_authenticated:
        return
    
    room_id = data.get('room_id')
    if not room_id:
        return
    
    # 清除正在输入状态
    if current_user.id in typing_users and typing_users[current_user.id] == room_id:
        del typing_users[current_user.id]
        
        # 通知房间内其他用户
        emit('typing_update', {
            'room_id': room_id,
            'typing_users': [User.query.get(u).username for u, r in typing_users.items() if r == room_id and u != current_user.id]
        }, room=f'room_{room_id}')

@socketio.on('get_online_users')
def on_get_online_users(data):
    """获取在线用户列表"""
    if not current_user.is_authenticated:
        return
    
    room_id = data.get('room_id')
    if room_id:
        room = Room.query.get(room_id)
        if room:
            online_members = room.get_online_members()
            emit('online_users_update', {
                'room_id': room_id,
                'online_users': [user.to_dict() for user in online_members]
            })
    else:
        # 获取所有在线用户
        online_user_list = User.query.filter(User.id.in_(online_users.keys())).all()
        emit('online_users_update', {
            'online_users': [user.to_dict() for user in online_user_list]
        })

@socketio.on('ping')
def on_ping():
    """心跳检测"""
    if current_user.is_authenticated:
        current_user.update_last_seen()
        emit('pong') 