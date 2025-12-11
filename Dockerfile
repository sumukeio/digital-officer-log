# ▼▼▼ 核心修复：把 18 改为 20 (Next.js 15 需要 Node 20+) ▼▼▼
FROM node:20-alpine AS base

# 安装 OpenSSL 和兼容库
RUN apk add --no-cache libc6-compat openssl

# 2. 安装依赖
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./

# 复制 prisma 文件夹 (确保 postinstall 能找到 schema)
COPY prisma ./prisma

RUN npm ci

# 3. 构建代码
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成 Prisma Client
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