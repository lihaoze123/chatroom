# app/api/rooms.py
# 房间管理API

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.room import RoomCreate, RoomResponse, RoomUpdate, RoomJoin, RoomList, RoomWithMembers
from app.schemas.user import UserSimple
from app.models import Room, User, RoomMembership
from app.core.deps import get_current_user

router = APIRouter()

@router.get("/", response_model=RoomList)
async def get_rooms(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """获取房间列表"""
    # 获取用户已加入的房间
    user_rooms_query = db.query(Room).join(RoomMembership).filter(
        RoomMembership.user_id == current_user.id
    )
    user_rooms = user_rooms_query.all()
    
    # 获取所有可用房间（包括私密房间，但不包括用户已加入的）
    user_room_ids = [room.id for room in user_rooms]
    available_rooms_query = db.query(Room)
    if user_room_ids:
        available_rooms_query = available_rooms_query.filter(~Room.id.in_(user_room_ids))
    available_rooms = available_rooms_query.all()
    
    # 转换为响应格式
    user_rooms_response = []
    for room in user_rooms:
        room_dict = room.to_dict(db)
        user_rooms_response.append(RoomResponse(**room_dict))
    
    available_rooms_response = []
    for room in available_rooms:
        room_dict = room.to_dict(db)
        available_rooms_response.append(RoomResponse(**room_dict))
    
    return RoomList(
        user_rooms=user_rooms_response,
        available_rooms=available_rooms_response
    )

@router.post("/", response_model=RoomResponse)
async def create_room(
    room_data: RoomCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建房间"""
    # 检查房间名是否已存在
    if db.query(Room).filter(Room.name == room_data.name).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="房间名已存在"
        )
    
    # 创建房间
    db_room = Room(
        name=room_data.name,
        description=room_data.description,
        is_private=room_data.is_private,
        created_by=current_user.id
    )
    
    # 如果是私密房间且提供了密码，设置密码
    if room_data.is_private and room_data.password:
        db_room.set_password(room_data.password)
    
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    
    # 创建者自动加入房间
    membership = RoomMembership(
        user_id=current_user.id,
        room_id=db_room.id,
        is_admin=True
    )
    db.add(membership)
    db.commit()
    
    return RoomResponse(**db_room.to_dict(db))

@router.get("/{room_id}", response_model=RoomWithMembers)
async def get_room(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取房间详情"""
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
            detail="无权限访问此房间"
        )
    
    # 获取房间成员
    members = room.get_members(db)
    online_members = room.get_online_members(db)
    
    # 转换为响应格式
    room_dict = room.to_dict(db)
    members_response = [UserSimple(**member.to_dict()) for member in members]
    online_members_response = [UserSimple(**member.to_dict()) for member in online_members]
    
    return RoomWithMembers(
        **room_dict,
        members=members_response,
        online_members=online_members_response
    )

@router.post("/{room_id}/join")
async def join_room(
    room_id: int,
    join_data: RoomJoin,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """加入房间"""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="房间不存在"
        )
    
    # 检查是否已经是成员
    if room.is_member(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="您已经是该房间的成员"
        )
    
    # 如果是私密房间，验证密码
    if room.is_private:
        if not join_data.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="私密房间需要密码"
            )
        
        if not room.check_password(join_data.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="房间密码错误"
            )
    
    # 添加成员
    membership = RoomMembership(
        user_id=current_user.id,
        room_id=room_id
    )
    db.add(membership)
    db.commit()
    
    return {"message": "成功加入房间"}

@router.post("/{room_id}/leave")
async def leave_room(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """离开房间"""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="房间不存在"
        )
    
    # 检查是否是成员
    if not room.is_member(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="您不是该房间的成员"
        )
    
    # 移除成员
    membership = db.query(RoomMembership).filter_by(
        user_id=current_user.id,
        room_id=room_id
    ).first()
    
    if membership:
        db.delete(membership)
        db.commit()
    
    return {"message": "成功离开房间"}

@router.put("/{room_id}", response_model=RoomResponse)
async def update_room(
    room_id: int,
    room_data: RoomUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新房间信息"""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="房间不存在"
        )
    
    # 检查权限（只有创建者或管理员可以修改）
    if room.created_by != current_user.id:
        membership = db.query(RoomMembership).filter_by(
            user_id=current_user.id,
            room_id=room_id,
            is_admin=True
        ).first()
        
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="无权限修改此房间"
            )
    
    # 更新房间信息
    for field, value in room_data.dict(exclude_unset=True).items():
        if field == "password" and value:
            room.set_password(value)
        else:
            setattr(room, field, value)
    
    db.commit()
    db.refresh(room)
    
    return RoomResponse(**room.to_dict(db))

@router.delete("/{room_id}")
async def delete_room(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除房间"""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="房间不存在"
        )
    
    # 检查权限（只有创建者可以删除）
    if room.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有房间创建者可以删除房间"
        )
    
    # 删除房间（级联删除会自动删除相关的成员关系和消息）
    db.delete(room)
    db.commit()
    
    return {"message": "房间删除成功"} 