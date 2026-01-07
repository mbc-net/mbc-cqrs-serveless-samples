import {
  CommandService,
  DataService,
  generateId,
  getUserContext,
  IInvoke,
  VERSION_FIRST,
} from '@mbc-cqrs-serverless/core'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { generateTodoPk, generateTodoSk, TODO_PK_PREFIX } from 'src/helpers'

import { CreateTodoDto } from './dto/create-todo.dto'
import { TodoCommandDto } from './dto/todo-command.dto'
import { TodoDataEntity } from './entity/todo-data.entity'

@Injectable()
export class TodoService {
  private readonly logger = new Logger(TodoService.name)

  constructor(
    private readonly commandService: CommandService,
    private readonly dataService: DataService,
  ) {}

  /**
   * Create a new Todo item
   * This publishes a command to DynamoDB which will be processed by Step Functions
   */
  async create(
    createDto: CreateTodoDto,
    opts: { invokeContext: IInvoke },
  ): Promise<TodoDataEntity> {
    // Get tenant code from user context (JWT token)
    const { tenantCode } = getUserContext(opts.invokeContext)

    // Generate partition key and sort key
    const pk = generateTodoPk(tenantCode)
    const sk = generateTodoSk()

    // Create command DTO
    const todo = new TodoCommandDto({
      pk,
      sk,
      id: generateId(pk, sk),
      tenantCode,
      code: sk,
      type: TODO_PK_PREFIX,
      version: VERSION_FIRST,
      name: createDto.name,
      attributes: createDto.attributes,
    })

    this.logger.debug('Creating todo:', todo)

    // Publish command to DynamoDB
    // This triggers Step Functions workflow which will:
    // 1. Save command to command table
    // 2. Copy data to data table
    // 3. Trigger data sync handlers (added in step-03)
    const item = await this.commandService.publish(todo, opts)

    return new TodoDataEntity(item as TodoDataEntity)
  }

  /**
   * Get a single Todo item by pk and sk
   * This retrieves data from the DynamoDB data table
   */
  async findOne(pk: string, sk: string): Promise<TodoDataEntity> {
    this.logger.debug(`Finding todo: pk=${pk}, sk=${sk}`)

    // Get item from data table using DataService
    // DataService reads from the "data" table which contains the current state
    const item = await this.dataService.getItem({
      pk,
      sk,
    })

    if (!item) {
      throw new NotFoundException(`Todo not found: pk=${pk}, sk=${sk}`)
    }

    return new TodoDataEntity(item as TodoDataEntity)
  }
}
