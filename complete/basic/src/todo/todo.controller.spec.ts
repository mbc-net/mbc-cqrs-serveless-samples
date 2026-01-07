import { Test, TestingModule } from '@nestjs/testing'
import * as core from '@mbc-cqrs-serverless/core'
import { TodoController } from './todo.controller'
import { TodoService } from './todo.service'
import { CreateTodoDto } from './dto/create-todo.dto'
import { UpdateTodoDto } from './dto/update-todo.dto'
import { SearchTodoDto, SearchTodoResultDto } from './dto/search-todo.dto'
import { TodoDataEntity } from './entity/todo-data.entity'
import { TodoStatus } from './dto/todo-attributes.dto'

// Mock getUserContext
jest.mock('@mbc-cqrs-serverless/core', () => ({
  ...jest.requireActual('@mbc-cqrs-serverless/core'),
  getUserContext: jest.fn().mockReturnValue({
    tenantCode: 'TEST',
    userId: 'user-123',
  }),
}))

describe('TodoController', () => {
  let controller: TodoController
  let service: jest.Mocked<TodoService>

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

  const mockTodoData = new TodoDataEntity({
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
  } as TodoDataEntity)

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodoController],
      providers: [{ provide: TodoService, useValue: mockService }],
    }).compile()

    controller = module.get<TodoController>(TodoController)
    service = module.get(TodoService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('create', () => {
    it('should create a new todo', async () => {
      const createDto: CreateTodoDto = {
        name: 'New Todo',
        attributes: {
          description: 'New description',
          status: TodoStatus.PENDING,
        },
      }

      service.create.mockResolvedValue(mockTodoData)

      const result = await controller.create(
        mockInvokeContext as any,
        createDto,
      )

      expect(service.create).toHaveBeenCalledWith(createDto, {
        invokeContext: mockInvokeContext,
      })
      expect(result).toBe(mockTodoData)
    })
  })

  describe('findOne', () => {
    it('should return a todo by pk and sk', async () => {
      service.findOne.mockResolvedValue(mockTodoData)

      const result = await controller.findOne(
        'TODO#TEST',
        '01HXYZ123456789',
      )

      expect(service.findOne).toHaveBeenCalledWith(
        'TODO#TEST',
        '01HXYZ123456789',
      )
      expect(result).toBe(mockTodoData)
    })
  })

  describe('findAll', () => {
    it('should return paginated todos', async () => {
      const searchDto: SearchTodoDto = {
        page: 1,
        limit: 10,
      }

      const mockResult = new SearchTodoResultDto([mockTodoData], 1, 1, 10)
      service.findAll.mockResolvedValue(mockResult)

      const result = await controller.findAll(
        mockInvokeContext as any,
        searchDto,
      )

      expect(service.findAll).toHaveBeenCalledWith('TEST', searchDto)
      expect(result).toBe(mockResult)
    })
  })

  describe('update', () => {
    it('should update a todo', async () => {
      const updateDto: UpdateTodoDto = {
        name: 'Updated Todo',
        version: 1,
      }

      const updatedTodo = new TodoDataEntity({
        ...mockTodoData,
        name: 'Updated Todo',
        version: 2,
      } as TodoDataEntity)

      service.update.mockResolvedValue(updatedTodo)

      const result = await controller.update(
        mockInvokeContext as any,
        'TODO#TEST',
        '01HXYZ123456789',
        updateDto,
      )

      expect(service.update).toHaveBeenCalledWith(
        'TODO#TEST',
        '01HXYZ123456789',
        updateDto,
        { invokeContext: mockInvokeContext },
      )
      expect(result).toBe(updatedTodo)
    })
  })

  describe('remove', () => {
    it('should remove a todo', async () => {
      const deletedTodo = new TodoDataEntity({
        ...mockTodoData,
        isDeleted: true,
      } as TodoDataEntity)

      service.remove.mockResolvedValue(deletedTodo)

      const result = await controller.remove(
        mockInvokeContext as any,
        'TODO#TEST',
        '01HXYZ123456789',
        1,
      )

      expect(service.remove).toHaveBeenCalledWith(
        'TODO#TEST',
        '01HXYZ123456789',
        1,
        { invokeContext: mockInvokeContext },
      )
      expect(result).toBe(deletedTodo)
    })
  })
})
