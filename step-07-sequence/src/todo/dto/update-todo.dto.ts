import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, Min } from 'class-validator'
import { Type } from 'class-transformer'

import { TodoAttributes } from './todo-attributes.dto'

export class UpdateTodoDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Todo name/title' })
  name?: string

  @IsOptional()
  @ApiPropertyOptional({ description: 'Todo attributes (description, status, dueDate)' })
  attributes?: TodoAttributes

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ description: 'Version for optimistic locking' })
  version: number
}
