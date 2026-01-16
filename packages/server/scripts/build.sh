#!/bin/bash

# 构建 Docker 镜像的脚本

set -e

# 获取当前目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(dirname "$SCRIPT_DIR")"

echo "📦 开始构建 e-reader 同步服务 Docker 镜像..."

# 进入服务器目录
cd "$SERVER_DIR"

# 构建镜像
IMAGE_NAME="e-reader-sync-server"
TAG=${1:-latest}
DOCKERFILE=${2:-Dockerfile}
PLATFORM=${3:-linux/amd64}

echo "🔨 构建镜像: $IMAGE_NAME:$TAG"
echo "📄 使用 Dockerfile: $DOCKERFILE"
echo "🏗️  目标平台: $PLATFORM"

# 检查是否需要创建 buildx builder
if ! docker-buildx ls | grep -q "multiarch"; then
    echo "🔧 创建多平台构建器..."
    docker-buildx create --name multiarch --use --bootstrap
fi

# 构建镜像（多平台构建）
docker-buildx build \
  --platform "$PLATFORM" \
  --target runtime \
  --tag "$IMAGE_NAME:$TAG" \
  --file "$DOCKERFILE" \
  --build-arg NODE_ENV=production \
  --load \
  .

echo "✅ 镜像构建完成: $IMAGE_NAME:$TAG"

# 显示镜像信息
echo "📋 镜像信息:"
docker images | grep "$IMAGE_NAME" | head -5

# 显示镜像大小对比
echo ""
echo "📊 镜像大小:"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep -E "(REPOSITORY|$IMAGE_NAME)"

# 显示镜像架构信息
echo ""
echo "🏗️  镜像架构信息:"
docker inspect "$IMAGE_NAME:$TAG" | grep -A 5 "Architecture"

echo ""
echo "🚀 运行容器命令:"
echo "  docker run -p 3000:3000 --name e-reader-server $IMAGE_NAME:$TAG"
echo ""
echo "🐳 使用 docker-compose 运行:"
echo "  docker-compose up -d"
echo ""
echo "🔍 测试健康检查:"
echo "  curl http://localhost:3000/health"