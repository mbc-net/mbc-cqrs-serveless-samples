import { AttributeValue } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { TaskQueueEvent } from '@mbc-cqrs-serverless/task'

import { TodoDataEntity } from '../entity/todo-data.entity'

/**
 * TodoTaskEvent extends TaskQueueEvent to provide domain-specific access to todo data.
 *
 * This event is created from an SQS message that was triggered by a DynamoDB Stream
 * event on the tasks table.
 *
 * Structure of taskEvent.dynamodb.NewImage:
 * {
 *   pk: "TASK#tenantCode",
 *   sk: "ulid",
 *   input: {
 *     M: {
 *       pk: "TODO#tenantCode",
 *       sk: "ulid",
 *       name: "Task name",
 *       attributes: { ... }
 *     }
 *   }
 * }
 *
 * The 'input' field contains the original todo data that triggered the task.
 * This allows the event handler to access the todo entity for processing.
 */
export class TodoTaskEvent extends TaskQueueEvent {
  private _todo: any

  /**
   * Get the TodoDataEntity from the task event.
   * The todo data is unmarshalled from the DynamoDB NewImage input field.
   */
  get todo(): TodoDataEntity {
    if (!this._todo) {
      this._todo = new TodoDataEntity(
        unmarshall(
          this.taskEvent.dynamodb.NewImage?.input?.M as {
            [key: string]: AttributeValue
          },
        ),
      )
    }
    return this._todo
  }
}
