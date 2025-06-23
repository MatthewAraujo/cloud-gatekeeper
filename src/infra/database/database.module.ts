import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { AccessRequestRepository, } from '@/domain/cloud-gatekeeper/application/repositories/access-repository'
import { PrismaAccessRequestRepository } from './prisma/repository/prisma-access-request.repository'
import { UserRepository } from '@/domain/cloud-gatekeeper/application/repositories/user-repository'
import { PrismaUserRepository } from './prisma/repository/prisma-user.repository'
@Module({
	imports: [],
	providers: [
		PrismaService,
		{
			provide: AccessRequestRepository,
			useClass: PrismaAccessRequestRepository,
		},
		{
			provide: UserRepository,
			useClass: PrismaUserRepository
		}
	],
	exports: [
		PrismaService,
		AccessRequestRepository,
		UserRepository,
	],
})
export class DatabaseModule { }
