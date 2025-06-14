from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime, date

class UserBase(BaseModel):
    """用户基础模式"""
    username: str = Field(..., min_length=2, max_length=20, description="用户名")
    email: EmailStr = Field(..., description="邮箱地址")

class UserCreate(UserBase):
    """用户创建模式"""
    password: str = Field(..., min_length=6, description="密码")

class UserLogin(BaseModel):
    """用户登录模式"""
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")
    remember_me: bool = Field(False, description="记住我")

class UserUpdate(BaseModel):
    """用户更新模式"""
    real_name: Optional[str] = Field(None, max_length=100, description="真实姓名")
    phone: Optional[str] = Field(None, max_length=20, description="电话号码")
    address: Optional[str] = Field(None, description="地址")
    bio: Optional[str] = Field(None, description="个人简介")
    gender: Optional[str] = Field(None, max_length=10, description="性别")
    birthday: Optional[date] = Field(None, description="生日")
    occupation: Optional[str] = Field(None, max_length=100, description="职业")
    website: Optional[str] = Field(None, max_length=255, description="个人网站")

class UserResponse(UserBase):
    """用户响应模式"""
    id: int
    avatar_url: Optional[str] = None
    is_online: bool
    last_seen: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    real_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    bio: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[date] = None
    occupation: Optional[str] = None
    website: Optional[str] = None
    
    class Config:
        from_attributes = True

class UserSimple(BaseModel):
    """用户简单信息模式"""
    id: int
    username: str
    avatar_url: Optional[str] = None
    is_online: bool
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    """JWT令牌模式"""
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    """令牌数据模式"""
    username: Optional[str] = None

class PasswordChange(BaseModel):
    """密码修改模式"""
    current_password: str = Field(..., description="当前密码")
    new_password: str = Field(..., min_length=6, description="新密码") 