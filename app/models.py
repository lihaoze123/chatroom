# app/models.py
# 数据库模型

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from app.core.security import get_password_hash, verify_password

class User(Base):
    """用户模型"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(80), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    avatar_url = Column(String(255), default='')
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime, default=func.now())
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # 扩展个人信息字段
    real_name = Column(String(100), default='')
    phone = Column(String(20), default='')
    address = Column(Text, default='')
    bio = Column(Text, default='')
    gender = Column(String(10), default='')
    birthday = Column(Date, nullable=True)
    occupation = Column(String(100), default='')
    website = Column(String(255), default='')
    
    # 关系
    messages = relationship('Message', back_populates='author', cascade='all, delete-orphan')
    room_memberships = relationship('RoomMembership', back_populates='user', cascade='all, delete-orphan')
    created_rooms = relationship('Room', back_populates='creator')
    
    def set_password(self, password):
        """设置密码哈希"""
        self.password_hash = get_password_hash(password)
    
    def check_password(self, password):
        """检查密码"""
        return verify_password(password, self.password_hash)
    
    def update_last_seen(self):
        """更新最后在线时间"""
        self.last_seen = datetime.utcnow()
    
    def set_online_status(self, is_online):
        """设置在线状态"""
        self.is_online = is_online
        if not is_online:
            self.last_seen = datetime.utcnow()
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'avatar_url': self.avatar_url,
            'is_online': self.is_online,
            'last_seen': self.last_seen.isoformat() if self.last_seen else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'real_name': self.real_name,
            'phone': self.phone,
            'address': self.address,
            'bio': self.bio,
            'gender': self.gender,
            'birthday': self.birthday.isoformat() if self.birthday else None,
            'occupation': self.occupation,
            'website': self.website
        }
    
    def __repr__(self):
        return f'<User {self.username}>'

class Room(Base):
    """聊天室模型"""
    __tablename__ = "rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, default='')
    is_private = Column(Boolean, default=False)
    password_hash = Column(String(255), nullable=True)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=func.now())
    
    # 关系
    messages = relationship('Message', back_populates='room', cascade='all, delete-orphan')
    memberships = relationship('RoomMembership', back_populates='room', cascade='all, delete-orphan')
    creator = relationship('User', back_populates='created_rooms')
    
    
    def set_password(self, raw_password):
        """设置聊天室密码（仅私密房间用）"""
        self.password_hash = get_password_hash(raw_password)

    def check_password(self, raw_password):
        """检查聊天室密码是否正确"""
        if not self.password_hash:
            return False
        return verify_password(raw_password, self.password_hash)
    
    
    def get_members(self, db_session):
        """获取房间成员"""
        return db_session.query(User).join(RoomMembership).filter(RoomMembership.room_id == self.id).all()
    
    def get_online_members(self, db_session):
        """获取在线成员"""
        return db_session.query(User).join(RoomMembership).filter(
            RoomMembership.room_id == self.id,
            User.is_online == True
        ).all()
    
    def add_member(self, user, db_session):
        """添加成员"""
        if not self.is_member(user, db_session):
            membership = RoomMembership(user_id=user.id, room_id=self.id)
            db_session.add(membership)
    
    def remove_member(self, user, db_session):
        """移除成员"""
        membership = db_session.query(RoomMembership).filter_by(user_id=user.id, room_id=self.id).first()
        if membership:
            db_session.delete(membership)
    
    def is_member(self, user, db_session):
        """检查是否为成员"""
        return db_session.query(RoomMembership).filter_by(user_id=user.id, room_id=self.id).first() is not None
    
    def to_dict(self, db_session=None):
        """转换为字典"""
        member_count = len(self.memberships) if self.memberships else 0
        online_count = len(self.get_online_members(db_session)) if db_session else 0
        
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_private': self.is_private,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'member_count': member_count,
            'online_count': online_count
        }
    
    def __repr__(self):
        return f'<Room {self.name}>'

class RoomMembership(Base):
    """房间成员关系模型"""
    __tablename__ = "room_memberships"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    room_id = Column(Integer, ForeignKey('rooms.id'), nullable=False)
    joined_at = Column(DateTime, default=func.now())
    is_admin = Column(Boolean, default=False)
    
    # 关系
    user = relationship('User', back_populates='room_memberships')
    room = relationship('Room', back_populates='memberships')
    
    def __repr__(self):
        return f'<RoomMembership user_id={self.user_id} room_id={self.room_id}>'

class Message(Base):
    """消息模型"""
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    message_type = Column(String(20), default='text')  # text, image, file, system
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    room_id = Column(Integer, ForeignKey('rooms.id'), nullable=False)
    timestamp = Column(DateTime, default=func.now(), index=True)
    edited_at = Column(DateTime)
    is_deleted = Column(Boolean, default=False)
    
    # 关系
    author = relationship('User', back_populates='messages')
    room = relationship('Room', back_populates='messages')
    
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