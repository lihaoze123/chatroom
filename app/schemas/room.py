from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from .user import UserSimple

class RoomBase(BaseModel):
    """房间基础模式"""
    name: str = Field(..., min_length=1, max_length=100, description="房间名称")
    description: Optional[str] = Field(None, description="房间描述")
    is_private: bool = Field(False, description="是否为私密房间")

class RoomCreate(RoomBase):
    """房间创建模式"""
    password: Optional[str] = Field(None, description="房间密码（私密房间）")

class RoomUpdate(BaseModel):
    """房间更新模式"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="房间名称")
    description: Optional[str] = Field(None, description="房间描述")
    password: Optional[str] = Field(None, description="房间密码")

class RoomResponse(RoomBase):
    """房间响应模式"""
    id: int
    created_by: int
    created_at: datetime
    member_count: int
    online_count: int
    
    class Config:
        from_attributes = True

class RoomWithMembers(RoomResponse):
    """包含成员信息的房间模式"""
    members: List[UserSimple] = []
    online_members: List[UserSimple] = []

class RoomJoin(BaseModel):
    """加入房间模式"""
    password: Optional[str] = Field(None, description="房间密码（私密房间需要）")

class RoomList(BaseModel):
    """房间列表模式"""
    user_rooms: List[RoomResponse] = Field([], description="用户已加入的房间")
    available_rooms: List[RoomResponse] = Field([], description="可用的房间") 