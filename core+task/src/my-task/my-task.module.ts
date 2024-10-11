import { TaskModule } from '@mbc-cqrs-serverless/task'
import { Module } from '@nestjs/common'

import { TodoTaskEventHandler } from '../todo/handler/todo-task.event.handler'
import { TaskQueueEventFactory } from './task-queue-event-factory'

@Module({
  imports: [
    TaskModule.register({
      taskQueueEventFactory: TaskQueueEventFactory,
    }),
  ],
  providers: [TodoTaskEventHandler],
  exports: [TaskModule],
})
export class MyTaskModule {}
