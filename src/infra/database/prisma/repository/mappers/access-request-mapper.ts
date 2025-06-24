import { UniqueEntityID } from "@/core/entities/unique-entity-id"
import { AccessRequest as DomainAccessRequest } from '@/domain/cloud-gatekeeper/enterprise/entities/access-request'



export class PrismaAccessRequestMappers {
  static toPersistence(accessRequest: DomainAccessRequest) {
    return {
      id: accessRequest.id.toString(),
      requesterId: accessRequest.requesterId,
      requesterEmail: accessRequest.requesterEmail,
      username: accessRequest.username,
      project: accessRequest.project,
      permissions: accessRequest.permissions,
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
      username: raw.username,
      project: raw.project,
      permissions: raw.permissions as string[],
      status: raw.status,
      approvedById: raw.approvedById ?? undefined,
      reason: raw.reason ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    }, new UniqueEntityID(raw.id))
  }

}

