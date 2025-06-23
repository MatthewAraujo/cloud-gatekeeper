import { Injectable } from '@nestjs/common'
import { PrismaLogRepository } from '@/infra/database/prisma/repository/prisma-log.repository'
import { Log } from '@/domain/logs/entities/log'

@Injectable()
export class LogService {
  constructor(private readonly logRepository: PrismaLogRepository) { }

  async log(level: string, message: string, meta?: any) {
    const log = new Log({
      level,
      message,
      meta,
      timestamp: new Date(),
    })
    await this.logRepository.create(log)
  }
} 