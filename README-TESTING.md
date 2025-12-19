# 测试文档

本项目使用 **Jest** + **React Testing Library** 进行自动化测试。

## 安装依赖

```bash
npm install
```

## 运行测试

```bash
# 运行所有测试
npm test

# 监听模式（开发时使用）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

## 测试结构

```
src/
├── __tests__/
│   ├── actions/          # Server Actions 测试
│   │   ├── auth.test.ts      # 认证功能测试
│   │   └── task.test.ts      # 任务管理测试
│   ├── components/       # 组件测试
│   │   ├── LoginClient.test.tsx
│   │   └── UpdateAnnouncement.test.tsx
│   └── lib/              # 工具函数测试
│       └── utils.test.ts
```

## 测试覆盖范围

### 1. 认证功能 (`auth.test.ts`)
- ✅ 登录成功/失败场景
- ✅ 获取当前用户
- ✅ 修改密码（包括验证规则）

### 2. 任务管理 (`task.test.ts`)
- ✅ 创建任务（包括防重复提交）
- ✅ 删除任务（权限验证）
- ✅ 完成任务

### 3. 组件测试
- ✅ 登录组件（自动登录、表单提交）
- ✅ 更新公告组件（渲染和滚动）

### 4. 工具函数 (`utils.test.ts`)
- ✅ 类名合并工具

## 编写新测试

### Server Action 测试示例

```typescript
import { myAction } from '@/app/actions/my-action'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    // mock prisma methods
  },
}))

describe('myAction', () => {
  it('should do something', async () => {
    // Arrange
    const mockData = { ... }
    
    // Act
    const result = await myAction(mockData)
    
    // Assert
    expect(result).toEqual(expected)
  })
})
```

### 组件测试示例

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
  
  it('should handle user interaction', async () => {
    const user = userEvent.setup()
    render(<MyComponent />)
    
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Clicked')).toBeInTheDocument()
  })
})
```

## 测试最佳实践

1. **测试命名**：使用描述性的测试名称，说明测试的场景
2. **AAA 模式**：Arrange（准备）→ Act（执行）→ Assert（断言）
3. **Mock 外部依赖**：数据库、API、Next.js 路由等
4. **测试边界情况**：成功、失败、边界值
5. **保持测试独立**：每个测试应该独立运行，不依赖其他测试

## CI/CD 集成

在 CI/CD 流程中运行测试：

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm test -- --coverage
```

## 覆盖率目标

- 核心业务逻辑：> 80%
- 工具函数：> 90%
- 组件：> 70%


