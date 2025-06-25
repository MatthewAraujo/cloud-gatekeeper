import { Module, OnModuleInit } from '@nestjs/common'
import { OnAccessRequestCreated } from '@/domain/cloud-gatekeeper/application/subscribers/on-access-request-created'
import { OnAccessRequestApproved } from '@/domain/cloud-gatekeeper/application/subscribers/on-access-request-approved'
import { OnAccessRequestRejected } from '@/domain/cloud-gatekeeper/application/subscribers/on-access-request-rejected'
import { ServicesModule } from '../services/services.module'
import { EnvModule } from '../env/env.module'

@Module({
  imports: [ServicesModule, EnvModule],
  providers: [
    OnAccessRequestCreated,
    OnAccessRequestApproved,
    OnAccessRequestRejected,
  ],
  exports: [
    OnAccessRequestCreated,
    OnAccessRequestApproved,
    OnAccessRequestRejected,
  ],
})
export class EventsModule implements OnModuleInit {
  constructor(
    private readonly onAccessRequestCreated: OnAccessRequestCreated,
    private readonly onAccessRequestApproved: OnAccessRequestApproved,
    private readonly onAccessRequestRejected: OnAccessRequestRejected,
  ) { }

  onModuleInit() {
    // Set up all event subscriptions when the module initializes
    this.onAccessRequestCreated.setupSubscriptions()
    this.onAccessRequestApproved.setupSubscriptions()
    this.onAccessRequestRejected.setupSubscriptions()
  }
} 