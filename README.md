# 实时 Web 聊天应用

一个基于 **Flask** 和 **WebSocket (Flask-SocketIO)** 构建的现代实时 Web 聊天应用。

## 技术栈

- [Python](https://www.python.org/)
- [Flask](https://flask.palletsprojects.com/)
- [Flask-SocketIO](https://flask-socketio.readthedocs.io/en/latest/)
- [Flask-SQLAlchemy](https://flask-sqlalchemy.palletsprojects.com/)
- [Flask-Login](https://flask-login.readthedocs.io/en/latest/)

## 📖 项目简介

本项目旨在构建一个基于 Web 的实时聊天平台，允许用户注册、登录，并在公共聊天室中与其他在线用户进行实时交流。消息发送后将即时显示在所有用户的屏幕上，无需刷新页面。项目采用模块化设计，易于扩展和维护。

## ✨ 主要功能

  * ✅ **用户认证**: 安全的注册、登录和登出功能。
  * ✅ **实时消息**: 基于 WebSocket 的多用户实时文本通信。
  * ✅ **房间/群聊**: 支持加入和离开不同的聊天室。
  * ✅ **在线状态**: 实时显示用户的在线状态。
  * ✅ **正在输入提示**: 当对方正在输入时，会显示提示信息。
  * ✅ **消息历史加载**: 通过向上滚动方式高效加载历史消息。
  * ✅ **富媒体支持**: 支持发送表情符号，并规划了安全的文件/图片上传接口。
  * ✅ **浏览器通知**: 当应用在后台时，通过浏览器桌面通知提醒新消息。

## 🛠️ 技术栈

### 后端
  * **Flask** - Web框架
  * **Flask-SocketIO** - WebSocket支持
  * **Flask-SQLAlchemy** - ORM数据库操作
  * **Flask-Login** - 用户认证
  * **Flask-CORS** - 跨域资源共享
  * **SQLite** - 数据库
  * **Eventlet** - 异步服务器

### 前端
  * **React 18** - 用户界面库
  * **TypeScript** - 类型安全的JavaScript
  * **TailwindCSS** - 实用优先的CSS框架
  * **Socket.IO Client** - 实时通信
  * **Axios** - HTTP客户端
  * **React Router** - 路由管理
  * **React Hot Toast** - 通知组件

### 工具链
  * **uv** - Python包管理
  * **npm** - Node.js包管理

## 🚀 快速开始

请确保您的系统已安装 [Python](https://www.python.org/) 和 [uv](https://github.com/astral-sh/uv)。

### 1\. 克隆仓库

```bash
git clone https://github.com/lihaoze123/chatroom.git
cd chatroom
```

### 2\. 创建并激活虚拟环境

`uv` 会在当前目录下创建一个名为 `.venv` 的虚拟环境。

```bash
# 创建虚拟环境
uv venv

# 激活环境 (macOS/Linux)
source .venv/bin/activate

# 激活环境 (Windows)
.venv\Scripts\activate
```

### 3\. 安装依赖

`uv` 会读取 `pyproject.toml` 文件并以极快的速度安装所有必需的依赖。

```bash
uv sync
```

### 4\. 运行应用

#### 方式一：使用启动脚本（推荐）

```bash
./start.sh
```

这将同时启动前端和后端服务器。

#### 方式二：分别启动

**启动后端：**
```bash
uv run run.py
```

**启动前端：**
```bash
cd frontend
npm install  # 首次运行需要安装依赖
npm start
```

应用将在以下地址运行：
- 前端：`http://localhost:3000`
- 后端：`http://localhost:5000`

## 📁 项目结构

项目采用模块化的蓝图（Blueprint）结构，保持代码的整洁和高可维护性。

```
chatroom/
├── app/                      # 后端应用核心代码
│   ├── __init__.py           # 应用工厂和 Blueprint 注册
│   ├── api/                  # API Blueprint (为前端提供接口)
│   │   ├── __init__.py
│   │   ├── auth.py           # 认证API
│   │   └── chat.py           # 聊天API
│   ├── auth/                 # 认证 Blueprint (传统Web)
│   │   ├── __init__.py
│   │   ├── routes.py         # 认证相关的 HTTP 路由
│   │   └── forms.py          # 认证表单
│   ├── chat/                 # 聊天 Blueprint
│   │   ├── __init__.py
│   │   ├── routes.py         # 聊天室页面 HTTP 路由
│   │   └── events.py         # Socket.IO 事件处理
│   ├── main/                 # 主要应用 Blueprint
│   │   ├── __init__.py
│   │   └── routes.py         # 首页等主要页面路由
│   ├── models.py             # SQLAlchemy 数据库模型
│   ├── static/               # 静态文件 (CSS, JavaScript, Images)
│   └── templates/            # Jinja2 模板
├── frontend/                 # React前端应用
│   ├── public/               # 静态资源
│   ├── src/                  # 源代码
│   │   ├── components/       # React组件
│   │   ├── contexts/         # React上下文
│   │   ├── pages/            # 页面组件
│   │   ├── services/         # API和Socket服务
│   │   └── types/            # TypeScript类型定义
│   ├── package.json          # 前端依赖配置
│   └── README.md             # 前端文档
├── config.py                 # 应用配置
├── run.py                    # 应用启动脚本
├── start.sh                  # 一键启动脚本
├── pyproject.toml            # 项目定义和依赖管理
└── README.md                 # 项目文档
```

## 🔌 Socket.IO 核心事件

客户端与服务器之间的通信通过以下核心事件完成：

| 事件名称                 | 方向          | 描述                                 |
| ------------------------ | ------------- | ------------------------------------ |
| `connect`                | `S <-> C`     | 客户端与服务器成功建立连接。         |
| `disconnect`             | `S <-> C`     | 客户端断开连接。                     |
| `join_room`              | `C -> S`      | 客户端请求加入一个聊天室。           |
| `leave_room`             | `C -> S`      | 客户端请求离开一个聊天室。           |
| `send_message`           | `C -> S`      | 客户端发送一条消息到指定房间。       |
| `new_message`            | `S -> C`      | 服务器向房间内所有客户端广播新消息。 |
| `typing_start` / `_stop` | `C -> S`      | 客户端发送正在输入的状态。           |
| `typing_indicator_update`| `S -> C`      | 服务器广播房间内正在输入的用户列表。 |
| `user_joined` / `_left`  | `S -> C`      | 服务器通知有用户加入或离开房间。     |

## 🗺️ 未来计划 (Roadmap)

  * [ ] **私聊功能**: 实现用户之间的一对一私密聊天。
  * [ ] **端到端加密 (E2EE)**: 为敏感通信增加一层额外的安全保障。
  * [ ] **音视频通话**: 集成 WebRTC 实现实时音视频聊天。
  * [ ] **管理员后台**: 用于用户管理、内容审核和系统监控。
  * [ ] **数据库迁移**: 从 SQLite 迁移到 PostgreSQL 以支持生产环境。
  * [ ] **容器化**: 提供 Dockerfile 和 Docker Compose 配置，简化部署。

## 🤝 贡献

欢迎任何形式的贡献！无论是提交 Issue、发起 Pull Request，还是改进文档，我们都非常欢迎。

1.  Fork 本仓库
2.  创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3.  提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4.  推送到分支 (`git push origin feature/AmazingFeature`)
5.  打开一个 Pull Request