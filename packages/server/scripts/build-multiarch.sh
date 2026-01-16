#!/bin/bash

# 多平台构建脚本

set -e

# 获取当前目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(dirname "$SCRIPT_DIR")"

echo "🌍 开始多平台构建 e-reader 同步服务..."

# 进入服务器目录
cd "$SERVER_DIR"

# 构建参数
IMAGE_NAME="e-reader-sync-server"
TAG=${1:-latest}
DOCKERFILE=${2:-Dockerfile}
PLATFORMS="linux/amd64,linux/arm64"
REGISTRY=${3:-""}

echo "🔨 构建镜像: $IMAGE_NAME:$TAG"
echo "📄 使用 Dockerfile: $DOCKERFILE"
echo "🏗️  目标平台: $PLATFORMS"

# 检查是否需要创建 buildx builder
if ! docker-buildx ls | grep -q "multiarch"; then
    echo "🔧 创建多平台构建器..."
    docker-buildx create --name multiarch --use --bootstrap
else
    echo "🔧 使用现有的多平台构建器..."
    docker-buildx use multiarch
fi

# 构建参数
BUILD_ARGS=(
    --platform "$PLATFORMS"
    --target runtime
    --tag "$IMAGE_NAME:$TAG"
    --file "$DOCKERFILE"
    --build-arg NODE_ENV=production
)

# 如果指定了注册表，则推送到注册表
if [ -n "$REGISTRY" ]; then
    echo "📤 构建并推送到注册表: $REGISTRY"
    BUILD_ARGS+=(--tag "$REGISTRY/$IMAGE_NAME:$TAG")
    BUILD_ARGS+=(--push)
else
    echo "💾 构建并加载到本地"
    BUILD_ARGS+=(--load)
fi

# 执行构建
docker-buildx build "${BUILD_ARGS[@]}" .

echo "✅ 多平台镜像构建完成!"

# 显示构建结果
if [ -n "$REGISTRY" ]; then
    echo "📤 镜像已推送到: $REGISTRY/$IMAGE_NAME:$TAG"
    echo "🔍 查看镜像清单:"
    docker-buildx imagetools inspect "$REGISTRY/$IMAGE_NAME:$TAG"
else
    echo "📋 本地镜像信息:"
    docker images | grep "$IMAGE_NAME"
    
    echo ""
    echo "🏗️  镜像架构信息:"
    docker inspect "$IMAGE_NAME:$TAG" | grep -A 5 "Architecture" || echo "多平台镜像，请使用 docker-buildx imagetools inspect 查看详细信息"
fi

echo ""
echo "🚀 使用说明:"
echo "  # 运行 x64 版本:"
echo "  docker run --platform linux/amd64 -p 3000:3000 $IMAGE_NAME:$TAG"
echo ""
echo "  # 运行 ARM64 版本:"
echo "  docker run --platform linux/arm64 -p 3000:3000 $IMAGE_NAME:$TAG"
echo ""
echo "  # 自动选择平台:"
echo "  docker run -p 3000:3000 $IMAGE_NAME:$TAG"