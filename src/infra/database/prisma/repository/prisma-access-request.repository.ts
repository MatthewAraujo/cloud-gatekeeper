import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { Prisma, AccessRequest } from 'generated/prisma'
import { AccessRequestRepository } from '@/domain/cloud-gatekeeper/application/repositories/access-repository'

@Injectable()
export class PrismaAccessRequestRepository extends AccessRequestRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(data: Prisma.AccessRequestCreateInput): Promise<AccessRequest> {

    try {
      const result = await this.prisma.accessRequest.create({ data })
      return result
    } catch (error) {
      console.error('❌ Error creating access request:', error)
      throw error
    }
  }

  async save(id: string, data: Prisma.AccessRequestUpdateInput): Promise<AccessRequest> {

    try {
      const result = await this.prisma.accessRequest.update({
        where: { id },
        data,
      })
      return result
    } catch (error) {
      console.error('❌ Error updating access request:', error)
      throw error
    }
  }

  async delete(id: string): Promise<AccessRequest> {
    try {
      const result = await this.prisma.accessRequest.delete({
        where: { id },
      })
      return result
    } catch (error) {
      console.error('❌ Error deleting access request:', error)
      throw error
    }
  }

  async findById(id: string): Promise<AccessRequest | null> {
    try {
      const result = await this.prisma.accessRequest.findUnique({
        where: { id },
      })
      return result
    } catch (error) {
      console.error('❌ Error finding access request:', error)
      throw error
    }
  }

  async findAll(): Promise<AccessRequest[]> {
    try {
      const result = await this.prisma.accessRequest.findMany()
      return result
    } catch (error) {
      console.error('❌ Error finding all access requests:', error)
      throw error
    }
  }
}
