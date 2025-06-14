#!/bin/bash

# 健康检查脚本
# 检查应用是否正常运行

set -e

HOST=${HOST:-localhost}
PORT=${PORT:-8000}

# 检查 API 端点
if curl -f -s "http://${HOST}:${PORT}/api/docs" > /dev/null; then
    echo "✅ 应用健康检查通过"
    exit 0
else
    echo "❌ 应用健康检查失败"
    exit 1
fi 