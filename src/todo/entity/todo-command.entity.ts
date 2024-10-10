import { CommandEntity } from '@mbc-cqrs-serverless/core'

import { TodoAttributes } from '../dto/todo-attributes.dto'

export class TodoCommandEntity extends CommandEntity {
  attributes: TodoAttributes

  constructor(partial: Partial<TodoCommandEntity>) {
    super()
    Object.assign(this, partial)
  }
}
