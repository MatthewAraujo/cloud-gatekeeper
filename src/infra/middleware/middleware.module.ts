import { Module } from '@nestjs/common'
import { LoggerMiddleware } from './logger.middleware'

@Module({
  imports: [],
  providers: [LoggerMiddleware],
  exports: [LoggerMiddleware],
})
export class MiddlewareModule { } 