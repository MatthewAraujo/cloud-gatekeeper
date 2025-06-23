import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { AccessRequestRepository } from '@/domain/cloud-gatekeeper/application/repositories/access-repository'
import { AccessRequest as DomainAccessRequest } from '@/domain/cloud-gatekeeper/enterprise/entities/access-request'
import { DomainEvents } from '@/core/events/domain-events'
import { PrismaAccessRequestMappers } from './mappers/access-request-mapper'


@Injectable()
export class PrismaAccessRequestRepository extends AccessRequestRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(accessRequest: DomainAccessRequest): Promise<void> {
    const data = PrismaAccessRequestMappers.toPersistence(accessRequest)
    await this.prisma.accessRequest.create({ data })
    DomainEvents.dispatchEventsForAggregate(accessRequest.id)
  }

  async save(accessRequest: DomainAccessRequest): Promise<void> {
    const data = PrismaAccessRequestMappers.toPersistence(accessRequest)
    await this.prisma.accessRequest.update({
      where: { id: data.id },
      data,
    })
    DomainEvents.dispatchEventsForAggregate(accessRequest.id)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.accessRequest.delete({ where: { id } })
  }

  async findById(id: string): Promise<DomainAccessRequest | null> {
    const result = await this.prisma.accessRequest.findUnique({ where: { id } })
    return result ? PrismaAccessRequestMappers.toDomain(result) : null
  }

  async findAll(): Promise<DomainAccessRequest[]> {
    const result = await this.prisma.accessRequest.findMany()
    return result.map(PrismaAccessRequestMappers.toDomain)
  }
}
