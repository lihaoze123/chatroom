from flask import render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from app.chat import bp
from app.models import ChatRoom, User
from app import db
from datetime import datetime
from app.chat.forms import CreateRoomForm

@bp.route('/')
@login_required
def index():
    rooms = ChatRoom.query.all()
    return render_template('chat/index.html', rooms=rooms)

@bp.route('/room/<int:room_id>')
@login_required
def room(room_id):
    room = ChatRoom.query.get_or_404(room_id)
    if current_user not in room.users:
        flash('你还不是该聊天室的成员，请先加入聊天室。', 'error')
        return redirect(url_for('chat.index'))
    
    # 获取聊天室的历史消息
    messages = room.messages.order_by(Message.created_at.asc()).all()
    return render_template('chat/room.html', room=room, messages=messages)

@bp.route('/create', methods=['GET', 'POST'])
@login_required
def create_room():
    form = CreateRoomForm()
    if form.validate_on_submit():
        room = ChatRoom(
            name=form.name.data,
            description=form.description.data,
            created_at=datetime.utcnow(),
            created_by=current_user.id
        )
        room.users.append(current_user)  # 创建者自动加入聊天室
        db.session.add(room)
        db.session.commit()
        flash('聊天室创建成功！', 'success')
        return redirect(url_for('chat.room', room_id=room.id))
    return render_template('chat/create_room.html', form=form)

@bp.route('/join/<int:room_id>', methods=['POST'])
@login_required
def join_room(room_id):
    room = ChatRoom.query.get_or_404(room_id)
    if current_user not in room.users:
        room.users.append(current_user)
        db.session.commit()
        flash('成功加入聊天室！', 'success')
    return redirect(url_for('chat.room', room_id=room_id))

@bp.route('/leave/<int:room_id>', methods=['POST'])
@login_required
def leave_room(room_id):
    room = ChatRoom.query.get_or_404(room_id)
    if current_user in room.users:
        room.users.remove(current_user)
        db.session.commit()
        flash('已退出聊天室。', 'info')
    return redirect(url_for('chat.index'))