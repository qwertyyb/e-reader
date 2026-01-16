#!/bin/bash

# 测试 Docker 构建的脚本

set -e

echo "🧪 开始测试 Docker 多阶段构建..."

# 获取当前目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(dirname "$SCRIPT_DIR")"

# 进入服务器目录
cd "$SERVER_DIR"

IMAGE_NAME="e-reader-sync-server"
CONTAINER_NAME="e-reader-test"

# 清理之前的测试容器
echo "🧹 清理之前的测试容器..."
docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

# 构建镜像
echo "🔨 构建测试镜像..."
docker build --target runtime -t "$IMAGE_NAME:test" .

# 运行容器
echo "🚀 启动测试容器..."
docker run -d --name "$CONTAINER_NAME" -p 3001:3000 "$IMAGE_NAME:test"

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 测试健康检查
echo "🔍 测试健康检查端点..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ 健康检查通过！"
    
    # 显示容器信息
    echo "📊 容器信息:"
    docker ps | grep "$CONTAINER_NAME"
    
    # 显示镜像大小
    echo "📦 镜像大小:"
    docker images | grep "$IMAGE_NAME.*test"
    
    echo "🎉 测试成功完成！"
else
    echo "❌ 健康检查失败"
    echo "📝 容器日志:"
    docker logs "$CONTAINER_NAME"
    exit 1
fi

# 清理测试容器
echo "🧹 清理测试容器..."
docker rm -f "$CONTAINER_NAME"

echo "✨ 测试完成，容器已清理"