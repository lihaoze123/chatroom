from app import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

# 用户-聊天室关联表
user_room = db.Table('user_room',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('room_id', db.Integer, db.ForeignKey('chat_room.id'), primary_key=True)
)

class User(UserMixin, db.Model):
    """用户模型"""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True, nullable=False)
    email = db.Column(db.String(120), index=True, unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False) # Increased length for hashed passwords
    
    # 个人资料字段
    avatar = db.Column(db.String(200), default='default.jpg')  # 头像文件名
    real_name = db.Column(db.String(100))  # 真实姓名
    phone = db.Column(db.String(20))  # 电话号码
    address = db.Column(db.String(200))  # 地址
    bio = db.Column(db.Text)  # 个人简介
    gender = db.Column(db.String(10))  # 性别
    birthday = db.Column(db.Date)  # 生日
    occupation = db.Column(db.String(100))  # 职业
    website = db.Column(db.String(200))  # 个人网站
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())  # 注册时间
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())  # 更新时间
    password_hash = db.Column(db.String(256), nullable=False)

    # 关系
    rooms = db.relationship('ChatRoom', secondary=user_room, back_populates='users')
    messages = db.relationship('Message', backref='sender', lazy='dynamic')
    created_rooms = db.relationship('ChatRoom', backref='creator', lazy='dynamic',
                                  foreign_keys='ChatRoom.created_by')

    def set_password(self, password):
        """设置密码哈希"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """验证密码"""
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

class ChatRoom(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))

    # 关系
    users = db.relationship('User', secondary=user_room, back_populates='rooms')
    messages = db.relationship('Message', backref='room', lazy='dynamic')

    def __repr__(self):
        return f'<ChatRoom {self.name}>'

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('chat_room.id'), nullable=False)

    def __repr__(self):
        return f'<Message {self.id} by {self.sender.username}>'

# User loader for Flask-Login
from app import login_manager

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))
