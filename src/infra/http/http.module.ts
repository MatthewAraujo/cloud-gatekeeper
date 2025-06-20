import { Module } from '@nestjs/common'

import { DatabaseModule } from '../database/database.module'
import { AccessRequestController } from './controllers/access-request.controller'
import { ApproveAccessRequestController } from './controllers/approve-access-request.controller'
import { ListPendingAccessRequestsController } from './controllers/list-pending-access-requests.controller'
import { ServicesModule } from '@/infra/services/services.module'
import { AccessRequestUseCase } from '@/domain/forum/application/use-cases/access-request'
import { ApproveAccessRequestUseCase } from '@/domain/forum/application/use-cases/approve-access-request'
import { ListPendingAccessRequestsUseCase } from '@/domain/forum/application/use-cases/list-pending-access-requests'

@Module({
	imports: [DatabaseModule, ServicesModule],
	controllers: [
		AccessRequestController,
		ApproveAccessRequestController,
		ListPendingAccessRequestsController,
	],
	providers: [
		AccessRequestUseCase,
		ApproveAccessRequestUseCase,
		ListPendingAccessRequestsUseCase,
	],
})
export class HttpModule { }
