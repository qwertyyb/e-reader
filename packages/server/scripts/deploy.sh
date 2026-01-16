#!/bin/bash

# 部署脚本

set -e

# 获取当前目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 开始部署 e-reader 同步服务..."

# 进入服务器目录
cd "$SERVER_DIR"

# 停止现有容器（如果存在）
echo "🛑 停止现有容器..."
docker-compose down || true

# 构建新镜像
echo "🔨 构建新镜像..."
docker-compose build

# 启动服务
echo "▶️  启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ 服务启动成功！"
    echo "🌐 服务地址: http://localhost:3000"
    echo "💚 健康检查: http://localhost:3000/health"
else
    echo "❌ 服务启动失败，请检查日志:"
    docker-compose logs
    exit 1
fi

echo ""
echo "📊 查看运行状态:"
echo "  docker-compose ps"
echo ""
echo "📝 查看日志:"
echo "  docker-compose logs -f"