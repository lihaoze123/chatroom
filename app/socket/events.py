# app/socket/events.py
# Socket.IO事件处理器

import socketio
import json
import logging
from typing import Dict, Set

from app.database import SessionLocal
from app.models import User, Room, Message, RoomMembership
from app.core.deps import get_user_from_token

# 创建Socket.IO服务器
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True
)

# 全局变量来跟踪每个房间的输入状态
typing_users: Dict[int, Set[str]] = {}

logger = logging.getLogger(__name__)

@sio.event
async def connect(sid, environ, auth):
    """处理客户端连接"""
    try:
        # 从认证信息中获取用户
        token = auth.get('token') if auth else None
        if not token:
            logger.warning(f"连接 {sid} 缺少认证令牌")
            await sio.disconnect(sid)
            return False
        
        # 验证用户
        db = SessionLocal()
        try:
            user = get_user_from_token(token, db)
            if not user:
                logger.warning(f"连接 {sid} 认证失败")
                await sio.disconnect(sid)
                return False
            
            # 更新用户在线状态
            user.is_online = True
            db.commit()
            
            # 保存用户会话信息
            await sio.save_session(sid, {
                'user_id': user.id,
                'username': user.username,
                'token': token
            })
            
            # 广播用户上线状态
            await sio.emit('user_status_update', {
                'user_id': user.id,
                'username': user.username,
                'is_online': True
            })
            
            logger.info(f"用户 {user.username} (ID: {user.id}) 已连接到 Socket.IO")
            return True
            
        finally:
            db.close()
        
    except Exception as e:
        logger.error(f"连接处理错误: {e}")
        await sio.disconnect(sid)
        return False

@sio.event
async def disconnect(sid):
    """处理客户端断开连接"""
    try:
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        username = session.get('username')
        
        if user_id:
            # 更新用户离线状态
            db = SessionLocal()
            try:
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    user.is_online = False
                    db.commit()
                
                # 清理用户的输入状态
                for room_id in list(typing_users.keys()):
                    if username in typing_users[room_id]:
                        typing_users[room_id].discard(username)
                        if not typing_users[room_id]:
                            del typing_users[room_id]
                        else:
                            # 通知房间内其他用户更新输入状态
                            await sio.emit('typing_update', {
                                'room_id': room_id,
                                'typing_users': list(typing_users[room_id])
                            }, room=str(room_id))
                
                # 广播用户离线状态
                await sio.emit('user_status_update', {
                    'user_id': user_id,
                    'username': username,
                    'is_online': False
                })
                
                logger.info(f"用户 {username} (ID: {user_id}) 已断开连接")
                
            finally:
                db.close()
            
    except Exception as e:
        logger.error(f"断开连接处理错误: {e}")

@sio.event
async def join_room(sid, data):
    """处理加入房间"""
    try:
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        room_id = data.get('room_id')
        
        if not user_id or not room_id:
            await sio.emit('error', {'message': '无效的请求参数'}, room=sid)
            return
        
        db = SessionLocal()
        try:
            room = db.query(Room).filter(Room.id == room_id).first()
            user = db.query(User).filter(User.id == user_id).first()
            
            if not room or not user:
                await sio.emit('error', {'message': '房间或用户不存在'}, room=sid)
                return
            
            # 检查权限
            if room.is_private and not room.is_member(user, db):
                await sio.emit('error', {'message': '无权限加入此房间'}, room=sid)
                return
            
            # 加入Socket.IO房间
            await sio.enter_room(sid, str(room_id))
            
            # 获取房间在线成员
            online_members = room.get_online_members(db)
            online_members_data = []
            for member in online_members:
                online_members_data.append({
                    'id': member.id,
                    'username': member.username,
                    'avatar_url': member.avatar_url
                })
            
            # 通知用户成功加入房间
            await sio.emit('room_joined', {
                'room_id': room.id,
                'room_name': room.name,
                'member_count': len(room.get_members(db)),
                'online_members': online_members_data
            }, room=sid)
            
            # 通知房间内其他用户有新用户加入
            await sio.emit('user_joined', {
                'user_id': user_id,
                'username': user.username,
                'room_id': room_id
            }, room=str(room_id), skip_sid=sid)
            
            logger.info(f"用户 {user.username} 加入房间 {room.name}")
            
        finally:
            db.close()
        
    except Exception as e:
        logger.error(f"加入房间错误: {e}")
        await sio.emit('error', {'message': '加入房间失败'}, room=sid)

@sio.event
async def leave_room(sid, data):
    """处理离开房间"""
    try:
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        username = session.get('username')
        room_id = data.get('room_id')
        
        if not user_id or not room_id:
            return
        
        # 离开Socket.IO房间
        await sio.leave_room(sid, str(room_id))
        
        # 通知房间内其他用户有用户离开
        await sio.emit('user_left', {
            'user_id': user_id,
            'username': username,
            'room_id': room_id
        }, room=str(room_id), skip_sid=sid)
        
        logger.info(f"用户 {username} 离开房间 {room_id}")
        
    except Exception as e:
        logger.error(f"离开房间错误: {e}")

@sio.event
async def send_message(sid, data):
    """处理发送消息"""
    try:
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        room_id = data.get('room_id')
        content = data.get('content', '').strip()
        message_type = data.get('message_type', 'text')
        file_url = data.get('file_url', '')
        file_name = data.get('file_name', '')
        file_size = data.get('file_size', 0)
        
        if not user_id or not room_id:
            await sio.emit('error', {'message': '无效的请求参数'}, room=sid)
            return
        
        # 对于文本消息，检查内容是否为空
        if message_type == 'text' and not content:
            await sio.emit('error', {'message': '消息内容不能为空'}, room=sid)
            return
        
        db = SessionLocal()
        try:
            room = db.query(Room).filter(Room.id == room_id).first()
            user = db.query(User).filter(User.id == user_id).first()
            
            if not room or not user:
                await sio.emit('error', {'message': '房间或用户不存在'}, room=sid)
                return
            
            # 检查权限
            if room.is_private and not room.is_member(user, db):
                await sio.emit('error', {'message': '无权限在此房间发送消息'}, room=sid)
                return
            
            # 检查消息长度
            if len(content) > 1000:
                await sio.emit('error', {'message': '消息内容不能超过1000个字符'}, room=sid)
                return
            
            # 处理文件消息
            if message_type in ['file', 'image'] and file_url:
                file_info = {
                    'url': file_url,
                    'name': file_name,
                    'size': file_size,
                    'description': content
                }
                content = json.dumps(file_info, ensure_ascii=False)
            
            # 创建消息
            message = Message(
                content=content,
                message_type=message_type,
                user_id=user_id,
                room_id=room_id
            )
            db.add(message)
            db.commit()
            db.refresh(message)
            
            # 构建消息数据
            message_data = message.to_dict()
            
            # 广播消息到房间内所有用户
            await sio.emit('new_message', message_data, room=str(room_id))
            
            logger.info(f"用户 {user.username} 在房间 {room.name} 发送消息")
            
        finally:
            db.close()
        
    except Exception as e:
        logger.error(f"发送消息错误: {e}")
        await sio.emit('error', {'message': '发送消息失败'}, room=sid)

@sio.event
async def typing_start(sid, data):
    """处理开始输入"""
    try:
        session = await sio.get_session(sid)
        username = session.get('username')
        room_id = data.get('room_id')
        
        if not username or not room_id:
            return
        
        # 添加到输入状态
        if room_id not in typing_users:
            typing_users[room_id] = set()
        typing_users[room_id].add(username)
        
        # 通知房间内其他用户
        await sio.emit('typing_update', {
            'room_id': room_id,
            'typing_users': list(typing_users[room_id])
        }, room=str(room_id), skip_sid=sid)
        
    except Exception as e:
        logger.error(f"开始输入处理错误: {e}")

@sio.event
async def typing_stop(sid, data):
    """处理停止输入"""
    try:
        session = await sio.get_session(sid)
        username = session.get('username')
        room_id = data.get('room_id')
        
        if not username or not room_id:
            return
        
        # 从输入状态中移除
        if room_id in typing_users:
            typing_users[room_id].discard(username)
            if not typing_users[room_id]:
                del typing_users[room_id]
        
        # 通知房间内其他用户
        remaining_users = list(typing_users.get(room_id, []))
        await sio.emit('typing_update', {
            'room_id': room_id,
            'typing_users': remaining_users
        }, room=str(room_id), skip_sid=sid)
        
    except Exception as e:
        logger.error(f"停止输入处理错误: {e}")

@sio.event
async def get_online_users(sid, data):
    """获取在线用户列表"""
    try:
        room_id = data.get('room_id')
        if not room_id:
            return
        
        db = SessionLocal()
        try:
            room = db.query(Room).filter(Room.id == room_id).first()
            if not room:
                return
            
            online_members = room.get_online_members(db)
            online_users_data = []
            for member in online_members:
                online_users_data.append({
                    'id': member.id,
                    'username': member.username,
                    'avatar_url': member.avatar_url
                })
            
            await sio.emit('online_users_update', {
                'room_id': room_id,
                'online_users': online_users_data
            }, room=sid)
            
        finally:
            db.close()
        
    except Exception as e:
        logger.error(f"获取在线用户错误: {e}")

@sio.event
async def ping(sid):
    """处理心跳包"""
    await sio.emit('pong', room=sid)

@sio.event
async def avatar_updated(sid, data):
    """处理头像更新通知"""
    try:
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        username = session.get('username')
        avatar_url = data.get('avatar_url')
        
        if user_id and avatar_url:
            # 广播头像更新
            await sio.emit('user_avatar_updated', {
                'user_id': user_id,
                'username': username,
                'avatar_url': avatar_url
            })
            
    except Exception as e:
        logger.error(f"头像更新通知错误: {e}") 