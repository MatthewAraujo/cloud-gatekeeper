import { UniqueEntityID } from "@/core/entities/unique-entity-id"
import { AccessRequest as DomainAccessRequest } from '@/domain/cloud-gatekeeper/enterprise/entities/access-request'



export class PrismaAccessRequestMappers {
  static toPersistence(accessRequest: DomainAccessRequest) {
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

  static toDomain(raw: any): DomainAccessRequest {
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

}

