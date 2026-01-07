import { ApiProperty } from '@nestjs/swagger'
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator'

// TodoStatus enum (will be synced with Prisma in step-03)
export enum TodoStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

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
