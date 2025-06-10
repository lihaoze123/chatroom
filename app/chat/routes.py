from flask import render_template, request
from app.chat import bp

@bp.route('/')
def index():
    return render_template('chat/index.html')

@bp.route('/room/<room_name>')
def room(room_name):
    return render_template('chat/room.html', room_name=room_name) 