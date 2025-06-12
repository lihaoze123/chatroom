#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
私聊功能数据库迁移脚本
用于更新现有数据库结构以支持私聊功能
"""

import sys
import os
from datetime import datetime

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import Room, PrivateChat, Message
from sqlalchemy import text

def migrate_database():
    """执行数据库迁移"""
    app = create_app()
    
    with app.app_context():
        print("开始数据库迁移...")
        
        try:
            # 1. 添加新字段到Room表
            print("1. 更新Room表结构...")
            
            # 检查room_type字段是否存在
            result = db.engine.execute(text(
                "SELECT COUNT(*) FROM pragma_table_info('room') WHERE name='room_type'"
            )).scalar()
            
            if result == 0:
                # 添加room_type字段
                db.engine.execute(text(
                    "ALTER TABLE room ADD COLUMN room_type VARCHAR(20) DEFAULT 'group'"
                ))
                print("   - 添加room_type字段")
            else:
                print("   - room_type字段已存在")
            
            # 检查is_encrypted字段是否存在
            result = db.engine.execute(text(
                "SELECT COUNT(*) FROM pragma_table_info('message') WHERE name='is_encrypted'"
            )).scalar()
            
            if result == 0:
                # 添加is_encrypted字段到Message表
                db.engine.execute(text(
                    "ALTER TABLE message ADD COLUMN is_encrypted BOOLEAN DEFAULT 0"
                ))
                print("   - 添加message.is_encrypted字段")
            else:
                print("   - message.is_encrypted字段已存在")
            
            # 2. 创建PrivateChat表
            print("2. 创建PrivateChat表...")
            
            # 检查表是否存在
            result = db.engine.execute(text(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='private_chat'"
            )).scalar()
            
            if result == 0:
                db.create_all()
                print("   - PrivateChat表创建成功")
            else:
                print("   - PrivateChat表已存在")
            
            # 3. 更新现有数据
            print("3. 更新现有数据...")
            
            # 更新所有现有房间的room_type为'group'
            updated_rooms = db.engine.execute(text(
                "UPDATE room SET room_type = 'group' WHERE room_type IS NULL OR room_type = ''"
            )).rowcount
            print(f"   - 更新了 {updated_rooms} 个房间的类型")
            
            # 4. 移除Room表的name字段唯一约束（如果存在）
            print("4. 更新索引...")
            
            # SQLite不支持直接删除约束，需要重建表
            # 这里我们创建新的索引来替代
            try:
                db.engine.execute(text(
                    "CREATE INDEX IF NOT EXISTS idx_room_name_type ON room(name, room_type)"
                ))
                print("   - 创建复合索引 idx_room_name_type")
            except Exception as e:
                print(f"   - 索引创建警告: {e}")
            
            # 提交所有更改
            db.session.commit()
            print("\n数据库迁移完成！")
            
            # 5. 验证迁移结果
            print("\n验证迁移结果:")
            room_count = Room.query.count()
            private_chat_count = PrivateChat.query.count()
            message_count = Message.query.count()
            
            print(f"   - 房间总数: {room_count}")
            print(f"   - 私聊总数: {private_chat_count}")
            print(f"   - 消息总数: {message_count}")
            
            return True
            
        except Exception as e:
            print(f"\n迁移失败: {e}")
            db.session.rollback()
            return False

def create_test_data():
    """创建测试数据（可选）"""
    app = create_app()
    
    with app.app_context():
        print("\n创建测试数据...")
        
        try:
            from app.models import User
            
            # 检查是否有用户
            user_count = User.query.count()
            if user_count < 2:
                print("需要至少2个用户才能创建私聊测试数据")
                return
            
            # 获取前两个用户
            users = User.query.limit(2).all()
            user1, user2 = users[0], users[1]
            
            # 创建测试私聊
            private_chat = PrivateChat.get_or_create_private_chat(user1.id, user2.id)
            
            if private_chat:
                print(f"   - 创建私聊: {user1.username} <-> {user2.username}")
                print(f"   - 私聊房间ID: {private_chat.room_id}")
            
            return True
            
        except Exception as e:
            print(f"创建测试数据失败: {e}")
            return False

if __name__ == '__main__':
    print("私聊功能数据库迁移工具")
    print("=" * 40)
    
    # 执行迁移
    success = migrate_database()
    
    if success:
        # 询问是否创建测试数据
        create_test = input("\n是否创建测试数据？(y/N): ").lower().strip()
        if create_test in ['y', 'yes']:
            create_test_data()
    
    print("\n迁移完成！")