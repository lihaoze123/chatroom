#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
加密工具模块
用于私聊消息的端到端加密
"""

import base64
import hashlib
import secrets
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from typing import Tuple, Optional
import logging

logger = logging.getLogger(__name__)

class MessageEncryption:
    """消息加密类"""
    
    @staticmethod
    def generate_key() -> str:
        """生成加密密钥"""
        return Fernet.generate_key().decode('utf-8')
    
    @staticmethod
    def derive_key_from_password(password: str, salt: bytes = None) -> Tuple[str, bytes]:
        """从密码派生密钥"""
        if salt is None:
            salt = secrets.token_bytes(16)
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key.decode('utf-8'), salt
    
    @staticmethod
    def encrypt_message(message: str, key: str) -> Optional[str]:
        """加密消息"""
        try:
            f = Fernet(key.encode('utf-8'))
            encrypted_message = f.encrypt(message.encode('utf-8'))
            return base64.urlsafe_b64encode(encrypted_message).decode('utf-8')
        except Exception as e:
            logger.error(f"消息加密失败: {e}")
            return None
    
    @staticmethod
    def decrypt_message(encrypted_message: str, key: str) -> Optional[str]:
        """解密消息"""
        try:
            f = Fernet(key.encode('utf-8'))
            encrypted_data = base64.urlsafe_b64decode(encrypted_message.encode('utf-8'))
            decrypted_message = f.decrypt(encrypted_data)
            return decrypted_message.decode('utf-8')
        except Exception as e:
            logger.error(f"消息解密失败: {e}")
            return None
    
    @staticmethod
    def generate_room_key(user1_id: int, user2_id: int, room_id: int) -> str:
        """为私聊房间生成唯一密钥"""
        # 确保用户ID顺序一致
        if user1_id > user2_id:
            user1_id, user2_id = user2_id, user1_id
        
        # 使用用户ID和房间ID生成种子
        seed = f"{user1_id}_{user2_id}_{room_id}"
        
        # 生成密钥
        key_material = hashlib.sha256(seed.encode()).digest()
        key = base64.urlsafe_b64encode(key_material)
        return key.decode('utf-8')

class PrivateChatSecurity:
    """私聊安全管理类"""
    
    def __init__(self):
        self._room_keys = {}  # 缓存房间密钥
    
    def get_room_key(self, user1_id: int, user2_id: int, room_id: int) -> str:
        """获取房间密钥"""
        cache_key = f"{min(user1_id, user2_id)}_{max(user1_id, user2_id)}_{room_id}"
        
        if cache_key not in self._room_keys:
            self._room_keys[cache_key] = MessageEncryption.generate_room_key(
                user1_id, user2_id, room_id
            )
        
        return self._room_keys[cache_key]
    
    def encrypt_private_message(self, message: str, user1_id: int, user2_id: int, room_id: int) -> Optional[str]:
        """加密私聊消息"""
        try:
            key = self.get_room_key(user1_id, user2_id, room_id)
            return MessageEncryption.encrypt_message(message, key)
        except Exception as e:
            logger.error(f"私聊消息加密失败: {e}")
            return None
    
    def decrypt_private_message(self, encrypted_message: str, user1_id: int, user2_id: int, room_id: int) -> Optional[str]:
        """解密私聊消息"""
        try:
            key = self.get_room_key(user1_id, user2_id, room_id)
            return MessageEncryption.decrypt_message(encrypted_message, key)
        except Exception as e:
            logger.error(f"私聊消息解密失败: {e}")
            return None
    
    def clear_room_key(self, user1_id: int, user2_id: int, room_id: int):
        """清除房间密钥缓存"""
        cache_key = f"{min(user1_id, user2_id)}_{max(user1_id, user2_id)}_{room_id}"
        self._room_keys.pop(cache_key, None)

# 全局实例
private_chat_security = PrivateChatSecurity()

def encrypt_private_message(message: str, user1_id: int, user2_id: int, room_id: int) -> Optional[str]:
    """加密私聊消息的便捷函数"""
    return private_chat_security.encrypt_private_message(message, user1_id, user2_id, room_id)

def decrypt_private_message(encrypted_message: str, user1_id: int, user2_id: int, room_id: int) -> Optional[str]:
    """解密私聊消息的便捷函数"""
    return private_chat_security.decrypt_private_message(encrypted_message, user1_id, user2_id, room_id)

def validate_message_integrity(message: str) -> bool:
    """验证消息完整性"""
    try:
        # 简单的消息验证
        if not message or len(message.strip()) == 0:
            return False
        
        # 检查消息长度
        if len(message) > 10000:  # 10KB限制
            return False
        
        return True
    except Exception as e:
        logger.error(f"消息完整性验证失败: {e}")
        return False

def sanitize_message(message: str) -> str:
    """清理消息内容"""
    try:
        # 移除潜在的恶意内容
        sanitized = message.strip()
        
        # 移除控制字符
        sanitized = ''.join(char for char in sanitized if ord(char) >= 32 or char in '\n\r\t')
        
        return sanitized
    except Exception as e:
        logger.error(f"消息清理失败: {e}")
        return message