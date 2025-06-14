# 实时 Web 聊天应用

一个基于 **FastAPI** 和 **WebSocket (Socket.IO)** 构建的现代实时 Web 聊天应用。

> **🚀 重要更新**: 本项目已从Flask成功迁移到FastAPI！享受更高的性能、自动API文档生成和现代异步支持。详细迁移信息请查看 [FASTAPI_MIGRATION.md](FASTAPI_MIGRATION.md) 和 [FRONTEND_MIGRATION_SUMMARY.md](FRONTEND_MIGRATION_SUMMARY.md)。

## 技术栈

- [Python](https://www.python.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Socket.IO](https://socket.io/)
- [SQLAlchemy](https://www.sqlalchemy.org/)
- [JWT](https://jwt.io/) - JSON Web Token认证

## 📖 项目简介

本项目旨在构建一个基于 Web 的实时聊天平台，允许用户注册、登录，并在公共或私密聊天室中与其他在线用户进行实时交流。消息发送后将即时显示在所有用户的屏幕上，无需刷新页面。项目采用模块化设计，易于扩展和维护。

## ✨ 主要功能

  * ✅ **用户认证**: 安全的注册、登录和登出功能。
  * ✅ **实时消息**: 基于 WebSocket 的多用户实时文本通信。
  * ✅ **房间/群聊**: 支持加入和离开不同的聊天室。
  * ✅ **私密房间**: 支持创建密码保护的私密聊天室。
  * ✅ **在线状态**: 实时显示用户的在线状态。
  * ✅ **正在输入提示**: 当对方正在输入时，会显示提示信息。
  * ✅ **消息历史加载**: 通过向上滚动方式高效加载历史消息。
  * ✅ **富媒体支持**: 支持发送表情符号和文件上传（图片、文档等）。
  * ✅ **浏览器通知**: 当应用在后台时，通过浏览器桌面通知提醒新消息。
  * ✅ **文件上传**: 支持图片和文档文件的安全上传与分享。
  * ✅ **自动API文档**: FastAPI自动生成交互式API文档（Swagger UI）。
  * ✅ **高性能**: 基于Starlette和Pydantic，提供出色的性能表现。
  * ✅ **类型安全**: 完整的类型提示和自动数据验证。

## 🛠️ 技术栈

### 后端
  * **FastAPI 0.115.6+** - 现代高性能Web框架
  * **Socket.IO 5.11.4+** - WebSocket实时通信
  * **SQLAlchemy 2.0+** - 现代ORM数据库操作
  * **JWT (PyJWT)** - JSON Web Token认证
  * **Pydantic 2.0+** - 数据验证和序列化
  * **Uvicorn** - ASGI服务器
  * **SQLite** - 数据库（开发环境）
  * **Asyncio** - 原生异步支持

### 前端
  * **React 19.1.0** - 用户界面库
  * **TypeScript 4.9.5+** - 类型安全的JavaScript
  * **TailwindCSS 3.4.17** - 实用优先的CSS框架
  * **shadcn/ui** - 现代化UI组件库
  * **Radix UI** - 无障碍访问的原始组件
  * **Socket.IO Client 4.8.1+** - 实时通信
  * **Axios 1.9.0+** - HTTP客户端
  * **React Router 6.30.1+** - 路由管理
  * **React Hot Toast 2.5.2+** - 通知组件
  * **Framer Motion 12.17.3+** - 动画库
  * **Lucide React 0.513.0+** - 图标库

### 工具链
  * **uv** - Python包管理（推荐）
  * **npm** - Node.js包管理

## 🚀 快速开始

请确保您的系统已安装 [Python](https://www.python.org/) 和 [Node.js](https://nodejs.org/)。

### 环境要求

- **Python 3.13+**
- **Node.js 16+**
- **npm 或 yarn**

### 1\. 克隆仓库

```bash
git clone https://github.com/lihaoze123/chatroom.git
cd chatroom
```

### 2\. 后端设置

#### 创建并激活虚拟环境

```bash
# 使用 uv (推荐)
uv venv
source .venv/bin/activate  # Linux/macOS
# 或 .venv\Scripts\activate  # Windows

# 或使用 Python 内置 venv
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# 或 .venv\Scripts\activate  # Windows
```

#### 安装后端依赖

```bash
# 使用 uv (推荐)
uv sync

# 或使用 pip
pip install -r requirements.txt
```

#### 初始化数据库

```bash
python init_db.py
```

### 3\. 前端设置

```bash
cd frontend
npm install

# 构建 shadcn/ui 样式
npm run build-css-once
```

### 4\. 启动应用

#### 分别启动前后端服务

**启动后端服务器：**
```bash
# 在项目根目录
python main.py
# 或使用 uvicorn
uvicorn main:socket_app --host 0.0.0.0 --port 8000 --reload
```

**启动前端开发服务器：**
```bash
# 在 frontend 目录
cd frontend

# 本地访问
npm start

# 局域网访问（允许其他设备访问）
npm run start:network
```

### 5\. 访问应用

- **前端应用**：`http://localhost:3000`
- **API文档**：`http://localhost:8000/docs` (Swagger UI)
- **备用API文档**：`http://localhost:8000/redoc` (ReDoc)
- **局域网访问**：`http://[服务器IP]:3000`（例如：`http://192.168.1.100:3000`）

## 🌐 局域网访问配置

### 自动配置（推荐）

应用已支持自动检测服务器地址：

1. **启动后端服务器**：
   ```bash
   python main.py
   ```
   后端会自动绑定到 `0.0.0.0:8000`，支持局域网访问。

2. **启动前端服务器（支持局域网访问）**：
   ```bash
   cd frontend
   npm run start:network
   ```

3. **从局域网设备访问**：
   - 获取服务器IP地址（如 `192.168.1.100`）
   - 在其他设备上访问：`http://192.168.1.100:3000`
   - 前端会自动检测并使用 `http://192.168.1.100:8000` 作为API地址

### 手动配置

如果需要手动指定服务器地址，可以创建环境变量文件：

1. **创建前端环境配置**：
   ```bash
   # 在 frontend 目录下创建 .env 文件
   cd frontend
   cat > .env << EOF
   # 替换为实际的服务器IP地址
   REACT_APP_API_URL=http://192.168.1.100:8000
   REACT_APP_SOCKET_URL=http://192.168.1.100:8000
   EOF
   ```

2. **重启前端服务器**：
   ```bash
   npm start
   ```

### 获取服务器IP地址

```bash
# Linux/macOS
ip addr show | grep inet
# 或
ifconfig | grep inet

# Windows
ipconfig
```

## 📱 使用说明

### 用户注册和登录

1. **访问应用**：打开浏览器访问 `http://localhost:3000`
2. **注册账户**：
   - 点击"注册"按钮
   - 填写用户名、邮箱和密码
   - 密码至少6位字符
   - 点击"注册"完成账户创建
3. **登录**：
   - 输入用户名和密码
   - 可选择"记住我"保持登录状态
   - 点击"登录"进入聊天界面

### 聊天功能

#### 加入聊天室

1. **查看聊天室列表**：登录后会显示可用的聊天室
2. **加入公共聊天室**：点击聊天室卡片进入
3. **加入私密聊天室**：点击私密聊天室卡片，输入正确密码后进入
4. **查看在线用户**：右侧显示当前在线的用户列表

#### 发送消息

1. **文本消息**：在底部输入框输入文本，按Enter发送
2. **表情符号**：点击😊按钮选择表情
3. **文件上传**：点击📎按钮上传图片或文档文件
4. **正在输入提示**：输入时其他用户会看到"正在输入..."提示

#### 创建聊天室

1. **点击"创建房间"按钮**
2. **填写房间信息**：
   - 房间名称（必填）
   - 房间描述（可选）
   - 选择房间类型（公开/私密）
   - 私密房间需设置密码
3. **点击"创建"完成**

### 高级功能

#### 私密房间

- **创建私密房间**：在创建房间时选择"私密"类型并设置密码
- **加入私密房间**：需要输入正确的房间密码
- **密码保护**：只有知道密码的用户才能加入和查看消息
- **安全性**：密码使用哈希加密存储，确保安全

#### 文件上传

- **支持格式**：图片文件（JPG、PNG、GIF等）和文档文件
- **大小限制**：图片最大10MB，其他文件最大50MB
- **安全上传**：文件上传到服务器安全目录
- **预览功能**：图片文件支持在聊天中直接预览

#### 消息历史

- **自动加载**：进入聊天室时自动加载最近50条消息
- **历史加载**：向上滚动可加载更多历史消息
- **智能滚动**：新消息到达时自动滚动到底部

#### 桌面通知

- **启用通知**：首次访问时浏览器会请求通知权限
- **后台提醒**：当浏览器标签页不在前台时，新消息会触发桌面通知
- **点击通知**：点击通知可快速回到聊天界面

#### 在线状态

- **实时更新**：用户上线/下线状态实时显示
- **在线指示器**：用户头像旁的绿点表示在线状态
- **用户计数**：显示当前聊天室的在线用户数量

## 🔧 故障排除

### 常见问题

#### 1. 无法连接到后端服务器

**症状**：前端显示连接错误，API请求失败

**解决方案**：
- 检查后端服务器是否正在运行：`ps aux | grep run.py`
- 确认端口5000未被占用：`netstat -tlnp | grep :5000`
- 检查防火墙设置，确保5000端口开放
- 查看后端日志输出是否有错误信息

#### 2. Socket.IO连接失败

**症状**：实时消息功能不工作，控制台显示WebSocket错误

**解决方案**：
- 检查浏览器控制台的详细错误信息
- 确认Socket.IO服务器正在运行
- 检查CORS配置是否正确
- 尝试刷新页面重新建立连接

#### 3. 局域网设备无法访问

**症状**：其他设备无法访问聊天应用

**解决方案**：
- 确认前端服务器使用 `npm run start:network` 启动
- 检查服务器IP地址是否正确
- 确认防火墙允许3000和8000端口的入站连接
- 验证设备间网络连通性：`ping [服务器IP]`

#### 4. 前端样式不显示

**症状**：页面布局混乱，样式缺失

**解决方案**：
- 重新构建CSS：`npm run build-css-once`
- 清除浏览器缓存
- 检查TailwindCSS配置是否正确
- 确认所有前端依赖已正确安装
- 验证 shadcn/ui 组件是否正确导入

#### 5. 数据库相关错误

**症状**：用户注册/登录失败，数据保存错误

**解决方案**：
- 重新初始化数据库：`python init_db.py`
- 检查数据库文件权限
- 查看后端日志中的详细错误信息
- 确认SQLite数据库文件路径正确

#### 6. 文件上传失败

**症状**：文件上传时出现错误

**解决方案**：
- 检查文件大小是否超过限制（图片10MB，其他文件50MB）
- 确认uploads目录存在且有写入权限
- 检查网络连接是否稳定
- 查看浏览器控制台的详细错误信息

#### 7. 私密房间无法加入

**症状**：输入密码后仍无法加入私密房间

**解决方案**：
- 确认密码输入正确（区分大小写）
- 检查房间是否确实设置了密码
- 尝试刷新页面后重新加入
- 联系房间创建者确认密码

### 调试模式

#### 启用详细日志

1. **后端调试**：
   ```bash
   export DEBUG=true
   export LOG_LEVEL=DEBUG
   python main.py
   ```

2. **前端调试**：
   - 打开浏览器开发者工具（F12）
   - 查看Console标签页的日志输出
   - 检查Network标签页的请求状态

#### 验证配置

1. **检查API连接**：
   ```bash
   curl -X GET http://localhost:8000/api/auth/me
   ```

2. **检查Socket.IO连接**：
   ```bash
   curl -X GET "http://localhost:8000/socket.io/?EIO=4&transport=polling"
   ```

3. **查看API文档**：
   ```bash
   # 在浏览器中访问
   http://localhost:8000/docs
   ```

3. **验证前端配置**：
   - 打开浏览器控制台
   - 查看 "API Base URL" 和 "Socket URL" 的输出

### 性能优化

#### 生产环境部署

1. **构建前端**：
   ```bash
   cd frontend
   npm run build
   ```

2. **配置环境变量**：
   ```bash
   export DEBUG=false
   export SECRET_KEY=your-secret-key
   export DATABASE_URL=your-database-url
   ```

3. **使用生产服务器**：
   ```bash
   # 使用 Uvicorn
   uvicorn main:socket_app --host 0.0.0.0 --port 8000 --workers 4
   ```

#### 数据库优化

- **迁移到PostgreSQL**：用于生产环境
- **添加数据库索引**：优化查询性能
- **定期备份**：确保数据安全

## 🔒 安全注意事项

### 开发环境

- 默认配置仅适用于开发环境
- 不要在生产环境中使用默认的SECRET_KEY
- 局域网访问功能仅在开发环境中启用

### 生产环境

- 使用HTTPS协议
- 配置强密码策略
- 限制CORS允许的来源
- 启用日志记录和监控
- 定期更新依赖包
- 配置文件上传安全策略
- 限制文件上传大小和类型

### 私密房间安全

- 密码使用bcrypt哈希加密存储
- 支持强密码策略
- 定期更换房间密码
- 限制密码尝试次数（建议实现）

## 📊 监控和日志

### 日志文件位置

- **应用日志**：`logs/app.log`
- **错误日志**：控制台输出
- **访问日志**：包含在应用日志中

### 监控指标

- **连接数**：当前WebSocket连接数量
- **消息量**：每分钟消息发送数量
- **用户活跃度**：在线用户数量变化
- **错误率**：API请求失败率
- **文件上传量**：文件上传成功率和大小统计

## 📁 项目结构

项目采用现代化的FastAPI模块结构，保持代码的整洁和高可维护性。

```
chatroom/
├── app/                      # FastAPI应用核心代码
│   ├── __init__.py           # 应用初始化
│   ├── config.py             # 配置管理
│   ├── database.py           # 数据库连接
│   ├── models.py             # SQLAlchemy 数据库模型
│   ├── schemas/              # Pydantic模式定义
│   │   ├── __init__.py
│   │   ├── user.py           # 用户模式
│   │   ├── room.py           # 房间模式
│   │   └── message.py        # 消息模式
│   ├── api/                  # API路由
│   │   ├── __init__.py
│   │   ├── auth.py           # 认证API
│   │   ├── rooms.py          # 房间API
│   │   ├── messages.py       # 消息API
│   │   └── upload.py         # 文件上传API
│   ├── core/                 # 核心功能
│   │   ├── __init__.py
│   │   ├── security.py       # 安全相关（JWT等）
│   │   └── deps.py           # 依赖注入
│   └── socket/               # Socket.IO事件处理
│       ├── __init__.py
│       └── events.py         # Socket事件处理器
├── frontend/                 # React前端应用
│   ├── public/               # 静态资源
│   ├── src/                  # 源代码
│   │   ├── components/       # React组件
│   │   │   ├── auth/         # 认证相关组件
│   │   │   ├── chat/         # 聊天相关组件
│   │   │   │   ├── ChatRoom.tsx      # 聊天室主界面
│   │   │   │   ├── MessageList.tsx   # 消息列表
│   │   │   │   ├── MessageInput.tsx  # 消息输入框
│   │   │   │   ├── RoomList.tsx      # 房间列表
│   │   │   │   └── FileUpload.tsx    # 文件上传组件
│   │   │   ├── ui/           # UI基础组件
│   │   │   │   └── PasswordPrompt.tsx # 密码输入弹窗
│   │   │   └── call/         # 通话相关组件（预留）
│   │   ├── contexts/         # React上下文
│   │   │   ├── AuthContext.tsx
│   │   │   └── ChatContext.tsx
│   │   ├── pages/            # 页面组件
│   │   ├── services/         # API和Socket服务
│   │   │   ├── api.ts        # HTTP API服务
│   │   │   └── socket.ts     # Socket.IO客户端
│   │   └── types/            # TypeScript类型定义
│   ├── package.json          # 前端依赖配置
│   └── README.md             # 前端文档
├── instance/                 # 实例文件夹
│   └── chatroom.db          # SQLite数据库文件
├── uploads/                  # 文件上传目录
├── logs/                     # 日志文件夹
│   └── app.log              # 应用日志
├── main.py                   # FastAPI应用启动脚本
├── init_db.py               # 数据库初始化脚本
├── pyproject.toml            # 项目定义和依赖管理
├── FASTAPI_MIGRATION.md      # FastAPI迁移文档
├── FRONTEND_MIGRATION_SUMMARY.md # 前端迁移总结
└── README.md                 # 项目文档
```

## 🔌 Socket.IO 核心事件

客户端与服务器之间的通信通过以下核心事件完成：

### 连接管理事件

| 事件名称 | 方向 | 描述 | 数据格式 |
|---------|------|------|----------|
| `connect` | `S <-> C` | 客户端与服务器成功建立连接 | - |
| `disconnect` | `S <-> C` | 客户端断开连接 | `{ reason: string }` |

### 房间管理事件

| 事件名称 | 方向 | 描述 | 数据格式 |
|---------|------|------|----------|
| `join_room` | `C -> S` | 客户端请求加入聊天室 | `{ room_id: number, password?: string }` |
| `leave_room` | `C -> S` | 客户端请求离开聊天室 | `{ room_id: number }` |
| `room_joined` | `S -> C` | 服务器确认用户已加入房间 | `{ room_id: number, room_name: string, member_count: number, online_members: User[] }` |
| `user_joined` | `S -> C` | 通知有用户加入房间 | `{ user_id: number, username: string, room_id: number }` |
| `user_left` | `S -> C` | 通知有用户离开房间 | `{ user_id: number, username: string, room_id: number }` |

### 消息事件

| 事件名称 | 方向 | 描述 | 数据格式 |
|---------|------|------|----------|
| `send_message` | `C -> S` | 客户端发送消息到指定房间 | `{ room_id: number, content: string, message_type?: string }` |
| `new_message` | `S -> C` | 服务器向房间内所有客户端广播新消息 | `Message对象` |

### 输入状态事件

| 事件名称 | 方向 | 描述 | 数据格式 |
|---------|------|------|----------|
| `typing_start` | `C -> S` | 客户端开始输入 | `{ room_id: number }` |
| `typing_stop` | `C -> S` | 客户端停止输入 | `{ room_id: number }` |
| `typing_update` | `S -> C` | 服务器广播房间内正在输入的用户列表 | `{ room_id: number, typing_users: string[] }` |

### 用户状态事件

| 事件名称 | 方向 | 描述 | 数据格式 |
|---------|------|------|----------|
| `user_status_update` | `S -> C` | 用户在线状态更新 | `{ user_id: number, username: string, is_online: boolean }` |
| `online_users_update` | `S -> C` | 在线用户列表更新 | `{ room_id?: number, online_users: User[] }` |

### 错误处理事件

| 事件名称 | 方向 | 描述 | 数据格式 |
|---------|------|------|----------|
| `error` | `S -> C` | 服务器错误通知 | `{ message: string }` |

### 数据类型定义

```typescript
interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  is_online: boolean;
  created_at: string;
  last_seen: string;
  real_name?: string;
  bio?: string;
}

interface Message {
  id: number;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  timestamp: string;
  user_id: number;
  room_id: number;
  username: string;
  avatar_url?: string;
  edited_at?: string;
  is_deleted: boolean;
}

interface ChatRoom {
  id: number;
  name: string;
  description?: string;
  is_private: boolean;
  created_at: string;
  created_by: number;
  member_count: number;
  online_count: number;
}
```

## 🔄 API 接口文档

### 认证接口

#### POST /api/auth/login
用户登录

**请求体：** `application/x-www-form-urlencoded`
```
username=string
password=string
```

**响应：**
```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

#### POST /api/auth/register
用户注册

**请求体：**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "password2": "string"
}
```

#### GET /api/auth/me
获取当前用户信息

**请求头：**
```
Authorization: Bearer {access_token}
```

**响应：**
```json
{
  "id": "number",
  "username": "string",
  "email": "string",
  "avatar_url": "string",
  "is_online": "boolean",
  "created_at": "string",
  "last_seen": "string"
}
```

#### POST /api/auth/logout
用户登出

**请求头：**
```
Authorization: Bearer {access_token}
```

**响应：**
```json
{
  "message": "成功登出"
}
```

### 聊天接口

#### GET /api/rooms/
获取聊天室列表

**请求头：**
```
Authorization: Bearer {access_token}
```

**响应：**
```json
{
  "user_rooms": "ChatRoom[]",
  "available_rooms": "ChatRoom[]"
}
```

#### GET /api/rooms/{id}
获取聊天室详情

**请求头：**
```
Authorization: Bearer {access_token}
```

**响应：**
```json
{
  "id": "number",
  "name": "string",
  "description": "string",
  "is_private": "boolean",
  "created_at": "string",
  "created_by": "number",
  "member_count": "number"
}
```

#### POST /api/rooms/
创建聊天室

**请求头：**
```
Authorization: Bearer {access_token}
```

**请求体：**
```json
{
  "name": "string",
  "description": "string",
  "is_private": "boolean",
  "password": "string"
}
```

#### POST /api/rooms/{id}/join
加入聊天室（支持私密房间密码验证）

**请求头：**
```
Authorization: Bearer {access_token}
```

**请求体：**
```json
{
  "password": "string"
}
```

#### POST /api/rooms/{id}/leave
离开聊天室

**请求头：**
```
Authorization: Bearer {access_token}
```

#### GET /api/messages/{room_id}
获取聊天室消息

**请求头：**
```
Authorization: Bearer {access_token}
```

**查询参数：**
- `skip`: 跳过数量（默认0）
- `limit`: 限制数量（默认50）

**响应：**
```json
{
  "messages": "Message[]"
}
```

### 文件上传接口

#### POST /api/upload/
上传聊天文件

**请求头：**
```
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

**请求体：** FormData
- `file`: 文件对象

**响应：**
```json
{
  "filename": "string",
  "file_path": "string",
  "file_size": "number",
  "content_type": "string"
}
```

## 🗺️ 未来计划 (Roadmap)

  * [ ] **私聊功能**: 实现用户之间的一对一私密聊天。
  * [ ] **端到端加密 (E2EE)**: 为敏感通信增加一层额外的安全保障。
  * [ ] **音视频通话**: 集成 WebRTC 实现实时音视频聊天。
  * [ ] **管理员后台**: 用于用户管理、内容审核和系统监控。
  * [ ] **数据库迁移**: 从 SQLite 迁移到 PostgreSQL 以支持生产环境。
  * [ ] **容器化**: 提供 Dockerfile 和 Docker Compose 配置，简化部署。
  * [ ] **消息搜索**: 实现聊天记录的全文搜索功能。
  * [ ] **用户资料**: 完善用户个人资料和头像上传功能。
  * [ ] **房间管理**: 房间管理员功能，包括踢人、禁言等。
  * [ ] **消息撤回**: 支持消息撤回和编辑功能。

## 🤝 贡献

欢迎任何形式的贡献！无论是提交 Issue、发起 Pull Request，还是改进文档，我们都非常欢迎。

1.  Fork 本仓库
2.  创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3.  提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4.  推送到分支 (`git push origin feature/AmazingFeature`)
5.  打开一个 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户。特别感谢以下开源项目：

- [FastAPI](https://fastapi.tiangolo.com/) - 现代高性能Python Web框架
- [React](https://reactjs.org/) - 用户界面构建库
- [Socket.IO](https://socket.io/) - 实时通信库
- [SQLAlchemy](https://www.sqlalchemy.org/) - Python SQL工具包和ORM
- [TailwindCSS](https://tailwindcss.com/) - 实用优先的CSS框架
- [shadcn/ui](https://ui.shadcn.com/) - 现代化UI组件库