#!/usr/bin/env python3
# init_db.py
# 数据库初始化脚本

from app import create_app, db
from app.models import User, Room
from config import config

def init_database():
    """初始化数据库"""
    # 创建应用实例
    app = create_app(config['development'])
    
    with app.app_context():
        # 删除所有表并重新创建
        print("正在删除现有数据库表...")
        db.drop_all()
        
        print("正在创建数据库表...")
        db.create_all()
        
        # 创建默认用户
        print("正在创建默认用户...")
        admin_user = User(
            username='admin',
            email='admin@chatroom.com'
        )
        admin_user.set_password('admin123')
        db.session.add(admin_user)
        
        test_user = User(
            username='testuser',
            email='test@chatroom.com'
        )
        test_user.set_password('test123')
        db.session.add(test_user)
        
        # 提交用户数据
        db.session.commit()
        
        # 创建默认聊天室
        print("正在创建默认聊天室...")
        general_room = Room(
            name='大厅',
            description='欢迎来到聊天室大厅！这里是大家交流的地方。',
            is_private=False,
            created_by=admin_user.id
        )
        db.session.add(general_room)
        
        tech_room = Room(
            name='技术讨论',
            description='讨论编程、技术和开发相关话题的地方。',
            is_private=False,
            created_by=admin_user.id
        )
        db.session.add(tech_room)
        
        random_room = Room(
            name='随便聊聊',
            description='轻松愉快的闲聊空间，分享生活中的点点滴滴。',
            is_private=False,
            created_by=admin_user.id
        )
        db.session.add(random_room)
        
        # 提交房间数据
        db.session.commit()
        
        # 让默认用户加入房间
        print("正在设置房间成员...")
        general_room.add_member(admin_user)
        general_room.add_member(test_user)
        tech_room.add_member(admin_user)
        random_room.add_member(test_user)
        
        print("数据库初始化完成！")
        print("\n默认账户信息：")
        print("管理员账户: admin / admin123")
        print("测试账户: testuser / test123")
        print("\n默认聊天室：")
        print("- 大厅")
        print("- 技术讨论") 
        print("- 随便聊聊")

if __name__ == '__main__':
    init_database()