# app/models.py
# Define your User model here.

from app import db # Assuming 'db' is initialized in app/__init__.py
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

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

    def set_password(self, password):
        """设置密码哈希"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """验证密码"""
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'