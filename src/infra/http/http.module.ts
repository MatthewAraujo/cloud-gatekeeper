import { Module } from '@nestjs/common'



import { DatabaseModule } from '../database/database.module'
import { AccessRequestController } from './controllers/access-request.controller'
import { AccessRequestUseCase } from '@/domain/forum/application/use-cases/answer-question'

@Module({
	imports: [DatabaseModule,],
	controllers: [
		AccessRequestController,
	],
	providers: [
		AccessRequestUseCase
	],
})
export class HttpModule { }
