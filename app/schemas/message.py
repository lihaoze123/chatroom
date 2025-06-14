from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class MessageBase(BaseModel):
    """消息基础模式"""
    content: str = Field(..., description="消息内容")
    message_type: str = Field("text", description="消息类型")

class MessageCreate(MessageBase):
    """消息创建模式"""
    room_id: int = Field(..., description="房间ID")
    file_url: Optional[str] = Field(None, description="文件URL")
    file_name: Optional[str] = Field(None, description="文件名")
    file_size: Optional[int] = Field(None, description="文件大小")

class MessageResponse(MessageBase):
    """消息响应模式"""
    id: int
    user_id: int
    username: str
    avatar_url: Optional[str] = None
    room_id: int
    timestamp: datetime
    edited_at: Optional[datetime] = None
    is_deleted: bool = False
    
    class Config:
        from_attributes = True

class MessageUpdate(BaseModel):
    """消息更新模式"""
    content: str = Field(..., description="新的消息内容")

class MessageList(BaseModel):
    """消息列表模式"""
    messages: List[MessageResponse] = []
    total: int = 0
    page: int = 1
    per_page: int = 50
    has_next: bool = False
    has_prev: bool = False 