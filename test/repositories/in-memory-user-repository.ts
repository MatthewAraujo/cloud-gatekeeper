import { UserRepository } from '@/domain/cloud-gatekeeper/application/repositories/user-repository'
import { Prisma, User } from 'generated/prisma'

export class InMemoryUserRepository extends UserRepository {
  public items: User[] = []

  async findById(id: string): Promise<User | null> {
    return this.items.find(item => item.id === id) || null
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    const user: User = {
      id: data.id as string,
      email: data.email as string,
      username: data.username as string,
      isCloudAdmin: data.isCloudAdmin as boolean,
    }
    this.items.push(user)
    return user
  }
} 