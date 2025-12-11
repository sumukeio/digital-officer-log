# 1. 基础镜像
FROM node:18-alpine AS base

# ▼▼▼ 修复 1: 安装 OpenSSL 和兼容库 (解决 Prisma 引擎检测不到 SSL 的问题) ▼▼▼
RUN apk add --no-cache libc6-compat openssl

# 2. 安装依赖
FROM base AS deps
WORKDIR /app

# 复制依赖定义
COPY package.json package-lock.json* ./

# ▼▼▼ 修复 2: 在运行 npm ci 之前，先把 prisma 文件夹复制进去 ▼▼▼
# 这样 postinstall 里的 "prisma generate" 就能找到 schema 文件了
COPY prisma ./prisma

# 安装依赖 (这时 postinstall 会自动运行 prisma generate，因为 schema 已经有了，所以不会报错)
RUN npm ci

# 3. 构建代码
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成 Prisma Client (再运行一次确保万无一失)
RUN npx prisma generate
# 构建 Next.js
RUN npm run build

# 4. 生产环境运行
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]