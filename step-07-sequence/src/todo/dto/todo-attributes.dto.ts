import { ApiProperty } from '@nestjs/swagger'
import { TodoStatus } from '@prisma/client'
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator'

// Re-export TodoStatus from Prisma for use in other files
export { TodoStatus }

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
