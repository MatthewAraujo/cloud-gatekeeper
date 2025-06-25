import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { Prisma, User } from 'generated/prisma'
import { UserRepository } from '@/domain/cloud-gatekeeper/application/repositories/user-repository'

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findBySlackId(slackId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { slackId },
    })
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    })
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    })
  }
} 