import { CommandDto } from '@mbc-cqrs-serverless/core'
import { Type } from 'class-transformer'
import { IsOptional, ValidateNested } from 'class-validator'

import { TodoAttributes } from './todo-attributes.dto'

export class TodoCommandDto extends CommandDto {
  @Type(() => TodoAttributes)
  @ValidateNested()
  @IsOptional()
  attributes?: TodoAttributes

  constructor(partial: Partial<TodoCommandDto>) {
    super()
    Object.assign(this, partial)
  }
}
