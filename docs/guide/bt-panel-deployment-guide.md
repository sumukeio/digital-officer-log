# 内网服务器宝塔面板部署指南 (BT Panel Deployment Guide)

> **状态**：[权威/现行]  
> **适用环境**：Linux 内网服务器 + 宝塔面板 (BT-Panel)  
> **部署路径**：`/www/wwwroot/digital-officer-log`  
> **技术栈**：Next.js 16 + React 19 + TypeScript + Prisma ORM + PostgreSQL 18 + PM2  

---

## 一、服务器环境与端口分配方案

### 1. 现有服务器端口占用情况与规避
当前服务器已运行多个业务服务，占用端口如下：
- `3000`、`3001`、`8000`、`8765`、`8888`（宝塔面板）

**本项目端口决策**：
- **本项目服务端口统一分配为：`3002`**（完全规避已有服务，互不干扰）。

---

### 2. 关于“Nginx 必须装吗？如何做端口映射？”的权威解答

> 💡 **核心结论**：**Nginx 不是必须安装的！**

根据您服务器的实际情况，推荐以下两种访问方案：

| 方案 | 是否需要 Nginx | 访问方式 | 适用场景与优势 |
| :--- | :--- | :--- | :--- |
| **方案 A：端口直连（强烈推荐）** | **完全不需要** | `http://服务器IP:3002` | **最简单、最稳定**。Next.js / PM2 独立监听 `3002` 端口，与其他 3000/3001/8000 服务完全隔离，对现有环境 **0 风险、0 干扰**。 |
| **方案 B：Nginx 反向代理（可选）** | 需要（如已有） | `http://内网域名` (80端口) 或自定义域名 | 只有当您希望内网同事**不输端口号**（如通过 `http://officer.internal` 访问）时才需要开启。 |

---

## 二、PostgreSQL 数据库配置

根据您在宝塔中创建的数据库信息：
- **PostgreSQL 版本**：`18.0`（或当前版本）
- **数据库名**：`DigitalOfficerLog`
- **用户名**：`postgres`
- **密码**：`WpK4Tz5cnXez`
- **数据库主机与端口**：`127.0.0.1:5432`

---

## 三、生产环境变量配置 (`.env`)

在 `/www/wwwroot/digital-officer-log/.env` 中写入以下配置：

```ini
# PostgreSQL 数据库连接串（已为您精准拼装好库名与密码）
DATABASE_URL="postgresql://postgres:WpK4Tz5cnXez@127.0.0.1:5432/DigitalOfficerLog?schema=public"
DIRECT_URL="postgresql://postgres:WpK4Tz5cnXez@127.0.0.1:5432/DigitalOfficerLog?schema=public"

# 运行环境与分配的独立端口 (3002)
NODE_ENV="production"
PORT=3002

# 企业微信群机器人 Webhook (已内置默认值，亦可在前端页面随时修改)
WECOM_WEBHOOK_URL="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=1848bd32-881e-474c-978c-b67556102cbb"
```

---

## 四、代码上传与目录结构

将本项目代码同步或上传至 `/www/wwwroot/digital-officer-log`。

### 必须包含的文件清单：
```text
/www/wwwroot/digital-officer-log/
├── package.json
├── package-lock.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── ...
├── public/
└── .env (上述环境变量文件)
```

---

## 五、终端依赖安装、数据库初始化与编译构建

在宝塔面板打开 **「终端」**（或通过 SSH 登录服务器），依次执行以下命令：

```bash
# 1. 进入项目根目录
cd /www/wwwroot/digital-officer-log

# 2. 安装全部依赖
npm install

# 3. 生成 Prisma Client ORM 类型
npx prisma generate

# 4. 初始化数据库表结构（自动在 DigitalOfficerLog 数据库中创建所有数据表）
npx prisma db push

# 5. 执行 Next.js 生产全量构建（编译生成 .next 优化产物）
npm run build
```

> ✅ 当看到 `✔ Compiled successfully` 且路由清单生成完毕后，说明生产构建 100% 成功！

---

## 六、启动与进程守护（二选一）

### 推荐：使用 PM2 守护进程（基于 3002 端口）

在终端中执行：

```bash
cd /www/wwwroot/digital-officer-log

# 使用 PM2 启动服务（指定 3002 端口）
PORT=3002 pm2 start npm --name "digital-officer-log" -- run start -- -p 3002

# 保存 PM2 进程列表以实现开机自启
pm2 save
pm2 startup
```

> **查看状态与日志**：
> - 查看运行状态：`pm2 status`
> - 查看实时日志：`pm2 logs digital-officer-log`
> - 重启服务：`pm2 restart digital-officer-log`

---

### 可选：使用宝塔「Node.js 项目管理器」图形化启动

1. 打开宝塔面板 $\rightarrow$ **「网站」** $\rightarrow$ **「Node 项目」** $\rightarrow$ 点击 **「添加 Node 项目」**；
2. 填写配置：
   - **项目名称**：`digital-officer-log`
   - **项目目录**：`/www/wwwroot/digital-officer-log`
   - **Node 版本**：选择已安装的 `v20.20.2`
   - **包管理器**：`npm`
   - **启动命令**：`run start -- -p 3002`
   - **项目端口**：`3002`
   - **开机自启**：勾选 ✅
3. 点击 **「确定」** 启动。

---

## 七、宝塔安全组 / 防火墙放行

如果通过局域网其他电脑访问 `http://服务器IP:3002`：
1. 打开宝塔面板 $\rightarrow$ **「安全」**；
2. 在「系统防火墙」中添加放行端口：**`3002`**（备注：数字官工作台）；
3. 如果服务器运行在云平台或宿主机，请一并在云安全组/宿主机防火墙中放行 `3002` 端口。

---

## 八、可选方案：配置 Nginx 反向代理（仅当需要域名访问时）

如果您未来希望通过内网域名访问而无需在浏览器输入 `:3002` 端口：
1. 宝塔面板 $\rightarrow$ **「网站」** $\rightarrow$ **「添加站点」**（例如域名填 `do.local` 或指定端口）；
2. 进入该站点的 **「反向代理」** $\rightarrow$ **「添加反向代理」**：
   - **代理名称**：`digital-officer`
   - **目标 URL**：`http://127.0.0.1:3002`
   - **发送域名**：`$host`
3. 在代理配置中加入大文件上传支持：
   ```nginx
   client_max_body_size 50m;
   ```

---

## 九、后续日常版本更新运维

后续如果有新功能更新，在终端中仅需执行：
```bash
cd /www/wwwroot/digital-officer-log
git pull
npm install
npx prisma generate
npx prisma db push
npm run build
pm2 restart digital-officer-log
```
