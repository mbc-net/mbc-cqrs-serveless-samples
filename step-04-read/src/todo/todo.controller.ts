import { IInvoke, INVOKE_CONTEXT } from '@mbc-cqrs-serverless/core'
import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { CreateTodoDto } from './dto/create-todo.dto'
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
  // GET /api/todo - findAll (step-05-search)
  // PATCH /api/todo/:pk/:sk - update (step-06-update-delete)
  // DELETE /api/todo/:pk/:sk - remove (step-06-update-delete)
}
