import {
  DetailDto,
  getUserContext,
  IInvoke,
  INVOKE_CONTEXT,
  SearchDto,
} from '@mbc-cqrs-severless/core'
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

import { CreateTaskDto } from './dto/create-task.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { TaskDataEntity } from './entity/task-data.entity'
import { TaskService } from './task.service'

@Controller('api/task')
@ApiTags('task')
export class TaskController {
  private readonly logger = new Logger(TaskController.name)

  constructor(private readonly taskService: TaskService) {}

  @Post('/')
  async create(
    @INVOKE_CONTEXT() invokeContext: IInvoke,
    @Body() createDto: CreateTaskDto,
  ): Promise<TaskDataEntity> {
    this.logger.debug('createDto:', createDto)
    return this.taskService.create(createDto, { invokeContext })
  }

  @Get('/')
  async findAll(
    @INVOKE_CONTEXT() invokeContext: IInvoke,
    @Query() searchDto: SearchDto,
  ) {
    this.logger.debug('searchDto:', searchDto)
    const { tenantCode } = getUserContext(invokeContext)
    return await this.taskService.findAll(tenantCode, searchDto)
  }

  @Get('/:pk/:sk')
  async findOne(@Param() detailDto: DetailDto): Promise<TaskDataEntity> {
    return this.taskService.findOne(detailDto)
  }

  @Patch('/:pk/:sk')
  async update(
    @INVOKE_CONTEXT() invokeContext: IInvoke,
    @Param() detailDto: DetailDto,
    @Body() updateDto: UpdateTaskDto,
  ) {
    this.logger.debug('updateDto:', updateDto)
    return this.taskService.update(detailDto, updateDto, { invokeContext })
  }

  @Delete('/:pk/:sk')
  async remove(
    @INVOKE_CONTEXT() invokeContext: IInvoke,
    @Param() detailDto: DetailDto,
  ) {
    return this.taskService.remove(detailDto, { invokeContext })
  }
}
