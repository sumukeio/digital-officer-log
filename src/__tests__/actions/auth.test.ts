/**
 * 认证功能测试用例
 * 测试登录、登出、获取当前用户等功能
 */

import { login, getCurrentUser, changePassword } from '@/app/actions/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

describe('Auth Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const mockUser = {
        id: 'user-1',
        workId: '2020010',
        password: '123456',
        name: '测试用户',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      const mockCookies = {
        set: jest.fn(),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const formData = new FormData()
      formData.append('workId', '2020010')
      formData.append('password', '123456')

      const result = await login(formData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('登录成功')
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { workId: '2020010' },
      })
      expect(mockCookies.set).toHaveBeenCalledWith(
        'userId',
        'user-1',
        expect.objectContaining({
          httpOnly: true,
        })
      )
    })

    it('should fail with incorrect password', async () => {
      const mockUser = {
        id: 'user-1',
        workId: '2020010',
        password: '123456',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const formData = new FormData()
      formData.append('workId', '2020010')
      formData.append('password', 'wrong-password')

      const result = await login(formData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('工号或密码错误')
    })

    it('should fail with non-existent user', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const formData = new FormData()
      formData.append('workId', '9999999')
      formData.append('password', '123456')

      const result = await login(formData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('工号或密码错误')
    })
  })

  describe('getCurrentUser', () => {
    it('should return user when cookie exists', async () => {
      const mockUser = {
        id: 'user-1',
        workId: '2020010',
        name: '测试用户',
        roles: [{ name: 'officer' }],
      }

      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: 'user-1' }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const user = await getCurrentUser()

      expect(user).toEqual(mockUser)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: { roles: true },
      })
    })

    it('should return null when no cookie', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const user = await getCurrentUser()

      expect(user).toBeNull()
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
    })
  })

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockUser = {
        id: 'user-1',
        password: 'old-password',
        isDefaultPassword: true,
      }

      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: 'user-1' }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: 'new-password',
        isDefaultPassword: false,
      })

      const formData = new FormData()
      formData.append('oldPassword', 'old-password')
      formData.append('newPassword', 'new-password-123')

      const result = await changePassword(null, formData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('密码修改成功')
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          password: 'new-password-123',
          isDefaultPassword: false,
        },
      })
    })

    it('should reject password shorter than 6 characters', async () => {
      const formData = new FormData()
      formData.append('oldPassword', 'old-password')
      formData.append('newPassword', '12345')

      const result = await changePassword(null, formData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('新密码至少6位')
    })

    it('should reject default password', async () => {
      const formData = new FormData()
      formData.append('oldPassword', 'old-password')
      formData.append('newPassword', '123456')

      const result = await changePassword(null, formData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('不能使用初始密码')
    })

    it('should reject wrong old password', async () => {
      const mockUser = {
        id: 'user-1',
        password: 'correct-password',
      }

      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: 'user-1' }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const formData = new FormData()
      formData.append('oldPassword', 'wrong-password')
      formData.append('newPassword', 'new-password-123')

      const result = await changePassword(null, formData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('旧密码错误')
    })
  })
})



