# app/api/messages.py
# 消息管理API

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List

from app.database import get_db
from app.schemas.message import MessageCreate, MessageResponse, MessageUpdate, MessageList
from app.models import Message, Room, User
from app.core.deps import get_current_user

router = APIRouter()

@router.get("/{room_id}", response_model=MessageList)
async def get_messages(
    room_id: int,
    page: int = Query(1, ge=1, description="页码"),
    per_page: int = Query(50, ge=1, le=100, description="每页消息数"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取房间消息列表"""
    # 检查房间是否存在
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="房间不存在"
        )
    
    # 检查权限
    if room.is_private and not room.is_member(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限访问此房间的消息"
        )
    
    # 查询消息
    query = db.query(Message).filter(
        Message.room_id == room_id,
        Message.is_deleted == False
    ).order_by(desc(Message.timestamp))
    
    # 分页
    total = query.count()
    offset = (page - 1) * per_page
    messages = query.offset(offset).limit(per_page).all()
    
    # 反转消息顺序（最新的在后面）
    messages.reverse()
    
    # 转换为响应格式
    messages_response = []
    for message in messages:
        message_dict = message.to_dict()
        messages_response.append(MessageResponse(**message_dict))
    
    return MessageList(
        messages=messages_response,
        total=total,
        page=page,
        per_page=per_page,
        has_next=offset + per_page < total,
        has_prev=page > 1
    )

@router.post("/", response_model=MessageResponse)
async def create_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """发送消息"""
    # 检查房间是否存在
    room = db.query(Room).filter(Room.id == message_data.room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="房间不存在"
        )
    
    # 检查权限
    if room.is_private and not room.is_member(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限在此房间发送消息"
        )
    
    # 验证消息内容
    if message_data.message_type == 'text' and not message_data.content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="消息内容不能为空"
        )
    
    if len(message_data.content) > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="消息内容不能超过1000个字符"
        )
    
    # 处理文件消息
    content = message_data.content
    if message_data.message_type in ['file', 'image'] and message_data.file_url:
        import json
        file_info = {
            'url': message_data.file_url,
            'name': message_data.file_name,
            'size': message_data.file_size,
            'description': message_data.content
        }
        content = json.dumps(file_info, ensure_ascii=False)
    
    # 创建消息
    db_message = Message(
        content=content,
        message_type=message_data.message_type,
        user_id=current_user.id,
        room_id=message_data.room_id
    )
    
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    # 返回消息响应
    message_dict = db_message.to_dict()
    return MessageResponse(**message_dict)

@router.put("/{message_id}", response_model=MessageResponse)
async def update_message(
    message_id: int,
    message_data: MessageUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """编辑消息"""
    # 查找消息
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="消息不存在"
        )
    
    # 检查权限（只有消息作者可以编辑）
    if message.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只能编辑自己的消息"
        )
    
    # 检查消息是否已被删除
    if message.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="已删除的消息无法编辑"
        )
    
    # 验证新内容
    if not message_data.content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="消息内容不能为空"
        )
    
    if len(message_data.content) > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="消息内容不能超过1000个字符"
        )
    
    # 更新消息
    message.content = message_data.content
    message.edited_at = func.now()
    
    db.commit()
    db.refresh(message)
    
    # 返回更新后的消息
    message_dict = message.to_dict()
    return MessageResponse(**message_dict)

@router.delete("/{message_id}")
async def delete_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除消息"""
    # 查找消息
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="消息不存在"
        )
    
    # 检查权限（消息作者或房间管理员可以删除）
    can_delete = False
    
    if message.user_id == current_user.id:
        can_delete = True
    else:
        # 检查是否是房间管理员
        room = db.query(Room).filter(Room.id == message.room_id).first()
        if room and room.created_by == current_user.id:
            can_delete = True
        else:
            # 检查是否是房间管理员成员
            from app.models import RoomMembership
            membership = db.query(RoomMembership).filter_by(
                user_id=current_user.id,
                room_id=message.room_id,
                is_admin=True
            ).first()
            if membership:
                can_delete = True
    
    if not can_delete:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限删除此消息"
        )
    
    # 软删除消息
    message.is_deleted = True
    message.content = "[此消息已被删除]"
    
    db.commit()
    
    return {"message": "消息删除成功"} 