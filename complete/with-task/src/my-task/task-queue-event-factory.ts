import {
  ITaskQueueEventFactory,
  TaskQueueEvent,
} from '@mbc-cqrs-serverless/task'

import { TodoTaskEvent } from '../todo/handler/todo-task.event'

/**
 * TaskQueueEventFactory transforms SQS task events into domain-specific events.
 *
 * This factory is called when a task is dequeued from the SQS queue.
 * It converts the generic TaskQueueEvent into a TodoTaskEvent that can be
 * processed by the TodoTaskEventHandler.
 *
 * Flow:
 * 1. Task is inserted into tasks DynamoDB table
 * 2. DynamoDB Stream triggers the task processor
 * 3. Task is sent to SQS queue
 * 4. SQS consumer calls this factory to transform the event
 * 5. The transformed event is dispatched to the appropriate handler
 */
export class TaskQueueEventFactory implements ITaskQueueEventFactory {
  async transformTask(event: TaskQueueEvent): Promise<any[]> {
    return [new TodoTaskEvent().fromSqsRecord(event)]
  }
}
