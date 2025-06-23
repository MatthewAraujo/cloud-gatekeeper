import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { AccessRequestRepository } from '@/domain/cloud-gatekeeper/application/repositories/access-repository'
import { AccessRequest as DomainAccessRequest } from '@/domain/cloud-gatekeeper/enterprise/entities/access-request'
import { DomainEvents } from '@/core/events/domain-events'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

function toPersistence(accessRequest: DomainAccessRequest) {
  return {
    id: accessRequest.id.toString(),
    requesterId: accessRequest.requesterId,
    requesterEmail: accessRequest.requesterEmail,
    project: accessRequest.project,
    status: accessRequest.status,
    approvedById: accessRequest.approvedById ?? null,
    reason: accessRequest.reason ?? null,
    createdAt: accessRequest.createdAt,
    updatedAt: accessRequest.updatedAt,
  }
}

function toDomain(raw: any): DomainAccessRequest {
  return DomainAccessRequest.reconstruct({
    requesterId: raw.requesterId,
    requesterEmail: raw.requesterEmail,
    project: raw.project,
    status: raw.status,
    approvedById: raw.approvedById ?? undefined,
    reason: raw.reason ?? undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }, new UniqueEntityID(raw.id))
}

@Injectable()
export class PrismaAccessRequestRepository extends AccessRequestRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(accessRequest: DomainAccessRequest): Promise<void> {
    const data = toPersistence(accessRequest)
    await this.prisma.accessRequest.create({ data })
    DomainEvents.dispatchEventsForAggregate(accessRequest.id)
  }

  async save(accessRequest: DomainAccessRequest): Promise<void> {
    const data = toPersistence(accessRequest)
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
    return result ? toDomain(result) : null
  }

  async findAll(): Promise<DomainAccessRequest[]> {
    const result = await this.prisma.accessRequest.findMany()
    return result.map(toDomain)
  }
}
