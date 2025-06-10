# app/chat/routes.py
# 聊天路由

from flask import render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_required, current_user
from app import db
from app.chat import bp
from app.models import Room, Message, RoomMembership, User

@bp.route('/rooms')
@login_required
def rooms():
    """聊天室列表"""
    # 获取用户加入的房间
    user_rooms = Room.query.join(RoomMembership).filter(
        RoomMembership.user_id == current_user.id
    ).all()
    
    # 获取公共房间
    public_rooms = Room.query.filter_by(is_private=False).all()
    
    return render_template('chat/rooms.html', 
                         title='聊天室',
                         user_rooms=user_rooms,
                         public_rooms=public_rooms)

@bp.route('/room/<int:room_id>')
@login_required
def room(room_id):
    """聊天室页面"""
    room = Room.query.get_or_404(room_id)
    
    # 检查用户是否有权限访问房间
    if room.is_private and not room.is_member(current_user):
        flash('您没有权限访问此房间', 'error')
        return redirect(url_for('chat.rooms'))
    
    # 如果是公共房间且用户未加入，自动加入
    if not room.is_private and not room.is_member(current_user):
        room.add_member(current_user)
    
    # 获取房间最近的消息
    messages = Message.query.filter_by(room_id=room_id, is_deleted=False)\
                          .order_by(Message.timestamp.desc())\
                          .limit(50).all()
    messages.reverse()  # 按时间正序显示
    
    # 获取房间成员
    members = room.get_members()
    online_members = room.get_online_members()
    
    return render_template('chat/room.html',
                         title=f'聊天室 - {room.name}',
                         room=room,
                         messages=messages,
                         members=members,
                         online_members=online_members)

@bp.route('/create-room', methods=['GET', 'POST'])
@login_required
def create_room():
    """创建聊天室"""
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        description = request.form.get('description', '').strip()
        is_private = request.form.get('is_private') == 'on'
        
        if not name:
            flash('房间名称不能为空', 'error')
            return render_template('chat/create_room.html')
        
        # 检查房间名是否已存在
        if Room.query.filter_by(name=name).first():
            flash('房间名称已存在，请选择其他名称', 'error')
            return render_template('chat/create_room.html', name=name, description=description)
        
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
        
        flash(f'聊天室 "{name}" 创建成功！', 'success')
        return redirect(url_for('chat.room', room_id=room.id))
    
    return render_template('chat/create_room.html', title='创建聊天室')

@bp.route('/join-room/<int:room_id>')
@login_required
def join_room(room_id):
    """加入聊天室"""
    room = Room.query.get_or_404(room_id)
    
    if room.is_private:
        flash('无法加入私有房间', 'error')
        return redirect(url_for('chat.rooms'))
    
    if room.is_member(current_user):
        flash('您已经是该房间的成员', 'info')
    else:
        room.add_member(current_user)
        flash(f'成功加入聊天室 "{room.name}"', 'success')
    
    return redirect(url_for('chat.room', room_id=room_id))

@bp.route('/leave-room/<int:room_id>')
@login_required
def leave_room(room_id):
    """离开聊天室"""
    room = Room.query.get_or_404(room_id)
    
    if not room.is_member(current_user):
        flash('您不是该房间的成员', 'error')
        return redirect(url_for('chat.rooms'))
    
    room.remove_member(current_user)
    flash(f'已离开聊天室 "{room.name}"', 'info')
    return redirect(url_for('chat.rooms'))

@bp.route('/api/messages/<int:room_id>')
@login_required
def get_messages(room_id):
    """获取房间消息（API）"""
    room = Room.query.get_or_404(room_id)
    
    # 检查权限
    if room.is_private and not room.is_member(current_user):
        return jsonify({'error': '无权限访问'}), 403
    
    # 获取分页参数
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # 查询消息
    messages = Message.query.filter_by(room_id=room_id, is_deleted=False)\
                          .order_by(Message.timestamp.desc())\
                          .paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'messages': [msg.to_dict() for msg in reversed(messages.items)],
        'has_more': messages.has_next,
        'total': messages.total
    })

@bp.route('/api/rooms')
@login_required
def get_rooms():
    """获取房间列表（API）"""
    # 获取用户加入的房间
    user_rooms = Room.query.join(RoomMembership).filter(
        RoomMembership.user_id == current_user.id
    ).all()
    
    # 获取公共房间
    public_rooms = Room.query.filter_by(is_private=False).all()
    
    return jsonify({
        'user_rooms': [room.to_dict() for room in user_rooms],
        'public_rooms': [room.to_dict() for room in public_rooms]
    }) 