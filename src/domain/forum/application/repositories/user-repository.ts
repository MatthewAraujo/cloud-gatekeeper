import { Prisma, User } from 'generated/prisma'

export abstract class UserRepository {
  abstract findById(id: string): Promise<User | null>
  abstract create(data: Prisma.UserCreateInput): Promise<User>
} 