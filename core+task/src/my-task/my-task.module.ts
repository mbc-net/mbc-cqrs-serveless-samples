import { TaskModule } from '@mbc-cqrs-serverless/task'
import { Module } from '@nestjs/common'

import { TaskQueueEventFactory } from './task-queue-event-factory'

@Module({
  imports: [
    TaskModule.register({
      taskQueueEventFactory: TaskQueueEventFactory,
    }),
  ],
  exports: [TaskModule],
})
export class MyTaskModule {}
