import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { TodoController } from '../src/todo/todo.controller'
import { TodoService } from '../src/todo/todo.service'
import { TodoDataEntity } from '../src/todo/entity/todo-data.entity'
import { SearchTodoResultDto } from '../src/todo/dto/search-todo.dto'
import { TodoStatus } from '../src/todo/dto/todo-attributes.dto'

// Mock getUserContext
jest.mock('@mbc-cqrs-serverless/core', () => ({
  ...jest.requireActual('@mbc-cqrs-serverless/core'),
  getUserContext: jest.fn().mockReturnValue({
    tenantCode: 'TEST',
    userId: 'user-123',
  }),
  INVOKE_CONTEXT: () => (target: any, key: string, index: number) => {
    // Decorator stub
  },
}))

describe('TodoController (e2e)', () => {
  let app: INestApplication
  let todoService: jest.Mocked<TodoService>

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
  } as unknown as TodoDataEntity

  beforeAll(async () => {
    const mockTodoService = {
      create: jest.fn().mockResolvedValue(mockTodoData),
      findOne: jest.fn().mockResolvedValue(mockTodoData),
      findAll: jest.fn().mockResolvedValue(
        new SearchTodoResultDto([mockTodoData], 1, 1, 10),
      ),
      update: jest.fn().mockResolvedValue(mockTodoData),
      remove: jest.fn().mockResolvedValue({ ...mockTodoData, isDeleted: true }),
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TodoController],
      providers: [{ provide: TodoService, useValue: mockTodoService }],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    )
    await app.init()

    todoService = moduleFixture.get(TodoService)
  })

  afterAll(async () => {
    await app.close()
  })

  describe('/api/todo (POST)', () => {
    it('should create a new todo', () => {
      return request(app.getHttpServer())
        .post('/api/todo')
        .send({
          name: 'New Todo',
          attributes: {
            description: 'New description',
            status: 'PENDING',
          },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeDefined()
          expect(res.body.name).toBe(mockTodoData.name)
        })
    })

    it('should return 400 for invalid request body', () => {
      return request(app.getHttpServer())
        .post('/api/todo')
        .send({
          // missing required 'name' field
          attributes: {
            description: 'New description',
          },
        })
        .expect(400)
    })
  })

  describe('/api/todo/:pk/:sk (GET)', () => {
    it('should return a todo by pk and sk', () => {
      return request(app.getHttpServer())
        .get('/api/todo/TODO%23TEST/01HXYZ123456789')
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined()
          expect(res.body.pk).toBe(mockTodoData.pk)
          expect(res.body.sk).toBe(mockTodoData.sk)
        })
    })
  })

  describe('/api/todo (GET)', () => {
    it('should return paginated todos', () => {
      return request(app.getHttpServer())
        .get('/api/todo')
        .query({ page: 1, limit: 10 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined()
          expect(res.body.data).toBeDefined()
          expect(res.body.total).toBeDefined()
        })
    })

    it('should filter by status', () => {
      return request(app.getHttpServer())
        .get('/api/todo')
        .query({ status: 'COMPLETED', page: 1, limit: 10 })
        .expect(200)
    })
  })

  describe('/api/todo/:pk/:sk (PATCH)', () => {
    it('should update a todo', () => {
      todoService.update.mockResolvedValueOnce({
        ...mockTodoData,
        name: 'Updated Todo',
        version: 2,
      } as unknown as TodoDataEntity)

      return request(app.getHttpServer())
        .patch('/api/todo/TODO%23TEST/01HXYZ123456789')
        .send({
          name: 'Updated Todo',
          version: 1,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined()
        })
    })

    it('should return 400 without version', () => {
      return request(app.getHttpServer())
        .patch('/api/todo/TODO%23TEST/01HXYZ123456789')
        .send({
          name: 'Updated Todo',
          // missing required 'version' field
        })
        .expect(400)
    })
  })

  describe('/api/todo/:pk/:sk (DELETE)', () => {
    it('should soft delete a todo', () => {
      todoService.remove.mockResolvedValueOnce({
        ...mockTodoData,
        isDeleted: true,
      } as unknown as TodoDataEntity)

      return request(app.getHttpServer())
        .delete('/api/todo/TODO%23TEST/01HXYZ123456789')
        .query({ version: 1 })
        .expect(200)
    })
  })
})
