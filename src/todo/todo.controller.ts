import {
  DetailDto,
  getUserContext,
  IInvoke,
  INVOKE_CONTEXT,
  SearchDto,
} from '@mbc-cqrs-serverless/core'
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
import { UpdateTodoDto } from './dto/update-todo.dto'
import { TodoDataEntity } from './entity/todo-data.entity'
import { TodoService } from './todo.service'

@Controller('api/todo')
@ApiTags('todo')
export class TodoController {
  private readonly logger = new Logger(TodoController.name)

  constructor(private readonly todoService: TodoService) {}

  @Post('/')
  async create(
    @INVOKE_CONTEXT() invokeContext: IInvoke,
    @Body() createDto: CreateTodoDto,
  ): Promise<TodoDataEntity> {
    this.logger.debug('createDto:', createDto)
    return this.todoService.create(createDto, { invokeContext })
  }

  @Get('/')
  async findAll(
    @INVOKE_CONTEXT() invokeContext: IInvoke,
    @Query() searchDto: SearchDto,
  ) {
    this.logger.debug('searchDto:', searchDto)
    const { tenantCode } = getUserContext(invokeContext)
    return await this.todoService.findAll(tenantCode, searchDto)
  }

  @Get('/:pk/:sk')
  async findOne(@Param() detailDto: DetailDto): Promise<TodoDataEntity> {
    return this.todoService.findOne(detailDto)
  }

  @Patch('/:pk/:sk')
  async update(
    @INVOKE_CONTEXT() invokeContext: IInvoke,
    @Param() detailDto: DetailDto,
    @Body() updateDto: UpdateTodoDto,
  ) {
    this.logger.debug('updateDto:', updateDto)
    return this.todoService.update(detailDto, updateDto, { invokeContext })
  }

  @Delete('/:pk/:sk')
  async remove(
    @INVOKE_CONTEXT() invokeContext: IInvoke,
    @Param() detailDto: DetailDto,
  ) {
    return this.todoService.remove(detailDto, { invokeContext })
  }
}
