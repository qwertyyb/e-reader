# E-Reader 同步服务 Makefile

.PHONY: help install dev build start docker-build docker-build-npm docker-build-x64 docker-build-arm64 docker-build-multiarch docker-run docker-up docker-down docker-logs clean

# 默认目标
help:
	@echo "E-Reader 同步服务 - 可用命令:"
	@echo ""
	@echo "开发命令:"
	@echo "  install      - 安装依赖"
	@echo "  dev          - 开发模式运行"
	@echo "  build        - 构建项目"
	@echo "  start        - 生产模式运行"
	@echo ""
	@echo "Docker 命令:"
	@echo "  docker-build           - 构建 Docker 镜像 (当前平台)"
	@echo "  docker-build-x64       - 构建 x64 架构镜像"
	@echo "  docker-build-arm64     - 构建 ARM64 架构镜像"
	@echo "  docker-build-multiarch - 构建多平台镜像"
	@echo "  docker-build-npm       - 构建 Docker 镜像 (npm 版本)"
	@echo "  docker-run             - 运行单个容器"
	@echo "  docker-up              - 使用 docker-compose 启动"
	@echo "  docker-down            - 停止 docker-compose 服务"
	@echo "  docker-logs            - 查看容器日志"
	@echo ""
	@echo "其他命令:"
	@echo "  clean        - 清理构建文件"

# 开发命令
install:
	pnpm install

dev:
	pnpm run dev

build:
	pnpm run build

start:
	pnpm start

# Docker 命令 (多平台构建)
docker-build:
	@echo "🔨 构建 Docker 镜像 (当前平台)..."
	docker-buildx build --target runtime -t e-reader-sync-server:latest --load .
	@echo "✅ 构建完成!"

docker-build-x64:
	@echo "🔨 构建 x64 架构 Docker 镜像..."
	./scripts/build.sh latest Dockerfile linux/amd64
	@echo "✅ x64 镜像构建完成!"

docker-build-arm64:
	@echo "🔨 构建 ARM64 架构 Docker 镜像..."
	./scripts/build.sh latest Dockerfile linux/arm64
	@echo "✅ ARM64 镜像构建完成!"

docker-build-multiarch:
	@echo "🌍 构建多平台 Docker 镜像..."
	./scripts/build-multiarch.sh
	@echo "✅ 多平台镜像构建完成!"

docker-build-npm:
	@echo "🔨 构建多阶段 Docker 镜像 (npm)..."
	docker-buildx build --platform linux/amd64 --target runtime -t e-reader-sync-server:npm -f Dockerfile.npm --load .
	@echo "✅ 构建完成!"

docker-run:
	docker run -p 3000:3000 --name e-reader-server e-reader-sync-server:latest

docker-run-x64:
	docker run --platform linux/amd64 -p 3000:3000 --name e-reader-server-x64 e-reader-sync-server:latest

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

# 部署命令
deploy:
	./scripts/deploy.sh

# 测试命令
test-health:
	@echo "🔍 测试健康检查端点..."
	curl -f http://localhost:3000/health || echo "❌ 健康检查失败"

# 清理命令
clean:
	rm -rf dist/
	rm -rf node_modules/
	docker-compose down --volumes --remove-orphans || true
	docker rmi e-reader-sync-server:latest || true
	docker rmi e-reader-sync-server:npm || true

# 镜像分析
docker-analyze:
	@echo "📊 分析 Docker 镜像..."
	docker images | grep e-reader-sync-server
	@echo ""
	@echo "🔍 镜像历史:"
	docker history e-reader-sync-server:latest

# 多平台相关命令
docker-setup-buildx:
	@echo "🔧 设置 Docker Buildx..."
	docker-buildx create --name multiarch --use --bootstrap || docker-buildx use multiarch

docker-inspect-multiarch:
	@echo "🔍 检查多平台镜像..."
	docker-buildx imagetools inspect e-reader-sync-server:latest