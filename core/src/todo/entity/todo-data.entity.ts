import { DataEntity } from '@mbc-cqrs-serverless/core'

import { TodoAttributes } from '../dto/todo-attributes.dto'

export class TodoDataEntity extends DataEntity {
  attributes: TodoAttributes

  constructor(partial: Partial<TodoDataEntity>) {
    super(partial)
    Object.assign(this, partial)
  }
}
