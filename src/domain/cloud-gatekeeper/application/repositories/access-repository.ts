import { Prisma, AccessRequest } from "generated/prisma";

export abstract class AccessRequestRepository {
	abstract create(accessRequest: Prisma.AccessRequestCreateInput): Promise<AccessRequest>;
	abstract findById(id: string): Promise<AccessRequest | null>;
	abstract save(id: string, data: Prisma.AccessRequestUpdateInput): Promise<AccessRequest>;
	abstract findAll(): Promise<AccessRequest[]>;
}
