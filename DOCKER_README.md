# Docker 部署指南

## 快速开始

### 1. 使用 SQLite 数据库（推荐用于开发和小规模部署）

```bash
# 克隆项目
git clone <your-repo-url>
cd chatroom

# 构建并启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f chatroom
```

应用将在 http://localhost:8000 上运行。

### 2. 使用 PostgreSQL 数据库（推荐用于生产环境）

```bash
# 启动 PostgreSQL 配置
docker-compose --profile postgres up -d

# 查看日志
docker-compose logs -f chatroom-postgres
```

## 生产环境部署

### 1. 创建环境变量文件

创建 `.env` 文件：

```bash
# 应用配置
DEBUG=false
HOST=0.0.0.0
PORT=8000

# 安全配置 - 请务必修改这些值！
SECRET_KEY=your-very-secure-secret-key-change-this-in-production
POSTGRES_PASSWORD=your-secure-database-password

# 数据库配置
DATABASE_URL=postgresql://chatroom:your-secure-database-password@postgres:5432/chatroom

# 日志配置
LOG_LEVEL=WARNING
LOG_FILE=logs/app.log

# CORS 配置 - 修改为你的实际域名
CORS_ORIGINS=["https://yourdomain.com", "https://www.yourdomain.com"]
```

### 2. 使用生产环境配置

```bash
# 使用生产环境配置启动
docker-compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

## 配置说明

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `DEBUG` | `false` | 调试模式 |
| `HOST` | `0.0.0.0` | 监听地址 |
| `PORT` | `8000` | 监听端口 |
| `SECRET_KEY` | - | JWT 密钥（生产环境必须修改） |
| `DATABASE_URL` | `sqlite:///./instance/chatroom.db` | 数据库连接字符串 |
| `LOG_LEVEL` | `INFO` | 日志级别 |
| `POSTGRES_PASSWORD` | - | PostgreSQL 密码 |

### 数据持久化

项目使用 Docker volumes 来持久化数据：

- `postgres_data`: PostgreSQL 数据
- `chatroom_uploads`: 用户上传的文件
- `chatroom_logs`: 应用日志
- `./instance`: SQLite 数据库文件（仅 SQLite 模式）

### 端口映射

- `8000`: 应用主端口
- `5432`: PostgreSQL 端口（仅在使用 PostgreSQL 时）

## 常用命令

### 查看服务状态
```bash
docker-compose ps
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs chatroom

# 实时查看日志
docker-compose logs -f chatroom
```

### 重启服务
```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart chatroom
```

### 停止服务
```bash
# 停止服务
docker-compose down

# 停止服务并删除 volumes（注意：会删除数据！）
docker-compose down -v
```

### 更新应用
```bash
# 重新构建镜像
docker-compose build

# 重新启动服务
docker-compose up -d
```

## 健康检查

应用包含健康检查端点：
- 健康检查 URL: `http://localhost:8000/api/docs`
- 检查间隔: 30秒
- 超时时间: 10秒
- 重试次数: 3次

## 故障排除

### 1. 端口冲突
如果 8000 端口被占用，可以修改 `docker-compose.yml` 中的端口映射：
```yaml
ports:
  - "8080:8000"  # 使用 8080 端口
```

### 2. 权限问题
确保 Docker 有权限访问项目目录：
```bash
sudo chown -R $USER:$USER .
```

### 3. 数据库连接问题
检查数据库服务是否正常启动：
```bash
docker-compose logs postgres
```

### 4. 前端资源加载问题
确保前端已正确构建：
```bash
# 重新构建镜像
docker-compose build --no-cache
```

## 监控和日志

### 查看容器资源使用情况
```bash
docker stats
```

### 进入容器调试
```bash
# 进入应用容器
docker-compose exec chatroom bash

# 进入数据库容器
docker-compose exec postgres psql -U chatroom -d chatroom
```

## 安全建议

1. **修改默认密码**: 务必修改 `SECRET_KEY` 和 `POSTGRES_PASSWORD`
2. **使用 HTTPS**: 生产环境建议配置 SSL/TLS
3. **限制访问**: 配置防火墙规则，只开放必要端口
4. **定期备份**: 定期备份数据库和上传文件
5. **更新镜像**: 定期更新基础镜像以获取安全补丁

## 备份和恢复

### 备份数据
```bash
# 备份 PostgreSQL 数据
docker-compose exec postgres pg_dump -U chatroom chatroom > backup.sql

# 备份上传文件
docker cp $(docker-compose ps -q chatroom):/app/uploads ./uploads_backup
```

### 恢复数据
```bash
# 恢复 PostgreSQL 数据
docker-compose exec -T postgres psql -U chatroom chatroom < backup.sql

# 恢复上传文件
docker cp ./uploads_backup $(docker-compose ps -q chatroom):/app/uploads
``` 