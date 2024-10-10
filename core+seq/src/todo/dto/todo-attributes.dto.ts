import { ApiProperty } from '@nestjs/swagger'
import { TodoStatus } from '@prisma/client'
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator'

export class TodoAttributes {
  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @ApiProperty({ enum: TodoStatus })
  @IsEnum(TodoStatus)
  status?: TodoStatus

  @IsOptional()
  @IsDateString()
  dueDate?: string
}
