/**
 * 更新公告组件测试用例
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UpdateAnnouncementDialog } from '@/components/UpdateAnnouncement'

describe('UpdateAnnouncement Component', () => {
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

  it('should display recent updates when dialog is open', async () => {
    const user = userEvent.setup()
    render(<UpdateAnnouncementDialog />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    // 检查是否包含最近的更新日期
    expect(screen.getByText(/12月17日更新/)).toBeInTheDocument()
    expect(screen.getByText(/12月16日更新/)).toBeInTheDocument()
  })

  it('should display bug fixes section when dialog is open', async () => {
    const user = userEvent.setup()
    render(<UpdateAnnouncementDialog />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    // 使用 getAllByText 因为有多处 "Bug修复"
    const bugFixes = screen.getAllByText(/Bug修复/)
    expect(bugFixes.length).toBeGreaterThan(0)
  })

  it('should display new features section when dialog is open', async () => {
    const user = userEvent.setup()
    render(<UpdateAnnouncementDialog />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    // 使用 getAllByText 因为有多处 "新增功能"
    const newFeatures = screen.getAllByText(/新增功能/)
    expect(newFeatures.length).toBeGreaterThan(0)
  })

  it('should be scrollable when dialog is open', async () => {
    const user = userEvent.setup()
    render(<UpdateAnnouncementDialog />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    // 等待对话框打开
    await screen.findByText('更新公告')
    
    // 查找滚动容器（在 DialogContent 内部）
    const dialogContent = screen.getByRole('dialog')
    const scrollContainer = dialogContent.querySelector('.overflow-y-auto')
    expect(scrollContainer).toBeTruthy()
  })
})

