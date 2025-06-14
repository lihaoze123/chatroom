#!/usr/bin/env python3
# run.py
# FastAPI应用启动文件

import os
import sys
import uvicorn
from app.config import settings

def main():
    """主函数"""
    try:
        print(f"启动FastAPI聊天室应用...")
        print(f"环境: {'开发' if settings.DEBUG else '生产'}")
        print(f"地址: http://{settings.HOST}:{settings.PORT}")
        print(f"调试模式: {'开启' if settings.DEBUG else '关闭'}")
        print(f"API文档: http://{settings.HOST}:{settings.PORT}/api/docs")
        
        # 使用uvicorn运行应用
        uvicorn.run(
            "main:socket_app",
            host=settings.HOST,
            port=settings.PORT,
            reload=settings.DEBUG,
            log_level="info" if not settings.DEBUG else "debug"
        )
        
    except KeyboardInterrupt:
        print("\n应用已停止")
        sys.exit(0)
    except Exception as e:
        print(f"应用启动失败: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main() 