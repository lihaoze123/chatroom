# 文件上传API

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
import os
import uuid
import aiofiles
from pathlib import Path

from app.database import get_db
from app.models import User
from app.core.deps import get_current_user
from app.config import settings

router = APIRouter()

def get_file_extension(filename: str) -> str:
    """获取文件扩展名"""
    return filename.split('.')[-1].lower() if '.' in filename else ''

def is_allowed_file(filename: str) -> bool:
    """检查文件类型是否允许"""
    extension = get_file_extension(filename)
    return extension in settings.ALLOWED_EXTENSIONS

def generate_unique_filename(original_filename: str) -> str:
    """生成唯一的文件名"""
    extension = get_file_extension(original_filename)
    unique_id = str(uuid.uuid4())
    return f"{unique_id}.{extension}" if extension else unique_id

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """上传用户头像"""
    # 检查文件类型
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请选择文件"
        )
    
    # 检查是否是图片文件
    image_extensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
    extension = get_file_extension(file.filename)
    if extension not in image_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="只支持图片文件格式"
        )
    
    # 检查文件大小
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="头像文件大小不能超过5MB"
        )
    
    # 创建上传目录
    upload_dir = Path(settings.UPLOAD_DIR) / "avatars"
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # 生成唯一文件名
    filename = generate_unique_filename(file.filename)
    file_path = upload_dir / filename
    
    # 保存文件
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    # 更新用户头像URL
    avatar_url = f"/uploads/avatars/{filename}"
    current_user.avatar_url = avatar_url
    db.commit()
    
    # 刷新用户对象以获取最新数据
    db.refresh(current_user)
    
    return {
        "message": "头像上传成功",
        "avatar_url": avatar_url,
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "avatar_url": current_user.avatar_url,
            "real_name": current_user.real_name,
            "phone": current_user.phone,
            "address": current_user.address,
            "bio": current_user.bio,
            "gender": current_user.gender,
            "birthday": current_user.birthday.isoformat() if current_user.birthday else None,
            "occupation": current_user.occupation,
            "website": current_user.website,
            "created_at": current_user.created_at.isoformat(),
            "updated_at": current_user.updated_at.isoformat(),
            "is_online": getattr(current_user, 'is_online', False),
            "last_seen": current_user.last_seen.isoformat() if current_user.last_seen else None
        }
    }

@router.post("/file")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """上传聊天文件"""
    # 检查文件
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请选择文件"
        )
    
    # 检查文件类型
    if not is_allowed_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的文件类型。支持的类型：{', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
    
    # 检查文件大小
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        max_size_mb = settings.MAX_FILE_SIZE / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"文件大小不能超过{max_size_mb}MB"
        )
    
    # 确定文件类型目录
    extension = get_file_extension(file.filename)
    if extension in ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']:
        file_type = "images"
    elif extension in ['pdf', 'doc', 'docx', 'txt', 'md']:
        file_type = "documents"
    elif extension in ['mp3', 'wav', 'ogg']:
        file_type = "audio"
    elif extension in ['mp4', 'avi', 'mov', 'webm']:
        file_type = "video"
    else:
        file_type = "files"
    
    # 创建上传目录
    upload_dir = Path(settings.UPLOAD_DIR) / file_type
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # 生成唯一文件名
    filename = generate_unique_filename(file.filename)
    file_path = upload_dir / filename
    
    # 保存文件
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    # 返回文件信息
    file_url = f"/uploads/{file_type}/{filename}"
    
    return {
        "message": "文件上传成功",
        "file_url": file_url,
        "file_name": file.filename,
        "file_size": len(content),
        "file_type": extension
    }

@router.delete("/file")
async def delete_file(
    file_url: str,
    current_user: User = Depends(get_current_user)
):
    """删除文件"""
    # 验证文件URL格式
    if not file_url.startswith("/uploads/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效的文件URL"
        )
    
    # 构建文件路径
    file_path = Path(".") / file_url.lstrip("/")
    
    # 检查文件是否存在
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文件不存在"
        )
    
    try:
        # 删除文件
        file_path.unlink()
        return {"message": "文件删除成功"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="文件删除失败"
        )