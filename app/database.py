from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from pathlib import Path

# 数据库URL配置
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./instance/chatroom.db")

# 确保instance目录存在（仅对SQLite数据库）
if "sqlite" in DATABASE_URL and ":///" in DATABASE_URL:
    # 提取数据库文件路径
    db_path = DATABASE_URL.split("///", 1)[1]
    if db_path.startswith("./"):
        db_path = db_path[2:]  # 移除 "./" 前缀
    
    # 获取数据库文件的目录
    db_dir = Path(db_path).parent
    
    # 创建目录（如果不存在）
    db_dir.mkdir(parents=True, exist_ok=True)
    print(f"确保数据库目录存在: {db_dir}")

# 创建数据库引擎
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False  # 设置为True可以看到SQL查询日志
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基础模型类
Base = declarative_base()

def get_db():
    """数据库依赖注入函数"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 