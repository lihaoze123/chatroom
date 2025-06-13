# app/socket_events.py
# Socket.IO事件处理器

from flask_socketio import emit, join_room, leave_room, disconnect
from flask_login import current_user
from app import socketio, db
from app.models import Room, Message, User
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
    message_type = data.get('message_type', 'text')
    file_url = data.get('file_url', '')
    file_name = data.get('file_name', '')
    file_size = data.get('file_size', 0)
    
    if not room_id:
        emit('error', {'message': '房间ID不能为空'})
        return
    
    # 对于文件消息，允许空内容；对于文本消息，需要有内容
    if message_type == 'text' and not content:
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
    
    if len(content) > 1000:
        emit('error', {'message': '消息内容不能超过1000个字符'})
        return
    
    try:
        # 对于文件消息，将文件信息存储为JSON
        if message_type in ['file', 'image'] and file_url:
            import json
            file_info = {
                'url': file_url,
                'name': file_name,
                'size': file_size,
                'description': content  # 用户输入的描述文字
            }
            content = json.dumps(file_info, ensure_ascii=False)
        
        # 创建消息
        message = Message(
            content=content,
            message_type=message_type,
            user_id=current_user.id,
            room_id=room_id
        )
        db.session.add(message)
        db.session.commit()
        
        # 构建消息数据
        message_data = message.to_dict()
        
        # 广播消息到房间内所有用户
        emit('new_message', message_data, room=str(room_id))
        
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

@socketio.on('avatar_updated')
def handle_avatar_updated(data):
    """处理头像更新事件"""
    if not current_user.is_authenticated:
        return
    
    avatar_url = data.get('avatar_url')
    if not avatar_url:
        return
    
    try:
        # 广播头像更新到所有房间
        emit('user_avatar_updated', {
            'user_id': current_user.id,
            'username': current_user.username,
            'avatar_url': avatar_url
        }, broadcast=True)
        
        logger.info(f'用户 {current_user.username} 更新了头像')
        
    except Exception as e:
        logger.error(f'广播头像更新失败: {e}')