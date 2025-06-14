# 多阶段构建 Dockerfile
# 阶段1: 构建前端
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# 复制前端依赖文件
COPY frontend/package*.json ./

# 安装前端依赖
RUN npm ci --only=production

# 复制前端源码
COPY frontend/ ./

# 构建前端
RUN npm run build

# 阶段2: 构建后端
FROM python:3.13-slim AS backend

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 安装 uv 包管理器
RUN pip install uv

# 复制项目配置文件
COPY pyproject.toml uv.lock ./

# 安装 Python 依赖
RUN uv sync --frozen

# 复制后端源码
COPY app/ ./app/
COPY main.py run.py config.py ./
COPY scripts/ ./scripts/

# 从前端构建阶段复制构建产物
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# 创建必要的目录并设置权限
RUN mkdir -p instance logs uploads/avatars uploads/images uploads/documents uploads/audio uploads/video uploads/files && \
    chmod +x scripts/healthcheck.sh

# 设置环境变量
ENV PYTHONPATH=/app
ENV HOST=0.0.0.0
ENV PORT=8000

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uv", "run", "python", "main.py"] 