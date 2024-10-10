import { Type } from 'class-transformer'
import { IsOptional, IsString, ValidateNested } from 'class-validator'

import { TodoAttributes } from './todo-attributes.dto'

export class CreateTodoDto {
  @IsString()
  name: string

  @Type(() => TodoAttributes)
  @ValidateNested()
  @IsOptional()
  attributes?: TodoAttributes

  constructor(partial: Partial<CreateTodoDto>) {
    Object.assign(this, partial)
  }
}
