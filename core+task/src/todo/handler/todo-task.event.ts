import { AttributeValue } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { TaskQueueEvent } from '@mbc-cqrs-serverless/task'

import { TodoDataEntity } from '../entity/todo-data.entity'

export class TodoTaskEvent extends TaskQueueEvent {
  private _todo: any

  get todo() {
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
