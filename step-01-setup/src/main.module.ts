import { Module } from '@nestjs/common'

import { CustomEventFactory } from './event-factory'
import { prismaLoggingMiddleware, PrismaModule } from './prisma'

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
    // TodoModule will be added in step-02
  ],
  providers: [CustomEventFactory],
})
export class MainModule {}
