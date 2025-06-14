from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# 数据库URL配置
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./instance/chatroom.db")

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