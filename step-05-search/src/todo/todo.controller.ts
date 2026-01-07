import { getUserContext, IInvoke, INVOKE_CONTEXT } from '@mbc-cqrs-serverless/core'
import { Body, Controller, Get, Logger, Param, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { CreateTodoDto } from './dto/create-todo.dto'
import { SearchTodoDto, SearchTodoResultDto } from './dto/search-todo.dto'
import { TodoDataEntity } from './entity/todo-data.entity'
import { TodoService } from './todo.service'

@Controller('api/todo')
@ApiTags('todo')
export class TodoController {
  private readonly logger = new Logger(TodoController.name)

  constructor(private readonly todoService: TodoService) {}

  /**
   * Create a new Todo item
   * POST /api/todo
   */
  @Post('/')
  async create(
    @INVOKE_CONTEXT() invokeContext: IInvoke,
    @Body() createDto: CreateTodoDto,
  ): Promise<TodoDataEntity> {
    this.logger.debug('createDto:', createDto)
    return this.todoService.create(createDto, { invokeContext })
  }

  /**
   * Search and list Todo items with filtering and pagination
   * GET /api/todo
   *
   * Query parameters:
   * - name: Search by name (partial match)
   * - status: Filter by status (PENDING, IN_PROGRESS, COMPLETED, CANCELED)
   * - page: Page number (1-based, default: 1)
   * - limit: Items per page (default: 10, max: 100)
   * - sortBy: Sort field (name, status, createdAt, updatedAt)
   * - sortOrder: Sort order (ASC, DESC)
   *
   * Example: GET /api/todo?status=PENDING&page=1&limit=10
   */
  @Get('/')
  async findAll(
    @INVOKE_CONTEXT() invokeContext: IInvoke,
    @Query() searchDto: SearchTodoDto,
  ): Promise<SearchTodoResultDto<TodoDataEntity>> {
    const { tenantCode } = getUserContext(invokeContext)
    this.logger.debug(`findAll: tenantCode=${tenantCode}`, searchDto)
    return this.todoService.findAll(tenantCode, searchDto)
  }

  /**
   * Get a single Todo item by pk and sk
   * GET /api/todo/:pk/:sk
   *
   * Example: GET /api/todo/TODO%23MBC/01HXY...
   * Note: pk contains '#' which must be URL-encoded as %23
   */
  @Get(':pk/:sk')
  async findOne(
    @Param('pk') pk: string,
    @Param('sk') sk: string,
  ): Promise<TodoDataEntity> {
    this.logger.debug(`findOne: pk=${pk}, sk=${sk}`)
    return this.todoService.findOne(pk, sk)
  }

  // Other endpoints will be added in subsequent steps:
  // PATCH /api/todo/:pk/:sk - update (step-06-update-delete)
  // DELETE /api/todo/:pk/:sk - remove (step-06-update-delete)
}
