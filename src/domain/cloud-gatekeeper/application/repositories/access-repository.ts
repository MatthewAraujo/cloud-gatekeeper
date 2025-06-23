import { AccessRequest } from '@/domain/cloud-gatekeeper/enterprise/entities/access-request';

export abstract class AccessRequestRepository {
	abstract create(accessRequest: AccessRequest): Promise<void>;
	abstract findById(id: string): Promise<AccessRequest | null>;
	abstract save(accessRequest: AccessRequest): Promise<void>;
	abstract findAll(): Promise<AccessRequest[]>;
}
