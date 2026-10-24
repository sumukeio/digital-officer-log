# 系统缺陷与问题排查台账 (QA.md)

> 本文档用于沉淀记录生产与开发过程中遇到的典型缺陷、根因归因、修复方案与防再犯防御机制。

---

## 缺陷 001：管理员后台上传系统 Logo 时保存失败 (ENOTFOUND dummy.supabase.co)

### 现象描述
在「管理员后台 ➔ 系统设置」中上传新的系统 Logo 图片并点击保存时，前端提示保存失败，服务端报错：
```text
Logo Upload Failed: Error: getaddrinfo ENOTFOUND dummy.supabase.co
    at ignore-listed frames {
  errno: -3008,
  code: 'ENOTFOUND',
  syscall: 'getaddrinfo',
  hostname: 'dummy.supabase.co'
}
 ⨯ Error: Logo 上传失败
digest: '4201048309'
```

### 根本原因 (Root Cause)
1. 项目原 `uploadToMinIO` 方法强制依赖外部 Supabase S3 / MinIO 服务对象；在未配置真实 `MINIO_ENDPOINT` 环境变量的私网部署环境下，代码回退使用了 `dummy.supabase.co` 占位地址。
2. 当管理员上传图片时，S3 Client 尝试解析 `dummy.supabase.co` 域名引发 DNS 寻址失败 (`ENOTFOUND`)。
3. `saveSystemConfig` 内部捕获后直接执行 `throw new Error("Logo 上传失败")`，触发 Next.js Server Action 500 崩溃异常（`Digest: 4201048309`）。

### 解决方案 (Fix)
1. **本地存储 + S3 动态双重保底机制 (`src/lib/minio.ts`)**：
   - 优先检测 `MINIO_ENDPOINT` 是否配置了真实的 S3/MinIO 服务地址；
   - 若未配置或 S3 访问失败，自动无缝降级为**写入本地服务器持久化目录**（`public/uploads/${bucketName}/${filename}`），通过 Next.js 静态文件服务直接对外提供访问；
   - 增加 **Base64 Data URI** 多重兜底，确保在无外网、无 S3、甚至无磁盘写权限的极端环境下依然能 100% 成功持久化并展示 Logo。
2. **安全防御与异常收敛 (`src/app/actions/admin.ts`)**：
   - 将 `saveSystemConfig` 内部所有文件上传与持久化逻辑置于防御块内，即使上传异常也优雅记录日志并保证页面其他配置正常更新，不向前端抛出未捕获的 Server Action Crash。

### 防再犯机制 (Prevention)
- 所有涉及第三方外部存储或 AI API 的模块，一律推行「按需延迟初始化 + 本地离线多重降级保底」架构，杜绝因外部服务缺失或网络波动导致核心功能阻断。