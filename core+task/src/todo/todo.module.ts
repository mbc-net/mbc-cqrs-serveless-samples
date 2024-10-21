import { CommandModule } from '@mbc-cqrs-serverless/core'
import { Module } from '@nestjs/common'
import { MyTaskModule } from 'src/my-task/my-task.module'

import { TodoDataSyncRdsHandler } from './handler/todo-rds.handler'
import { TodoTaskEventHandler } from './handler/todo-task.event.handler'
import { TodoController } from './todo.controller'
import { TodoService } from './todo.service'

@Module({
  imports: [
    CommandModule.register({
      tableName: 'todo',
      dataSyncHandlers: [TodoDataSyncRdsHandler],
    }),
    MyTaskModule,
  ],
  controllers: [TodoController],
  providers: [TodoService, TodoTaskEventHandler],
})
export class TodoModule {}
