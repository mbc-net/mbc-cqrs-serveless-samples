import { PartialType } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import {
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

import { TodoAttributes } from './todo-attributes.dto'

export class UpdateTodoAttributes extends PartialType(TodoAttributes) {}

export class UpdateTodoDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsOptional()
  isDeleted?: boolean

  @Type(() => UpdateTodoAttributes)
  @ValidateNested()
  @IsOptional()
  attributes?: UpdateTodoAttributes

  constructor(partial: Partial<UpdateTodoDto>) {
    Object.assign(this, partial)
  }
}
