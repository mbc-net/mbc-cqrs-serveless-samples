import { CommandModule } from '@mbc-cqrs-serverless/core'
import { Module } from '@nestjs/common'
import { SeqModule } from 'src/seq/seq.module'

import { TodoDataSyncRdsHandler } from './handler/todo-rds.handler'
import { TodoController } from './todo.controller'
import { TodoService } from './todo.service'

@Module({
  imports: [
    CommandModule.register({
      tableName: 'todo',
      dataSyncHandlers: [TodoDataSyncRdsHandler],
    }),
    SeqModule,
  ],
  controllers: [TodoController],
  providers: [TodoService],
})
export class TodoModule {}
