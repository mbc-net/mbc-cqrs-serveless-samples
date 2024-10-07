import { CommandModule } from '@mbc-cqrs-serverless/core'
import { Module } from '@nestjs/common'

import { TaskDataSyncRdsHandler } from './handler/task-rds.handler'
import { TaskController } from './task.controller'
import { TaskService } from './task.service'

@Module({
  imports: [
    CommandModule.register({
      tableName: 'todo_task',
      dataSyncHandlers: [TaskDataSyncRdsHandler],
    }),
  ],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
