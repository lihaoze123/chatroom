# main.py
# FastAPI主应用文件

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import sys
from pathlib import Path

from app.config import settings
from app.database import engine, Base
from app.api import auth, rooms, messages, upload
from app.socket.events import sio
import socketio

def get_resource_path(relative_path):
    """获取资源文件的绝对路径，支持PyInstaller打包"""
    try:
        # PyInstaller创建临时文件夹，并将路径存储在_MEIPASS中
        base_path = sys._MEIPASS
    except AttributeError:
        # 开发环境中使用当前目录
        base_path = os.path.abspath(".")
    
    return os.path.join(base_path, relative_path)

# 创建数据库表
Base.metadata.create_all(bind=engine)

# 创建FastAPI应用
app = FastAPI(
    title="聊天室API",
    description="基于FastAPI的实时聊天室应用",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["*"],
)

# 注册API路由
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(rooms.router, prefix="/api/rooms", tags=["房间"])
app.include_router(messages.router, prefix="/api/messages", tags=["消息"])
app.include_router(upload.router, prefix="/api/upload", tags=["上传"])

# 创建Socket.IO ASGI应用
socket_app = socketio.ASGIApp(sio, app)

# 确保上传目录存在
upload_dir = Path(settings.UPLOAD_DIR)
upload_dir.mkdir(exist_ok=True)
(upload_dir / "avatars").mkdir(exist_ok=True)
(upload_dir / "images").mkdir(exist_ok=True)
(upload_dir / "documents").mkdir(exist_ok=True)
(upload_dir / "audio").mkdir(exist_ok=True)
(upload_dir / "video").mkdir(exist_ok=True)
(upload_dir / "files").mkdir(exist_ok=True)

# 静态文件服务
if upload_dir.exists():
    app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")

# 前端静态文件服务 - 使用资源路径
frontend_build_dir = Path(get_resource_path("frontend/build"))
if frontend_build_dir.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_build_dir / "static")), name="static")

# 前端路由处理
@app.get("/{path:path}")
async def serve_frontend(path: str):
    """服务前端静态文件"""
    # 如果请求的是API路径、Socket.IO路径或uploads路径，跳过前端路由
    if path.startswith("api/") or path.startswith("uploads/") or path.startswith("socket.io/"):
        return {"error": "Not found"}, 404
    
    # 处理静态文件请求（CSS、JS、图片等）
    if path.startswith("static/"):
        file_path = frontend_build_dir / path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        else:
            return {"error": "File not found"}, 404
    
    # 处理其他静态资源（favicon.ico、manifest.json等）
    if path and (frontend_build_dir / path).exists():
        return FileResponse(str(frontend_build_dir / path))
    
    # 对于所有其他路径，返回index.html（支持React Router）
    index_path = frontend_build_dir / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    else:
        return {"error": "Frontend not found"}, 404

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:socket_app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    ) 