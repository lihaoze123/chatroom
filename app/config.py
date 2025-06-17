import os
from typing import List
from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    """应用配置"""
    
    # 基础配置
    APP_NAME: str = "聊天室应用"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # 数据库配置
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./instance/chatroom.db")
    
    def model_post_init(self, __context):
        """模型初始化后处理，确保必要的目录存在"""
        # 确保数据库目录存在（仅对SQLite数据库）
        if "sqlite" in self.DATABASE_URL and ":///" in self.DATABASE_URL:
            # 提取数据库文件路径
            db_path = self.DATABASE_URL.split("///", 1)[1]
            if db_path.startswith("./"):
                db_path = db_path[2:]  # 移除 "./" 前缀
            
            # 获取数据库文件的目录
            db_dir = Path(db_path).parent
            
            # 创建目录（如果不存在）
            db_dir.mkdir(parents=True, exist_ok=True)
        
        # 确保日志目录存在
        log_dir = Path(self.LOG_FILE).parent
        log_dir.mkdir(parents=True, exist_ok=True)
        
        # 确保上传目录存在
        upload_dir = Path(self.UPLOAD_DIR)
        upload_dir.mkdir(parents=True, exist_ok=True)
    
    # JWT配置
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7天
    
    # 文件上传配置
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: List[str] = [
        "jpg", "jpeg", "png", "gif", "bmp", "webp",  # 图片
        "pdf", "doc", "docx", "txt", "md",  # 文档
        "mp3", "wav", "ogg",  # 音频
        "mp4", "avi", "mov", "webm"  # 视频
    ]
    
    # 日志配置
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: str = os.getenv("LOG_FILE", "logs/app.log")
    
    class Config:
        env_file = ".env"

# 创建全局设置实例
settings = Settings() 