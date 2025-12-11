# 1. 基础镜像
FROM node:18-alpine AS base

# 2. 安装依赖
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# 如果在内网，可能需要配置 npm 镜像源
RUN npm config set registry https://registry.npmmirror.com
RUN npm ci

# 3. 构建代码
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 生成 Prisma Client
RUN npx prisma generate
# 构建 Next.js 项目
RUN npm run build

# 4. 生产环境运行
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

# 创建非 root 用户提高安全性
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# 允许外部访问
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]