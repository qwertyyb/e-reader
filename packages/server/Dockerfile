# ================================
# 第一阶段：构建阶段
# ================================
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm@10.8.0

# 复制 package.json
COPY package.json ./

# 安装所有依赖（包括开发依赖，用于构建）
RUN pnpm install

# 复制源代码和配置文件
COPY src/ ./src/
COPY tsconfig.json ./

# 构建应用（编译 TypeScript 为 JavaScript）
RUN pnpm run build

# ================================
# 第二阶段：运行阶段
# ================================
FROM --platform=$TARGETPLATFORM node:22-alpine AS runtime

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm@10.8.0

# 复制 package.json
COPY package.json ./

RUN mkdir /app/data

# 只安装生产依赖
RUN pnpm install --prod && \
    pnpm store prune

# 从构建阶段复制编译后的 JavaScript 文件
COPY --from=builder /app/dist ./dist

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 更改文件所有权
RUN chown -R nodejs:nodejs /app
USER nodejs

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 启动应用（直接运行编译后的 JavaScript）
CMD ["node", "dist/index.js"]