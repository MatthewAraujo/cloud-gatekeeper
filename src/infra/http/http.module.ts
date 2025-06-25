import { Module } from '@nestjs/common'
import { HttpModule as NestHttpModule } from '@nestjs/axios'

import { DatabaseModule } from '../database/database.module'
import { AccessRequestController } from './controllers/access-request.controller'
import { ApproveAccessRequestController } from './controllers/approve-access-request.controller'
import { ListPendingAccessRequestsController } from './controllers/list-pending-access-requests.controller'
import { SlackInteractionController } from './controllers/slack-interaction.controller'
import { SlackEventsController } from './controllers/slack-events.controller'
import { ServicesModule } from '@/infra/services/services.module'
import { ApproveAccessRequestUseCase } from '@/domain/cloud-gatekeeper/application/use-cases/approve-access-request'
import { ListPendingAccessRequestsUseCase } from '@/domain/cloud-gatekeeper/application/use-cases/list-pending-access-requests'
import { AccessRequestUseCase } from '@/domain/cloud-gatekeeper/application/use-cases/access-request-use-case'
import { UserRepository } from '@/domain/cloud-gatekeeper/application/repositories/user-repository'
import { PrismaUserRepository } from '@/infra/database/prisma/repository/prisma-user.repository'

@Module({
	imports: [DatabaseModule, ServicesModule, NestHttpModule],
	controllers: [
		AccessRequestController,
		ApproveAccessRequestController,
		ListPendingAccessRequestsController,
		SlackInteractionController,
		SlackEventsController,
	],
	providers: [
		AccessRequestUseCase,
		ApproveAccessRequestUseCase,
		ListPendingAccessRequestsUseCase,
		{
			provide: UserRepository,
			useClass: PrismaUserRepository,
		},
	],
})
export class HttpModule { }
