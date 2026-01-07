import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import {
  CommandService,
  DataService,
} from '@mbc-cqrs-serverless/core'
import { SequencesService } from '@mbc-cqrs-serverless/sequence'
import { TodoService } from './todo.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateTodoDto } from './dto/create-todo.dto'
import { UpdateTodoDto } from './dto/update-todo.dto'
import { SearchTodoDto } from './dto/search-todo.dto'
import { TodoStatus } from './dto/todo-attributes.dto'

// Mock getUserContext
jest.mock('@mbc-cqrs-serverless/core', () => ({
  ...jest.requireActual('@mbc-cqrs-serverless/core'),
  getUserContext: jest.fn().mockReturnValue({
    tenantCode: 'TEST',
    userId: 'user-123',
  }),
}))

describe('TodoService', () => {
  let service: TodoService
  let commandService: jest.Mocked<CommandService>
  let dataService: jest.Mocked<DataService>
  let prismaService: any
  let sequencesService: jest.Mocked<SequencesService>

  const mockInvokeContext = {
    event: {
      requestContext: {
        authorizer: {
          claims: {
            'custom:tenant_code': 'TEST',
            sub: 'user-123',
          },
        },
      },
      headers: {
        'x-forwarded-for': '127.0.0.1',
      },
    },
  }

  const mockTodoData = {
    pk: 'TODO#TEST',
    sk: '01HXYZ123456789',
    id: 'TODO#TEST#01HXYZ123456789',
    tenantCode: 'TEST',
    code: '01HXYZ123456789',
    type: 'TODO',
    version: 1,
    seq: 1,
    name: 'Test Todo',
    attributes: {
      description: 'Test description',
      status: TodoStatus.PENDING,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'user-123',
    updatedBy: 'user-123',
    createdIp: '127.0.0.1',
    updatedIp: '127.0.0.1',
  }

  beforeEach(async () => {
    const mockCommandService = {
      publish: jest.fn(),
      publishPartialUpdate: jest.fn(),
    }

    const mockDataService = {
      getItem: jest.fn(),
    }

    const mockPrismaService = {
      todo: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    }

    const mockSequencesService = {
      generateSequenceItem: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoService,
        { provide: CommandService, useValue: mockCommandService },
        { provide: DataService, useValue: mockDataService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SequencesService, useValue: mockSequencesService },
      ],
    }).compile()

    service = module.get<TodoService>(TodoService)
    commandService = module.get(CommandService)
    dataService = module.get(DataService)
    prismaService = module.get(PrismaService)
    sequencesService = module.get(SequencesService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should create a new todo with sequence number', async () => {
      const createDto: CreateTodoDto = {
        name: 'New Todo',
        attributes: {
          description: 'New description',
          status: TodoStatus.PENDING,
        },
      }

      sequencesService.generateSequenceItem.mockResolvedValue({
        no: 1,
        formattedNo: '0001',
      } as any)

      commandService.publish.mockResolvedValue(mockTodoData as any)

      const result = await service.create(createDto, {
        invokeContext: mockInvokeContext as any,
      })

      expect(sequencesService.generateSequenceItem).toHaveBeenCalledWith(
        {
          tenantCode: 'TEST',
          typeCode: 'TODO',
        },
        { invokeContext: mockInvokeContext },
      )
      expect(commandService.publish).toHaveBeenCalled()
      expect(result).toBeDefined()
      expect(result.name).toBe(mockTodoData.name)
    })
  })

  describe('findOne', () => {
    it('should return a todo when found', async () => {
      dataService.getItem.mockResolvedValue(mockTodoData as any)

      const result = await service.findOne('TODO#TEST', '01HXYZ123456789')

      expect(dataService.getItem).toHaveBeenCalledWith({
        pk: 'TODO#TEST',
        sk: '01HXYZ123456789',
      })
      expect(result).toBeDefined()
      expect(result.name).toBe(mockTodoData.name)
    })

    it('should throw NotFoundException when todo not found', async () => {
      dataService.getItem.mockResolvedValue(null)

      await expect(
        service.findOne('TODO#TEST', 'nonexistent'),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('findAll', () => {
    it('should return paginated todos from RDS', async () => {
      const searchDto: SearchTodoDto = {
        page: 1,
        limit: 10,
      }

      const mockPrismaTodos = [
        {
          id: 'todo-1',
          pk: 'TODO#TEST',
          sk: '01HXYZ123456789',
          tenantCode: 'TEST',
          name: 'Todo 1',
          description: 'Description 1',
          status: 'PENDING',
          dueDate: null,
          version: 1,
          createdBy: 'user-123',
          updatedBy: 'user-123',
          createdIp: '127.0.0.1',
          updatedIp: '127.0.0.1',
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
        },
      ]

      prismaService.todo.findMany.mockResolvedValue(mockPrismaTodos)
      prismaService.todo.count.mockResolvedValue(1)

      const result = await service.findAll('TEST', searchDto)

      expect(prismaService.todo.findMany).toHaveBeenCalledWith({
        where: {
          tenantCode: 'TEST',
          isDeleted: false,
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      })
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('should filter by name when provided', async () => {
      const searchDto: SearchTodoDto = {
        name: 'search term',
        page: 1,
        limit: 10,
      }

      prismaService.todo.findMany.mockResolvedValue([])
      prismaService.todo.count.mockResolvedValue(0)

      await service.findAll('TEST', searchDto)

      expect(prismaService.todo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'search term' },
          }),
        }),
      )
    })

    it('should filter by status when provided', async () => {
      const searchDto: SearchTodoDto = {
        status: 'COMPLETED' as any,
        page: 1,
        limit: 10,
      }

      prismaService.todo.findMany.mockResolvedValue([])
      prismaService.todo.count.mockResolvedValue(0)

      await service.findAll('TEST', searchDto)

      expect(prismaService.todo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'COMPLETED',
          }),
        }),
      )
    })
  })

  describe('update', () => {
    it('should update a todo with optimistic locking', async () => {
      const updateDto: UpdateTodoDto = {
        name: 'Updated Todo',
        version: 1,
      }

      dataService.getItem.mockResolvedValue(mockTodoData as any)
      commandService.publishPartialUpdate.mockResolvedValue({
        ...mockTodoData,
        name: 'Updated Todo',
        version: 2,
      } as any)

      const result = await service.update(
        'TODO#TEST',
        '01HXYZ123456789',
        updateDto,
        { invokeContext: mockInvokeContext as any },
      )

      expect(dataService.getItem).toHaveBeenCalledWith({
        pk: 'TODO#TEST',
        sk: '01HXYZ123456789',
      })
      expect(commandService.publishPartialUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          pk: 'TODO#TEST',
          sk: '01HXYZ123456789',
          version: 1,
          name: 'Updated Todo',
        }),
        { invokeContext: mockInvokeContext },
      )
      expect(result).toBeDefined()
    })

    it('should throw NotFoundException when todo not found', async () => {
      const updateDto: UpdateTodoDto = {
        name: 'Updated Todo',
        version: 1,
      }

      dataService.getItem.mockResolvedValue(null)

      await expect(
        service.update('TODO#TEST', 'nonexistent', updateDto, {
          invokeContext: mockInvokeContext as any,
        }),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('should soft delete a todo', async () => {
      dataService.getItem.mockResolvedValue(mockTodoData as any)
      commandService.publishPartialUpdate.mockResolvedValue({
        ...mockTodoData,
        isDeleted: true,
      } as any)

      const result = await service.remove('TODO#TEST', '01HXYZ123456789', 1, {
        invokeContext: mockInvokeContext as any,
      })

      expect(commandService.publishPartialUpdate).toHaveBeenCalledWith(
        {
          pk: 'TODO#TEST',
          sk: '01HXYZ123456789',
          version: 1,
          isDeleted: true,
        },
        { invokeContext: mockInvokeContext },
      )
      expect(result).toBeDefined()
    })

    it('should throw NotFoundException when todo not found', async () => {
      dataService.getItem.mockResolvedValue(null)

      await expect(
        service.remove('TODO#TEST', 'nonexistent', 1, {
          invokeContext: mockInvokeContext as any,
        }),
      ).rejects.toThrow(NotFoundException)
    })
  })
})
