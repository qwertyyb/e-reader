# E-Reader 同步服务

这是 E-Reader 应用的后端同步服务，基于 Koa.js 构建，提供用户管理和数据同步功能。

## 功能特性

- 用户认证和管理
- 数据同步服务
- RESTful API
- 健康检查端点
- Docker 容器化部署

## 快速开始

### 本地开发

```bash
# 安装依赖
pnpm install

# 开发模式运行
pnpm run dev

# 构建项目
pnpm run build

# 生产模式运行
pnpm start
```

### Docker 部署

#### 前置要求

确保系统已安装：
- Docker
- Docker Compose

#### 多阶段构建特性

本项目使用 Docker 多阶段构建，具有以下优势：

1. **构建阶段** - 安装所有依赖并编译 TypeScript
2. **运行阶段** - 只包含生产依赖和编译后的 JavaScript 文件
3. **镜像优化** - 更小的镜像大小，更快的部署速度
4. **安全性** - 运行时使用非 root 用户
5. **健康检查** - 内置健康检查机制
6. **多平台支持** - 支持 x64 和 ARM64 架构

#### 构建镜像

##### 单平台构建

```bash
# 构建当前平台镜像
make docker-build

# 构建 x64 架构镜像
make docker-build-x64
pnpm run docker:build:x64

# 构建 ARM64 架构镜像
make docker-build-arm64
pnpm run docker:build:arm64

# 使用 npm 构建（备用方案）
make docker-build-npm
```

##### 多平台构建

```bash
# 构建多平台镜像（x64 + ARM64）
make docker-build-multiarch
pnpm run docker:build:multiarch

# 直接使用 Docker Buildx
docker-buildx build --platform linux/amd64,linux/arm64 --target runtime -t e-reader-sync-server:latest .
```

##### 平台特定运行

```bash
# 运行 x64 版本
docker run --platform linux/amd64 -p 3000:3000 e-reader-sync-server:latest

# 运行 ARM64 版本
docker run --platform linux/arm64 -p 3000:3000 e-reader-sync-server:latest

# 自动选择平台
docker run -p 3000:3000 e-reader-sync-server:latest
```

#### 运行容器

```bash
# 使用 docker-compose（推荐）
pnpm run docker:up

# 或者直接运行容器
docker run -p 3000:3000 e-reader-sync-server:latest
```

#### 部署脚本

```bash
# 一键部署（构建 + 运行）
pnpm run docker:deploy
```

#### 管理容器

```bash
# 查看日志
pnpm run docker:logs

# 停止服务
pnpm run docker:down

# 查看运行状态
docker-compose ps
```

## API 端点

- `GET /health` - 健康检查
- `/users/*` - 用户相关接口
- `/sync/*` - 同步相关接口

## 环境变量

- `PORT` - 服务端口（默认：3000）
- `NODE_ENV` - 运行环境（development/production）

## 项目结构

```
packages/server/
├── src/
│   ├── index.ts          # 应用入口
│   ├── routes/           # 路由定义
│   ├── services/         # 业务逻辑
│   └── middlewares/      # 中间件
├── scripts/              # 构建和部署脚本
├── Dockerfile           # Docker 镜像配置
├── docker-compose.yml   # Docker Compose 配置
└── package.json         # 项目配置
```

## 开发说明

### 技术栈

- **运行时**: Node.js 18+
- **框架**: Koa.js
- **语言**: TypeScript
- **数据库**: LowDB
- **包管理**: pnpm

### 开发工具

- **构建**: TypeScript Compiler
- **开发服务器**: tsx
- **容器化**: Docker

## 部署注意事项

1. **数据持久化**: 如果使用 LowDB 存储数据，建议挂载数据卷以持久化数据
2. **环境变量**: 生产环境请设置合适的环境变量
3. **健康检查**: 容器包含健康检查，确保服务正常运行
4. **端口映射**: 默认映射到主机的 3000 端口

## 故障排除

### 常见问题

1. **端口冲突**: 如果 3000 端口被占用，可以修改 docker-compose.yml 中的端口映射
2. **权限问题**: 确保脚本文件有执行权限 `chmod +x scripts/*.sh`
3. **Docker 未安装**: 请先安装 Docker 和 Docker Compose

### 查看日志

```bash
# 查看容器日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f server
```

## 许可证

ISC