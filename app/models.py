from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from app import db

# 聊天室成员关联表
room_members = db.Table('room_members',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('room_id', db.Integer, db.ForeignKey('chat_room.id'), primary_key=True),
    db.Column('joined_at', db.DateTime, default=datetime.utcnow)
)

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 关系
    messages = db.relationship('Message', backref='author', lazy='dynamic')
    created_rooms = db.relationship('ChatRoom', backref='creator', lazy='dynamic')
    rooms = db.relationship('ChatRoom', secondary=room_members,
                          backref=db.backref('members', lazy='dynamic'))
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.username}>'

class ChatRoom(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 关系
    messages = db.relationship('Message', backref='room', lazy='dynamic')
    
    def __repr__(self):
        return f'<ChatRoom {self.name}>'

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    room_id = db.Column(db.Integer, db.ForeignKey('chat_room.id'))
    
    def __repr__(self):
        return f'<Message {self.content[:20]}...>'