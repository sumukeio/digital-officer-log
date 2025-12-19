/**
 * 登录组件测试用例
 * 测试自动登录、表单提交等功能
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginClient from '@/app/login/login-client'
import { login } from '@/app/actions/auth'

// Mock dependencies
jest.mock('@/app/actions/auth', () => ({
  login: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      refresh: jest.fn(),
    }
  },
}))

// Mock fetch for auto-login check
global.fetch = jest.fn()

describe('LoginClient Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('should render login form', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    })

    render(<LoginClient />)

    await waitFor(() => {
      expect(screen.getByLabelText(/工号/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^密码$/i)).toBeInTheDocument() // 精确匹配，避免匹配到"记住密码"
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
    })
  })

  it('should show loading state during auto-login', async () => {
    const recentLogin = {
      workId: '2020010',
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem('recent_login', JSON.stringify(recentLogin))

    ;(global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // 永不resolve，保持loading状态
    )

    render(<LoginClient />)

    // 等待 loading 状态出现
    await waitFor(() => {
      expect(screen.getByText(/正在自动登录/i)).toBeInTheDocument()
    })
  })

  it('should attempt auto-login when recent login exists', async () => {
    const recentLogin = {
      workId: '2020010',
      timestamp: new Date().toISOString(), // 今天
    }
    localStorage.setItem('recent_login', JSON.stringify(recentLogin))

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ authenticated: true }),
    })

    render(<LoginClient />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/check-auth', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })
    })
  })

  it('should not auto-login when recent login is expired', async () => {
    const oldLogin = {
      workId: '2020010',
      timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8天前
    }
    localStorage.setItem('recent_login', JSON.stringify(oldLogin))

    render(<LoginClient />)

    await waitFor(() => {
      expect(screen.getByLabelText(/工号/i)).toBeInTheDocument()
    })

    expect(localStorage.getItem('recent_login')).toBeNull()
  })

  it('should submit login form successfully', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    })
    ;(login as jest.Mock).mockResolvedValue({
      success: true,
      message: '登录成功',
    })

    render(<LoginClient />)

    await waitFor(() => {
      expect(screen.getByLabelText(/工号/i)).toBeInTheDocument()
    })

    const workIdInput = screen.getByLabelText(/工号/i)
    const passwordInput = screen.getByLabelText(/^密码$/i) // 精确匹配，避免匹配到"记住密码"
    const submitButton = screen.getByRole('button', { name: /continue/i })

    await user.type(workIdInput, '2020010')
    await user.type(passwordInput, '123456')
    await user.click(submitButton)

    await waitFor(() => {
      expect(login).toHaveBeenCalled()
    })

    // 验证登录函数被调用时传入了正确的参数
    expect(login).toHaveBeenCalledWith(
      expect.objectContaining({
        get: expect.any(Function),
      })
    )
  })

  it('should handle login failure', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    })
    ;(login as jest.Mock).mockResolvedValue({
      success: false,
      message: '工号或密码错误',
    })

    render(<LoginClient />)

    await waitFor(() => {
      expect(screen.getByLabelText(/工号/i)).toBeInTheDocument()
    })

    const workIdInput = screen.getByLabelText(/工号/i)
    const passwordInput = screen.getByLabelText(/^密码$/i) // 精确匹配，避免匹配到"记住密码"
    const submitButton = screen.getByRole('button', { name: /continue/i })

    await user.type(workIdInput, '2020010')
    await user.type(passwordInput, 'wrong-password')
    await user.click(submitButton)

    await waitFor(() => {
      expect(login).toHaveBeenCalled()
    })
  })
})

