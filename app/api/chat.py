# app/api/chat.py
# 聊天API

from flask import request, jsonify
from flask_login import login_required, current_user
from sqlalchemy import desc
from app import db
from app.api import bp
from app.models import Room, Message, RoomMembership, User

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
        
        # 获取所有房间（包括公共房间和私密房间）
        all_rooms = Room.query.all()
        
        # 分类房间
        user_room_ids = {room.id for room in user_rooms}
        available_rooms = []
        
        for room in all_rooms:
            if room.id not in user_room_ids:
                available_rooms.append(room)
        
        current_app.logger.debug(f'房间列表获取成功 - 用户房间数: {len(user_rooms)}, 可用房间数: {len(available_rooms)}, 用户ID: {current_user.id}')
        
        return jsonify({
            'user_rooms': [room.to_dict() for room in user_rooms],
            'available_rooms': [room.to_dict() for room in available_rooms]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'获取房间列表失败 - 用户ID: {current_user.id}, IP: {client_ip}, 错误: {str(e)}')
        return jsonify({'error': '获取房间列表失败'}), 500

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
    #新加
    password = data.get('password', '').strip()
    
    # 验证房间名称
    if not name:
        return jsonify({'error': '房间名称不能为空'}), 400
    
    if len(name) < 2 or len(name) > 50:
        return jsonify({'error': '房间名称长度必须在2-50个字符之间'}), 400
    
    #新加
    if is_private and not password:
        return jsonify({'error': '私密房间必须设置密码'}), 400


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

        #新加
        if is_private:
            room.set_password(password)

        db.session.add(room)
        db.session.flush()  # 获取room.id
        
        # 创建者自动加入房间
        from app.models import RoomMembership
        membership = RoomMembership(user_id=current_user.id, room_id=room.id)
        db.session.add(membership)
        db.session.commit()
        
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
    
    print(f"[DEBUG] getRoom: 用户 {current_user.username} 获取房间 {room.name} (ID: {room_id})")
    print(f"[DEBUG] getRoom: 房间是否私密: {room.is_private}")
    
    # 直接查询数据库检查成员关系，避免缓存问题
    from app.models import RoomMembership
    membership = RoomMembership.query.filter_by(user_id=current_user.id, room_id=room_id).first()
    is_member = membership is not None
    print(f"[DEBUG] getRoom: 数据库查询成员关系: {membership}")
    print(f"[DEBUG] getRoom: 用户是否为成员: {is_member}")
    
    # 检查权限
    if room.is_private and not is_member:
        print(f"[DEBUG] getRoom: 私密房间权限检查失败，返回403")
        return jsonify({'error': '无权限访问此房间'}), 403
    
    try:
        # 如果是公共房间且用户未加入，自动加入
        if not room.is_private and not is_member:
            print(f"[DEBUG] getRoom: 公共房间自动加入")
            membership = RoomMembership(user_id=current_user.id, room_id=room_id)
            db.session.add(membership)
            db.session.commit()
        
        # 获取房间成员
        members = room.get_members()
        online_members = room.get_online_members()
        
        room_data = room.to_dict()
        room_data.update({
            'members': [user.to_dict() for user in members],
            'online_members': [user.to_dict() for user in online_members],
            'is_member': is_member or not room.is_private  # 如果是公共房间或已是成员
        })
        
        print(f"[DEBUG] getRoom: 成功返回房间数据")
        return jsonify({'room': room_data}), 200
        
    except Exception as e:
        print(f"[DEBUG] getRoom: 异常发生: {e}")
        db.session.rollback()
        return jsonify({'error': '获取房间信息失败'}), 500

@bp.route('/rooms/<int:room_id>/join', methods=['POST'])
@login_required
def api_join_room(room_id):
    """加入房间API（支持私密房间密码验证）"""
    room = Room.query.get_or_404(room_id)
    
    print(f"[DEBUG] 用户 {current_user.username} 尝试加入房间 {room.name} (ID: {room_id})")
    print(f"[DEBUG] 房间是否私密: {room.is_private}")
    print(f"[DEBUG] 用户是否已是成员: {room.is_member(current_user)}")
    
    try:
        if room.is_member(current_user):
            print(f"[DEBUG] 用户已经是成员，返回200")
            return jsonify({'message': '您已经是该房间的成员'}), 200

        if room.is_private:
            data = request.get_json()
            password = data.get('password', '').strip() if data else ''
            print(f"[DEBUG] 私密房间，收到密码: {'***' if password else '(空)'}")
            
            password_valid = room.check_password(password)
            print(f"[DEBUG] 密码验证结果: {password_valid}")
            
            if not password_valid:
                print(f"[DEBUG] 密码错误，返回403")
                return jsonify({'error': '密码错误，无法加入私密房间'}), 403

        # 添加成员关系
        print(f"[DEBUG] 开始添加成员关系")
        from app.models import RoomMembership
        membership = RoomMembership(user_id=current_user.id, room_id=room_id)
        db.session.add(membership)
        db.session.commit()
        print(f"[DEBUG] 成员关系添加成功")

        # 验证成员关系
        is_member_after = room.is_member(current_user)
        print(f"[DEBUG] 添加后是否为成员: {is_member_after}")

        return jsonify({
            'message': f'成功加入聊天室 "{room.name}"',
            'room': room.to_dict()
        }), 200

    except Exception as e:
        print(f"[DEBUG] 异常发生: {e}")
        db.session.rollback()
        return jsonify({'error': '加入房间失败'}), 500


@bp.route('/rooms/<int:room_id>/leave', methods=['POST'])
@login_required
def api_leave_room(room_id):
    """离开房间API"""
    room = Room.query.get_or_404(room_id)
    
    try:
        if not room.is_member(current_user):
            return jsonify({'error': '您不是该房间的成员'}), 400
        
        # 移除成员关系
        from app.models import RoomMembership
        membership = RoomMembership.query.filter_by(user_id=current_user.id, room_id=room_id).first()
        if membership:
            db.session.delete(membership)
            db.session.commit()
        
        return jsonify({
            'message': f'已离开聊天室 "{room.name}"'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '离开房间失败'}), 500

@bp.route('/rooms/<int:room_id>/messages', methods=['GET'])
@login_required
def api_get_messages(room_id):
    """获取房间消息API"""
    room = Room.query.get_or_404(room_id)
    
    print(f"[DEBUG] getMessages: 用户 {current_user.username} 获取房间 {room.name} 消息")
    
    # 直接查询数据库检查成员关系
    from app.models import RoomMembership
    membership = RoomMembership.query.filter_by(user_id=current_user.id, room_id=room_id).first()
    is_member = membership is not None
    print(f"[DEBUG] getMessages: 用户是否为成员: {is_member}")
    
    # 检查权限
    if room.is_private and not is_member:
        print(f"[DEBUG] getMessages: 私密房间权限检查失败，返回403")
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
        
        print(f"[DEBUG] getMessages: 成功返回 {len(messages.items)} 条消息")
        return jsonify({
            'messages': [msg.to_dict() for msg in reversed(messages.items)],
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
        print(f"[DEBUG] getMessages: 异常发生: {e}")
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
    file_url = data.get('file_url', '')
    file_name = data.get('file_name', '')
    file_size = data.get('file_size', 0)
    
    # 验证消息内容
    if message_type == 'text':
        if not content:
            return jsonify({'error': '消息内容不能为空'}), 400
        if len(content) > 1000:
            return jsonify({'error': '消息内容不能超过1000个字符'}), 400
    elif message_type in ['image', 'file']:
        if not file_url:
            return jsonify({'error': '文件URL不能为空'}), 400
        # 对于文件消息，content 可以是文件描述或为空
    
    try:
        # 创建消息
        message = Message(
            content=content,
            message_type=message_type,
            user_id=current_user.id,
            room_id=room_id
        )
        
        # 如果是文件消息，将文件信息存储在content中（JSON格式）
        if message_type in ['image', 'file']:
            import json
            file_info = {
                'file_url': file_url,
                'file_name': file_name,
                'file_size': file_size,
                'description': content  # 用户输入的描述
            }
            message.content = json.dumps(file_info, ensure_ascii=False)
        
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