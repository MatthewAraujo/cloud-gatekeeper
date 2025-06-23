import { AccessRequest } from "@/domain/cloud-gatekeeper/enterprise/entities/access-request";

export class AccessRequestPresenter {
  static toHTTP(accessRequest: AccessRequest) {
    return {
      id: accessRequest.id.toString(),
      requesterId: accessRequest.requesterId,
      requesterEmail: accessRequest.requesterEmail,
      project: accessRequest.project,
      status: accessRequest.status,
      createdAt: accessRequest.createdAt,
      updatedAt: accessRequest.updatedAt,
    }
  }
}


