import { Module } from '@nestjs/common'

import { DatabaseModule } from '../database/database.module'
import { AccessRequestController } from './controllers/access-request.controller'
import { AccessRequestUseCase } from '@/domain/forum/application/use-cases/answer-question'
import { ServicesModule } from '@/infra/services/services.module'

@Module({
	imports: [DatabaseModule, ServicesModule],
	controllers: [
		AccessRequestController,
	],
	providers: [
		AccessRequestUseCase
	],
})
export class HttpModule { }
