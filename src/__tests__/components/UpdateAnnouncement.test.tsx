/**
 * 更新公告组件测试用例
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UpdateAnnouncementDialog } from '@/components/UpdateAnnouncement'
import { getReadmeContent } from '@/app/actions/readme'

// Mock getReadmeContent
jest.mock('@/app/actions/readme', () => ({
  getReadmeContent: jest.fn(),
}))

const mockReadmeContent = `## 12月18日更新
### 新增功能
1、登录页优化：添加"记住密码"功能，自动保存工号；添加"忘记密码"功能，支持通过工号+姓名验证重置密码。
2、管理员后台题目类型扩展：新增单选框（radio）、多选框（checkbox）、下拉框（select）类型，支持配置选项列表。

## 12月17日更新
### Bug修复
1、修复了立即发布按钮，点两次还是会新建两个同名任务的bug（服务端防重复提交 + 前端loading状态）。
2、修复了任务看板横向滚动条必须滚动到底部才能看到的问题（固定容器高度，滚动条始终可见）。

### 新增功能
1、管理员可以在历史归档任务页面删除任务（卡片右上角删除按钮）。
2、任务看板支持任务复制功能（点击复制按钮，预填数据打开新建弹窗）。

## 12月16日更新
### Bug修复
1、指标趋势分析看板取数异常。
2、通过日历查看当日已提交日报时，无法选择区域。

### 新增功能
1、日报填写页面，支持图片的右键粘贴和拖入。
2、任务看板：新建任务时，开始日期与持续时间非必填，方便安排计划。`

describe('UpdateAnnouncement Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getReadmeContent as jest.Mock).mockResolvedValue(mockReadmeContent)
  })

  it('should render update announcement button', () => {
    render(<UpdateAnnouncementDialog />)
    
    // 按钮应该存在（Bell 图标）
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('should open dialog when button is clicked', async () => {
    const user = userEvent.setup()
    render(<UpdateAnnouncementDialog />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    // 对话框应该打开并显示标题
    expect(screen.getByText('更新公告')).toBeInTheDocument()
  })

  it('should display loading state when fetching content', async () => {
    const user = userEvent.setup()
    ;(getReadmeContent as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // 永不 resolve，保持 loading 状态
    )
    
    render(<UpdateAnnouncementDialog />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    // 应该显示加载状态
    await waitFor(() => {
      expect(screen.getByText(/正在加载更新内容/i)).toBeInTheDocument()
    })
  })

  it('should display recent updates when dialog is open', async () => {
    const user = userEvent.setup()
    render(<UpdateAnnouncementDialog />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    // 等待内容加载完成
    await waitFor(() => {
      expect(screen.getByText(/12月18日更新/)).toBeInTheDocument()
    })
    
    // 检查是否包含最近的更新日期
    expect(screen.getByText(/12月17日更新/)).toBeInTheDocument()
    expect(screen.getByText(/12月16日更新/)).toBeInTheDocument()
  })

  it('should display bug fixes section when dialog is open', async () => {
    const user = userEvent.setup()
    render(<UpdateAnnouncementDialog />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    // 等待内容加载完成，使用 getAllByText 因为有多处 "Bug修复"
    await waitFor(() => {
      const bugFixes = screen.getAllByText(/Bug修复/)
      expect(bugFixes.length).toBeGreaterThan(0)
    })
  })

  it('should display new features section when dialog is open', async () => {
    const user = userEvent.setup()
    render(<UpdateAnnouncementDialog />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    // 等待内容加载完成，使用 getAllByText 因为有多处 "新增功能"
    await waitFor(() => {
      const newFeatures = screen.getAllByText(/新增功能/)
      expect(newFeatures.length).toBeGreaterThan(0)
    })
  })

  it('should display error message when content fails to load', async () => {
    const user = userEvent.setup()
    ;(getReadmeContent as jest.Mock).mockResolvedValue('')
    
    render(<UpdateAnnouncementDialog />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    // 等待错误状态显示
    await waitFor(() => {
      expect(screen.getByText(/无法加载更新内容/i)).toBeInTheDocument()
    })
  })

  it('should be scrollable when dialog is open', async () => {
    const user = userEvent.setup()
    render(<UpdateAnnouncementDialog />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    // 等待对话框打开和内容加载
    await waitFor(() => {
      expect(screen.getByText('更新公告')).toBeInTheDocument()
    })
    
    // 查找滚动容器（在 DialogContent 内部）
    const dialogContent = screen.getByRole('dialog')
    const scrollContainer = dialogContent.querySelector('.overflow-y-auto')
    expect(scrollContainer).toBeTruthy()
  })
})

