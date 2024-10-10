import { DataListEntity } from '@mbc-cqrs-serverless/core'

import { TodoDataEntity } from './todo-data.entity'

export class TodoDataListEntity extends DataListEntity {
  items: TodoDataEntity[]

  constructor(partial: Partial<TodoDataListEntity>) {
    super(partial)
    Object.assign(this, partial)
  }
}
