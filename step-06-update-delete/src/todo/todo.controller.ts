import { getUserContext, IInvoke, INVOKE_CONTEXT } from '@mbc-cqrs-serverless/core'
import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { CreateTodoDto } from './dto/create-todo.dto'
import { SearchTodoDto, SearchTodoResultDto } from './dto/search-todo.dto'
import { UpdateTodoDto } from './dto/update-todo.dto'
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

  /**
   * Update a Todo item
   * PATCH /api/todo/:pk/:sk
   *
   * Requires version in body for optimistic locking.
   * Only provided fields will be updated.
   *
   * Example: PATCH /api/todo/TODO%23MBC/01HXY...
   * Body: { "name": "Updated Name", "version": 1 }
   */
  @Patch(':pk/:sk')
  async update(
    @INVOKE_CONTEXT() invokeContext: IInvoke,
    @Param('pk') pk: string,
    @Param('sk') sk: string,
    @Body() updateDto: UpdateTodoDto,
  ): Promise<TodoDataEntity> {
    this.logger.debug(`update: pk=${pk}, sk=${sk}`, updateDto)
    return this.todoService.update(pk, sk, updateDto, { invokeContext })
  }

  /**
   * Delete a Todo item (soft delete)
   * DELETE /api/todo/:pk/:sk?version=1
   *
   * Requires version as query parameter for optimistic locking.
   * This performs a soft delete (sets isDeleted = true).
   *
   * Example: DELETE /api/todo/TODO%23MBC/01HXY...?version=1
   */
  @Delete(':pk/:sk')
  async remove(
    @INVOKE_CONTEXT() invokeContext: IInvoke,
    @Param('pk') pk: string,
    @Param('sk') sk: string,
    @Query('version') version: number,
  ): Promise<TodoDataEntity> {
    this.logger.debug(`remove: pk=${pk}, sk=${sk}, version=${version}`)
    return this.todoService.remove(pk, sk, version, { invokeContext })
  }
}
