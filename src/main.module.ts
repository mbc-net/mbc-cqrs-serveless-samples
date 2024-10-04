import { Module } from '@nestjs/common'

import { CustomEventFactory } from './event-factory'
import { prismaLoggingMiddleware, PrismaModule } from './prisma'
import { TaskModule } from './task/task.module'

@Module({
  imports: [
    PrismaModule.forRoot({
      isGlobal: true,
      prismaServiceOptions: {
        middlewares: [prismaLoggingMiddleware()],
        prismaOptions: {
          log:
            process.env.NODE_ENV !== 'local'
              ? ['error']
              : ['info', 'error', 'warn', 'query'],
        },
        explicitConnect: false,
      },
    }),
    TaskModule,
  ],
  providers: [CustomEventFactory],
})
export class MainModule {}
