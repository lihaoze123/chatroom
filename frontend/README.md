# 聊天室前端

这是一个基于 React + TypeScript + TailwindCSS 构建的现代化聊天室前端应用。

## 技术栈

- **React 18** - 用户界面库
- **TypeScript** - 类型安全的JavaScript
- **TailwindCSS** - 实用优先的CSS框架
- **Socket.IO Client** - 实时通信
- **Axios** - HTTP客户端
- **React Router** - 路由管理
- **React Hot Toast** - 通知组件
- **Lucide React** - 图标库
- **date-fns** - 日期处理

## 功能特性

### 🔐 用户认证
- 用户注册和登录
- 密码强度验证
- 记住登录状态
- 自动身份验证

### 💬 实时聊天
- 实时消息发送和接收
- 多聊天室支持
- 正在输入指示器
- 消息历史记录
- 表情符号支持

### 🎨 现代化UI
- 响应式设计
- 深色/浅色主题
- 流畅的动画效果
- 直观的用户界面
- 移动端友好

### 🚀 高级功能
- 在线用户列表
- 聊天室创建和管理
- 消息时间戳
- 连接状态指示
- 桌面通知

## 快速开始

### 环境要求

- Node.js 16+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 环境配置

创建 `.env` 文件：

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 启动开发服务器

```bash
npm start
```

应用将在 `http://localhost:3000` 启动。

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
frontend/
├── public/                 # 静态资源
├── src/
│   ├── components/         # React组件
│   │   ├── auth/          # 认证相关组件
│   │   └── chat/          # 聊天相关组件
│   ├── contexts/          # React上下文
│   ├── pages/             # 页面组件
│   ├── services/          # API和Socket服务
│   ├── types/             # TypeScript类型定义
│   ├── App.tsx            # 主应用组件
│   └── index.tsx          # 应用入口
├── tailwind.config.js     # TailwindCSS配置
└── package.json           # 项目配置
```

## 主要组件

### 认证组件
- `LoginForm` - 登录表单
- `RegisterForm` - 注册表单
- `ProtectedRoute` - 路由保护

### 聊天组件
- `ChatPage` - 主聊天页面
- `RoomList` - 聊天室列表
- `ChatRoom` - 聊天室界面
- `MessageList` - 消息列表
- `MessageInput` - 消息输入框

### 上下文管理
- `AuthContext` - 用户认证状态管理
- `ChatContext` - 聊天状态管理

## API集成

前端通过以下API与后端通信：

### 认证API
- `GET /api/auth/profile` - 获取用户信息
- `POST /auth/login` - 用户登录
- `POST /auth/register` - 用户注册
- `GET /auth/logout` - 用户登出

### 聊天API
- `GET /api/chat/rooms` - 获取聊天室列表
- `GET /api/chat/rooms/:id` - 获取聊天室详情
- `POST /api/chat/rooms` - 创建聊天室
- `POST /api/chat/rooms/:id/join` - 加入聊天室
- `POST /api/chat/rooms/:id/leave` - 离开聊天室
- `GET /api/chat/rooms/:id/messages` - 获取消息历史

## Socket.IO事件

### 客户端发送
- `join_room` - 加入房间
- `leave_room` - 离开房间
- `send_message` - 发送消息
- `typing` - 输入状态

### 服务端推送
- `new_message` - 新消息
- `user_joined` - 用户加入
- `user_left` - 用户离开
- `user_typing` - 用户输入状态
- `user_connected` - 用户上线
- `user_disconnected` - 用户下线

## 开发指南

### 添加新组件

1. 在 `src/components/` 下创建组件文件
2. 使用TypeScript定义props接口
3. 应用TailwindCSS样式
4. 导出组件

### 状态管理

使用React Context进行全局状态管理：

```typescript
// 使用认证上下文
const { user, login, logout } = useAuth();

// 使用聊天上下文
const { messages, sendMessage, joinRoom } = useChat();
```

### 样式指南

使用TailwindCSS实用类：

```jsx
<div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
  <h1 className="text-lg font-semibold text-gray-900">标题</h1>
</div>
```

## 部署

### 构建应用

```bash
npm run build
```

### 部署到静态服务器

将 `build/` 目录部署到任何静态文件服务器，如：

- Nginx
- Apache
- Vercel
- Netlify
- GitHub Pages

### 环境变量

生产环境需要设置正确的API地址：

```env
REACT_APP_API_URL=https://your-api-domain.com
REACT_APP_SOCKET_URL=https://your-api-domain.com
```

## 故障排除

### 常见问题

1. **无法连接到后端**
   - 检查 `.env` 文件中的API地址
   - 确保后端服务器正在运行
   - 检查CORS配置

2. **Socket连接失败**
   - 检查Socket.IO服务器地址
   - 确认防火墙设置
   - 检查网络连接

3. **样式不生效**
   - 确认TailwindCSS配置正确
   - 检查CSS导入顺序
   - 清除浏览器缓存

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 许可证

MIT License
