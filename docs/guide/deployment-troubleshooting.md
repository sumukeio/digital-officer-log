# 部署失败常见原因总结 (Deployment Troubleshooting)

> **状态**：[权威/现行]
> **说明**：汇总 TypeScript 严格模式、缺少参数、环境变量、Prisma 与运行时错误的排查与防范方法。

---

## 📋 最近修复的错误回顾

最近修复的两个错误都是 **TypeScript 类型错误**：

1. **隐式 `any` 类型错误**
   - 错误信息：`Parameter 'o' implicitly has an 'any' type`
   - 原因：回调函数参数没有显式类型注解
   - 修复：添加类型注解，如 `(o: string) => ...`

2. **类型转换错误**
   - 错误信息：`Conversion of type 'Event' to type 'ClipboardEvent' may be a mistake`
   - 原因：直接类型断言不安全
   - 修复：使用 `unknown` 作为中间类型进行转换

---

## 🚨 部署失败的常见原因分类

### 1. **TypeScript 类型错误** ⚠️（最常见）

#### 1.1 隐式 `any` 类型
```typescript
// ❌ 错误
const items = array.map(item => item.value);

// ✅ 正确
const items = array.map((item: MyType) => item.value);
```

**常见场景：**
- `.map()`, `.filter()`, `.forEach()` 等数组方法
- 事件处理函数参数
- 回调函数参数

#### 1.2 类型不匹配
```typescript
// ❌ 错误
const value: string = someNumber;

// ✅ 正确
const value: string = String(someNumber);
```

#### 1.3 类型断言错误
```typescript
// ❌ 错误
const event = e as ClipboardEvent; // 如果 e 是 Event 类型

// ✅ 正确
const event = e as unknown as ClipboardEvent;
```

#### 1.4 缺少类型定义
```typescript
// ❌ 错误
interface User {
  name: string;
  // 缺少 age 属性，但代码中使用了
}

// ✅ 正确
interface User {
  name: string;
  age: number;
}
```

---

### 2. **缺少必需参数** ⚠️

#### 2.1 函数参数缺失
```typescript
// ❌ 错误
function createUser(name: string, age: number, email: string) { }
createUser("John", 25); // 缺少 email

// ✅ 正确
createUser("John", 25, "john@example.com");
```

#### 2.2 环境变量缺失
```typescript
// ❌ 错误
const apiKey = process.env.API_KEY; // undefined

// ✅ 正确
const apiKey = process.env.API_KEY || "";
// 或使用验证
if (!process.env.API_KEY) {
  throw new Error("API_KEY is required");
}
```

#### 2.3 数据库连接参数缺失
```typescript
// ❌ 错误
// .env 文件中缺少 DATABASE_URL

// ✅ 正确
// .env 文件包含完整的连接字符串
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

---

### 3. **运行时错误** 🔴

#### 3.1 未捕获的异常
```typescript
// ❌ 错误
const data = JSON.parse(invalidJson); // 可能抛出异常

// ✅ 正确
try {
  const data = JSON.parse(jsonString);
} catch (error) {
  console.error("Parse error:", error);
}
```

#### 3.2 空值/未定义访问
```typescript
// ❌ 错误
const value = obj.property.nested; // obj 可能是 null

// ✅ 正确
const value = obj?.property?.nested;
```

#### 3.3 异步操作未处理
```typescript
// ❌ 错误
async function fetchData() {
  const response = await fetch(url); // 可能失败
  return response.json();
}

// ✅ 正确
async function fetchData() {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch");
    return response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}
```

---

### 4. **依赖问题** 📦

#### 4.1 依赖版本冲突
```json
// ❌ 错误
{
  "dependencies": {
    "react": "^19.0.0",
    "some-library": "^1.0.0" // 需要 react ^18.0.0
  }
}

// ✅ 正确
// 使用兼容的版本或更新依赖
```

#### 4.2 缺少依赖
```bash
# ❌ 错误
npm install --production # 缺少 devDependencies

# ✅ 正确
npm install # 安装所有依赖
```

#### 4.3 依赖安装失败
```bash
# 可能原因：
# - 网络问题
# - 权限问题
# - 磁盘空间不足
# - Node.js 版本不兼容
```

---

### 5. **构建配置问题** ⚙️

#### 5.1 TypeScript 配置过严
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true, // 可能导致更多类型错误
    "noImplicitAny": true // 要求显式类型
  }
}
```

#### 5.2 Next.js 配置问题
```javascript
// next.config.js
// ❌ 错误：缺少必要的配置
module.exports = {};

// ✅ 正确：包含必要的配置
module.exports = {
  experimental: {
    serverActions: true,
  },
};
```

#### 5.3 环境变量配置
```bash
# ❌ 错误：.env 文件未提交或配置错误
# ✅ 正确：确保所有必需的环境变量都已配置
```

---

### 6. **数据库/Prisma 问题** 🗄️

#### 6.1 Prisma Schema 错误
```prisma
// ❌ 错误：语法错误或类型不匹配
model User {
  id    Int    @id
  name  String
  email String @unique
  // 缺少必需字段
}

// ✅ 正确：完整的 schema
model User {
  id    Int    @id @default(autoincrement())
  name  String
  email String @unique
}
```

#### 6.2 数据库迁移未执行
```bash
# ❌ 错误：直接部署，未运行迁移
# ✅ 正确
npx prisma migrate deploy
# 或
npx prisma db push
```

#### 6.3 数据库连接失败
```typescript
// ❌ 错误：连接字符串错误或数据库不可访问
// ✅ 正确：验证连接字符串和网络访问
```

---

### 7. **资源/文件问题** 📁

#### 7.1 文件路径错误
```typescript
// ❌ 错误
import { utils } from './utils'; // 文件不存在

// ✅ 正确
import { utils } from './utils'; // 确保文件存在
```

#### 7.2 静态资源缺失
```typescript
// ❌ 错误
<img src="/images/logo.png" /> // 文件不存在

// ✅ 正确：确保文件存在于 public 目录
```

#### 7.3 文件权限问题
```bash
# ❌ 错误：文件没有读取权限
# ✅ 正确：确保文件权限正确
```

---

### 8. **API/网络问题** 🌐

#### 8.1 API 端点错误
```typescript
// ❌ 错误
fetch('/api/users'); // 路由不存在

// ✅ 正确：确保 API 路由存在
```

#### 8.2 CORS 配置问题
```typescript
// ❌ 错误：跨域请求被阻止
// ✅ 正确：配置 CORS 或使用正确的域名
```

---

## 🔍 排查步骤

### 1. 查看构建日志
```bash
npm run build
# 查看完整的错误信息
```

### 2. 检查类型错误
```bash
npx tsc --noEmit
# 检查所有 TypeScript 类型错误
```

### 3. 检查 Lint 错误
```bash
npm run lint
# 检查代码规范问题
```

### 4. 本地测试
```bash
npm run dev
# 在本地环境测试，确保功能正常
```

### 5. 检查环境变量
```bash
# 确保所有必需的环境变量都已设置
cat .env
```

### 6. 检查依赖
```bash
npm install
# 确保所有依赖都已正确安装
```

---

## 💡 预防措施

### 1. **启用严格类型检查**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### 2. **使用 ESLint**
```bash
npm run lint
# 在提交前运行 lint 检查
```

### 3. **使用 Pre-commit Hooks**
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npm run build"
    }
  }
}
```

### 4. **CI/CD 检查**
```yaml
# .github/workflows/ci.yml
- name: Build
  run: npm run build
- name: Test
  run: npm test
```

### 5. **类型定义文件**
```typescript
// 为所有接口和类型创建明确的定义
interface User {
  id: string;
  name: string;
  email: string;
}
```

---

## 📊 错误频率统计（基于经验）

1. **TypeScript 类型错误** - 60% ⚠️
   - 隐式 `any` 类型
   - 类型不匹配
   - 缺少类型定义

2. **环境变量缺失** - 15% 🔴
   - 数据库连接字符串
   - API 密钥
   - 第三方服务配置

3. **依赖问题** - 10% 📦
   - 版本冲突
   - 缺少依赖
   - 安装失败

4. **运行时错误** - 8% 🔴
   - 空值访问
   - 未捕获异常
   - 异步操作失败

5. **数据库问题** - 5% 🗄️
   - Schema 错误
   - 迁移未执行
   - 连接失败

6. **其他问题** - 2% ⚙️
   - 构建配置
   - 文件路径
   - 权限问题

---

## ✅ 快速检查清单

部署前请确认：

- [ ] `npm run build` 成功
- [ ] `npx tsc --noEmit` 无错误
- [ ] `npm run lint` 通过
- [ ] 所有环境变量已配置
- [ ] 数据库迁移已执行
- [ ] 所有依赖已安装
- [ ] API 路由正常工作
- [ ] 静态资源文件存在
- [ ] 测试用例通过（如果有）

---

## 🆘 紧急修复建议

如果部署失败：

1. **立即回滚**到上一个可用版本
2. **查看构建日志**，定位具体错误
3. **本地复现**问题
4. **修复错误**后重新部署
5. **验证功能**是否正常

---

**最后更新：** 2024年12月 (由 Doc-Driven 脚手架优雅迁移治理至 `docs/guide/`)
