# 聊天室后端重构说明

## 概述

本项目的后端部分已经从零开始重构，采用现代化的Flask架构设计，提供了完整的RESTful API和WebSocket实时通信功能。

## 技术栈

- **Flask** - Web框架
- **Flask-SQLAlchemy** - ORM数据库操作
- **Flask-Login** - 用户认证管理
- **Flask-SocketIO** - WebSocket实时通信
- **Flask-CORS** - 跨域资源共享
- **Flask-WTF** - 表单处理和CSRF保护
- **SQLite** - 数据库（开发环境）
- **Eventlet** - 异步服务器

## 项目结构

```
app/
├── __init__.py              # 应用工厂和扩展初始化
├── models.py                # 数据库模型
├── main/                    # 主要蓝图
│   ├── __init__.py
│   └── routes.py           # 主页路由
├── auth/                    # 认证蓝图
│   ├── __init__.py
│   ├── routes.py           # 认证路由（传统Web）
│   └── forms.py            # 表单类
├── chat/                    # 聊天蓝图
│   ├── __init__.py
│   ├── routes.py           # 聊天路由（传统Web）
│   └── events.py           # Socket.IO事件处理
├── api/                     # API蓝图
│   ├── __init__.py
│   ├── auth.py             # 认证API（JSON）
│   └── chat.py             # 聊天API（JSON）
└── templates/               # HTML模板
    ├── base.html
    ├── index.html
    └── auth/
        └── login.html
```

## 数据库模型

### User（用户模型）
- `id` - 主键
- `username` - 用户名（唯一）
- `email` - 邮箱（唯一）
- `password_hash` - 密码哈希
- `avatar_url` - 头像URL
- `is_online` - 在线状态
- `last_seen` - 最后在线时间
- `created_at` - 创建时间

### Room（聊天室模型）
- `id` - 主键
- `name` - 房间名称（唯一）
- `description` - 房间描述
- `is_private` - 是否私有
- `created_by` - 创建者ID
- `created_at` - 创建时间

### Message（消息模型）
- `id` - 主键
- `content` - 消息内容
- `message_type` - 消息类型（text, image, file, system）
- `user_id` - 发送者ID
- `room_id` - 房间ID
- `timestamp` - 发送时间
- `edited_at` - 编辑时间
- `is_deleted` - 是否删除

### RoomMembership（房间成员关系）
- `id` - 主键
- `user_id` - 用户ID
- `room_id` - 房间ID
- `joined_at` - 加入时间
- `is_admin` - 是否管理员

## API端点

### 认证API (`/api/auth/`)

- `POST /register` - 用户注册
- `POST /login` - 用户登录
- `POST /logout` - 用户登出
- `GET /me` - 获取当前用户信息
- `PUT /profile` - 更新用户资料
- `PUT /change-password` - 修改密码
- `GET /check` - 检查认证状态

### 聊天API (`/api/`)

- `GET /rooms` - 获取房间列表
- `POST /rooms` - 创建房间
- `GET /rooms/<id>` - 获取房间详情
- `POST /rooms/<id>/join` - 加入房间
- `POST /rooms/<id>/leave` - 离开房间
- `GET /rooms/<id>/messages` - 获取房间消息
- `POST /rooms/<id>/messages` - 发送消息
- `PUT /messages/<id>` - 编辑消息
- `DELETE /messages/<id>` - 删除消息
- `GET /users/online` - 获取在线用户
- `GET /rooms/<id>/members` - 获取房间成员

## WebSocket事件

### 客户端发送事件
- `connect` - 连接服务器
- `disconnect` - 断开连接
- `join_room` - 加入房间
- `leave_room` - 离开房间
- `send_message` - 发送消息
- `typing_start` - 开始输入
- `typing_stop` - 停止输入
- `get_online_users` - 获取在线用户
- `ping` - 心跳检测

### 服务器发送事件
- `user_status_update` - 用户状态更新
- `room_joined` - 成功加入房间
- `user_joined` - 用户加入房间
- `user_left` - 用户离开房间
- `new_message` - 新消息
- `typing_update` - 输入状态更新
- `online_users_update` - 在线用户更新
- `error` - 错误信息
- `pong` - 心跳响应

## 功能特性

### 用户认证
- 安全的密码哈希存储
- Session管理
- 记住登录状态
- 用户资料管理

### 实时聊天
- WebSocket实时通信
- 多房间支持
- 在线状态显示
- 正在输入提示
- 消息历史记录

### 房间管理
- 公共/私有房间
- 房间成员管理
- 自动加入公共房间
- 房间创建和管理

### 消息功能
- 文本消息
- 消息编辑和删除
- 消息分页加载
- 消息类型支持

## 安全特性

- CSRF保护
- 密码哈希存储
- 用户权限验证
- 输入验证和清理
- SQL注入防护

## 开发和部署

### 初始化数据库
```bash
uv run python init_db.py
```

### 启动开发服务器
```bash
uv run python run.py
```

### 运行API测试
```bash
uv run python test_api.py
```

### 默认账户
- 管理员: `admin` / `admin123`
- 测试用户: `testuser` / `test123`

### 默认聊天室
- 大厅
- 技术讨论
- 随便聊聊

## 配置

项目支持多环境配置：
- `development` - 开发环境（默认）
- `production` - 生产环境
- `testing` - 测试环境

通过环境变量 `FLASK_ENV` 控制。

## 扩展性

后端架构采用蓝图模式，易于扩展：
- 模块化设计
- 清晰的职责分离
- RESTful API设计
- 支持前后端分离

## 下一步计划

1. 添加文件上传功能
2. 实现私聊功能
3. 添加消息搜索
4. 实现用户权限管理
5. 添加消息推送通知
6. 优化数据库查询性能
7. 添加API文档（Swagger）
8. 实现数据库迁移脚本