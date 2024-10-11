import {
  ITaskQueueEventFactory,
  TaskQueueEvent,
} from '@mbc-cqrs-serverless/task'

import { TodoTaskEvent } from '../todo/handler/todo-task.event'

export class TaskQueueEventFactory implements ITaskQueueEventFactory {
  async transformTask(event: TaskQueueEvent): Promise<any[]> {
    return [new TodoTaskEvent().fromSqsRecord(event)]
  }
}
