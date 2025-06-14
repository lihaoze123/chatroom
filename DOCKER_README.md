# Docker 部署指南

本项目支持使用 Docker 和 Docker Compose 进行部署，提供 SQLite 和 PostgreSQL 两种数据库选项。

## 快速开始

### 1. 使用 SQLite 数据库（推荐用于开发和小规模部署）

```bash
# 克隆项目
git clone <your-repo-url>
cd chatroom

# 构建并启动 SQLite 版本
docker-compose --profile sqlite up -d

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

应用将在 http://localhost:8000 上运行，使用 PostgreSQL 数据库。

## 部署模式说明

项目现在使用 Docker Compose profiles 来管理不同的部署模式，避免端口冲突：

- **SQLite 模式** (`--profile sqlite`): 使用 SQLite 数据库，适合开发和小规模部署
- **PostgreSQL 模式** (`--profile postgres`): 使用 PostgreSQL 数据库，适合生产环境

**重要**: 两种模式不能同时运行，因为它们都使用 8000 端口。

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
- `./instance`: SQLite 数据库文件（仅 SQLite 模式）
- `./uploads`: 用户上传的文件
- `./logs`: 应用日志

### 端口映射

- `8000`: 应用主端口
- `5432`: PostgreSQL 端口（仅在使用 PostgreSQL 时）

## 常用命令

### 查看服务状态
```bash
# SQLite 模式
docker-compose --profile sqlite ps

# PostgreSQL 模式
docker-compose --profile postgres ps
```

### 查看日志
```bash
# SQLite 模式
docker-compose logs chatroom
docker-compose logs -f chatroom  # 实时查看

# PostgreSQL 模式
docker-compose logs chatroom-postgres
docker-compose logs -f chatroom-postgres  # 实时查看
```

### 重启服务
```bash
# SQLite 模式
docker-compose --profile sqlite restart

# PostgreSQL 模式
docker-compose --profile postgres restart
```

### 停止服务
```bash
# 停止所有服务
docker-compose down

# 停止服务并删除 volumes（注意：会删除数据！）
docker-compose down -v
```

### 更新应用
```bash
# 重新构建镜像
docker-compose build --no-cache

# 重新启动服务
# SQLite 模式
docker-compose --profile sqlite up -d

# PostgreSQL 模式
docker-compose --profile postgres up -d
```

### 切换数据库模式
```bash
# 从 SQLite 切换到 PostgreSQL
docker-compose --profile sqlite down
docker-compose --profile postgres up -d

# 从 PostgreSQL 切换到 SQLite
docker-compose --profile postgres down
docker-compose --profile sqlite up -d
```

## 健康检查

应用包含健康检查功能：
- 健康检查脚本: `/app/scripts/healthcheck.sh`
- 检查间隔: 30秒
- 超时时间: 10秒
- 重试次数: 3次
- 启动等待时间: 40秒

## 故障排除

### 1. 端口冲突
如果遇到端口冲突错误：
```bash
# 确保停止所有服务
docker-compose down --remove-orphans

# 检查端口占用
sudo netstat -tlnp | grep :8000
sudo lsof -i :8000

# 如果有进程占用，杀死进程
sudo kill -9 <进程ID>
```

### 2. 服务冲突
如果同时启动了多个 profile：
```bash
# 完全停止所有服务
docker-compose down --remove-orphans

# 只启动需要的 profile
docker-compose --profile sqlite up -d
# 或
docker-compose --profile postgres up -d
```

### 3. 权限问题
确保 Docker 有权限访问项目目录：
```bash
sudo chown -R $USER:$USER .
```

### 4. 数据库连接问题
检查数据库服务是否正常启动：
```bash
# PostgreSQL 模式
docker-compose logs postgres
docker-compose exec postgres pg_isready -U chatroom
```

### 5. 前端资源加载问题
确保前端已正确构建：
```bash
# 重新构建镜像（无缓存）
docker-compose build --no-cache
```

## 监控和日志

### 查看容器资源使用情况
```bash
docker stats
```

### 进入容器调试
```bash
# 进入应用容器 (SQLite 模式)
docker-compose exec chatroom bash

# 进入应用容器 (PostgreSQL 模式)
docker-compose exec chatroom-postgres bash

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
docker-compose exec postgres pg_dump -U chatroom chatroom > backup_$(date +%Y%m%d_%H%M%S).sql

# 备份 SQLite 数据
cp ./instance/chatroom.db ./backup_$(date +%Y%m%d_%H%M%S).db

# 备份上传文件
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz ./uploads
```

### 恢复数据
```bash
# 恢复 PostgreSQL 数据
docker-compose exec -T postgres psql -U chatroom chatroom < backup.sql

# 恢复 SQLite 数据
cp backup.db ./instance/chatroom.db

# 恢复上传文件
tar -xzf uploads_backup.tar.gz
```

## 快速命令参考

```bash
# 开发环境 (SQLite)
docker-compose --profile sqlite up -d

# 生产环境 (PostgreSQL)
docker-compose --profile postgres up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 完全清理
docker-compose down -v
docker system prune -f
``` 