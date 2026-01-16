#!/bin/bash

# Docker Buildx 多平台构建设置脚本

set -e

echo "🔧 设置 Docker Buildx 多平台构建环境..."

# 检查 Docker 版本
echo "📋 检查 Docker 版本..."
docker version

# 检查 buildx 插件
echo "🔍 检查 buildx 插件..."
if ! docker-buildx version; then
    echo "❌ Docker Buildx 插件未安装"
    echo "请升级到 Docker 19.03+ 或安装 buildx 插件"
    exit 1
fi

# 检查现有的 builder
echo "📋 当前 builder 列表:"
docker-buildx ls

# 创建多平台 builder（如果不存在）
BUILDER_NAME="multiarch"
if ! docker-buildx ls | grep -q "$BUILDER_NAME"; then
    echo "🔨 创建多平台 builder: $BUILDER_NAME"
    docker-buildx create \
        --name "$BUILDER_NAME" \
        --driver docker-container \
        --use \
        --bootstrap
else
    echo "✅ Builder '$BUILDER_NAME' 已存在，切换使用"
    docker-buildx use "$BUILDER_NAME"
fi

# 启动 builder
echo "🚀 启动 builder..."
docker-buildx inspect --bootstrap

# 显示支持的平台
echo "🏗️  支持的平台:"
docker-buildx inspect | grep "Platforms:"

echo ""
echo "✅ Docker Buildx 多平台构建环境设置完成!"
echo ""
echo "🚀 现在可以使用以下命令进行多平台构建:"
echo "  make docker-build-multiarch"
echo "  pnpm run docker:build:multiarch"
echo ""
echo "🔍 查看 builder 信息:"
echo "  docker-buildx ls"
echo "  docker-buildx inspect"