/**
 * 任务管理功能测试用例
 * 测试创建、删除、复制、完成任务等功能
 */

import { createTask, deleteTask, completeTask } from '@/app/actions/task'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/app/actions/auth'

// Mock dependencies

jest.mock('@/app/actions/auth', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    task: {
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    taskLog: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

describe('Task Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createTask', () => {
    it('should create task successfully', async () => {
      const mockUser = {
        id: 'user-1',
        name: '测试用户',
        workId: '2020010',
      }

      ;(getCurrentUser as jest.Mock).mockResolvedValue(mockUser)
      // 第一次调用：检查重复（返回null，表示没有重复）
      // 第二次调用：查找最后一条任务（返回null，表示没有任务）
      ;(prisma.task.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // 防重复检查
        .mockResolvedValueOnce(null) // 查找最后一条任务
      ;(prisma.task.create as jest.Mock).mockResolvedValue({
        id: 'task-1',
        content: '测试任务',
        location: '测试地点',
        userId: 'user-1',
      })
      ;(prisma.taskLog.create as jest.Mock).mockResolvedValue({})

      const formData = new FormData()
      formData.append('content', '测试任务')
      formData.append('location', '测试地点')

      await createTask(formData)

      expect(prisma.task.create).toHaveBeenCalled()
      expect(prisma.taskLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          taskId: 'task-1',
          operatorId: 'user-1',
          action: 'CREATE',
        }),
      })
    })

    it('should prevent duplicate tasks within 5 seconds', async () => {
      const mockUser = {
        id: 'user-1',
        name: '测试用户',
        workId: '2020010',
      }

      const existingTask = {
        id: 'existing-task',
        content: '测试任务',
        location: '测试地点',
        userId: 'user-1',
        isCompleted: false,
        createdAt: new Date(),
      }

      ;(getCurrentUser as jest.Mock).mockResolvedValue(mockUser)
      // 第一次调用：检查重复（返回已存在的任务）
      ;(prisma.task.findFirst as jest.Mock).mockResolvedValueOnce(existingTask)

      const formData = new FormData()
      formData.append('content', '测试任务')
      formData.append('location', '测试地点')

      await createTask(formData)

      // 应该因为重复而直接返回，不创建新任务
      expect(prisma.task.create).not.toHaveBeenCalled()
    })
  })

  describe('deleteTask', () => {
    it('should delete task successfully by owner', async () => {
      const mockUser = {
        id: 'user-1',
        name: '测试用户',
        workId: '2020010',
        roles: [],
      }

      const mockTask = {
        id: 'task-1',
        userId: 'user-1',
        user: mockUser,
      }

      ;(getCurrentUser as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTask)
      ;(prisma.$transaction as jest.Mock).mockResolvedValue([{}, {}])

      await deleteTask('task-1')

      expect(prisma.$transaction).toHaveBeenCalledWith([
        prisma.taskLog.deleteMany({ where: { taskId: 'task-1' } }),
        prisma.task.delete({ where: { id: 'task-1' } }),
      ])
    })

    it('should allow admin to delete any task', async () => {
      const mockAdmin = {
        id: 'admin-1',
        name: '管理员',
        workId: 'admin',
        roles: [{ name: 'admin' }],
      }

      const mockTask = {
        id: 'task-1',
        userId: 'user-1', // 不是管理员的任务
        user: { id: 'user-1' },
      }

      ;(getCurrentUser as jest.Mock).mockResolvedValue(mockAdmin)
      ;(prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTask)
      ;(prisma.$transaction as jest.Mock).mockResolvedValue([{}, {}])

      await deleteTask('task-1')

      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('should reject deletion by non-owner non-admin', async () => {
      const mockUser = {
        id: 'user-2',
        name: '其他用户',
        workId: '2020011',
        roles: [],
      }

      const mockTask = {
        id: 'task-1',
        userId: 'user-1', // 不是当前用户的任务
        user: { id: 'user-1' },
      }

      ;(getCurrentUser as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTask)

      await expect(deleteTask('task-1')).rejects.toThrow('Forbidden')
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })
  })

  describe('completeTask', () => {
    it('should complete task successfully', async () => {
      const mockUser = {
        id: 'user-1',
        name: '测试用户',
        workId: '2020010',
      }

      ;(getCurrentUser as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.task.update as jest.Mock).mockResolvedValue({
        id: 'task-1',
        isCompleted: true,
      })
      ;(prisma.taskLog.create as jest.Mock).mockResolvedValue({})

      await completeTask('task-1')

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { isCompleted: true },
      })
      expect(prisma.taskLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          taskId: 'task-1',
          action: 'COMPLETE',
        }),
      })
    })
  })
})

