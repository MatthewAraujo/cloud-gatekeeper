import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { LogRepository } from '@/domain/logs/repositories/log-repository'
import { Log } from '@/domain/logs/entities/log'

@Injectable()
export class PrismaLogRepository extends LogRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async create(log: Log): Promise<void> {
    await this.prisma.log.create({
      data: {
        level: log.level,
        message: log.message,
        meta: log.meta ?? {},
        timestamp: log.timestamp,
      },
    })
  }

  async findAll(): Promise<Log[]> {
    const logs = await this.prisma.log.findMany({ orderBy: { timestamp: 'desc' } })
    return logs.map(
      (l) =>
        new Log({
          id: l.id,
          timestamp: l.timestamp,
          level: l.level,
          message: l.message,
          meta: l.meta,
        })
    )
  }
} 