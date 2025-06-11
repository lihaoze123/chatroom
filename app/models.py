# app/models.py
# 数据库模型

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from app import db, login_manager

class User(UserMixin, db.Model):
    """用户模型"""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    avatar_url = db.Column(db.String(255), default='')
    is_online = db.Column(db.Boolean, default=False)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 关系
    messages = db.relationship('Message', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    room_memberships = db.relationship('RoomMembership', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def set_password(self, password):
        """设置密码哈希"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """检查密码"""
        return check_password_hash(self.password_hash, password)
    
    def update_last_seen(self):
        """更新最后在线时间"""
        self.last_seen = datetime.utcnow()
        db.session.commit()
    
    def set_online_status(self, is_online):
        """设置在线状态"""
        self.is_online = is_online
        if not is_online:
            self.last_seen = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'avatar_url': self.avatar_url,
            'is_online': self.is_online,
            'last_seen': self.last_seen.isoformat() if self.last_seen else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<User {self.username}>'

class Room(db.Model):
    """聊天室模型"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, default='')
    is_private = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 关系
    messages = db.relationship('Message', backref='room', lazy='dynamic', cascade='all, delete-orphan')
    memberships = db.relationship('RoomMembership', backref='room', lazy='dynamic', cascade='all, delete-orphan')
    creator = db.relationship('User', backref='created_rooms')
    
    def get_members(self):
        """获取房间成员"""
        return User.query.join(RoomMembership).filter(RoomMembership.room_id == self.id).all()
    
    def get_online_members(self):
        """获取在线成员"""
        return User.query.join(RoomMembership).filter(
            RoomMembership.room_id == self.id,
            User.is_online == True
        ).all()
    
    def add_member(self, user):
        """添加成员"""
        if not self.is_member(user):
            membership = RoomMembership(user_id=user.id, room_id=self.id)
            db.session.add(membership)
            db.session.commit()
    
    def remove_member(self, user):
        """移除成员"""
        membership = RoomMembership.query.filter_by(user_id=user.id, room_id=self.id).first()
        if membership:
            db.session.delete(membership)
            db.session.commit()
    
    def is_member(self, user):
        """检查是否为成员"""
        return RoomMembership.query.filter_by(user_id=user.id, room_id=self.id).first() is not None
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_private': self.is_private,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'member_count': self.memberships.count(),
            'online_count': len(self.get_online_members())
        }
    
    def __repr__(self):
        return f'<Room {self.name}>'

class RoomMembership(db.Model):
    """房间成员关系模型"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('room.id'), nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_admin = db.Column(db.Boolean, default=False)
    
    # 唯一约束
    __table_args__ = (db.UniqueConstraint('user_id', 'room_id', name='unique_user_room'),)
    
    def __repr__(self):
        return f'<RoomMembership user_id={self.user_id} room_id={self.room_id}>'

class Message(db.Model):
    """消息模型"""
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.String(20), default='text')  # text, image, file, system
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('room.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    edited_at = db.Column(db.DateTime)
    is_deleted = db.Column(db.Boolean, default=False)
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'content': self.content,
            'message_type': self.message_type,
            'user_id': self.user_id,
            'username': self.author.username if self.author else 'Unknown',
            'avatar_url': self.author.avatar_url if self.author else '',
            'room_id': self.room_id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'edited_at': self.edited_at.isoformat() if self.edited_at else None,
            'is_deleted': self.is_deleted
        }
    
    def __repr__(self):
        return f'<Message {self.id}>'

@login_manager.user_loader
def load_user(user_id):
    """Flask-Login用户加载器"""
    return User.query.get(int(user_id)) 