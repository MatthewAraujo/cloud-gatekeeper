import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { envSchema } from './env/env'
import { EnvModule } from './env/env.module'
import { HttpModule } from './http/http.module'
import { LoggerMiddleware } from './middleware/logger.middleware'

@Module({
	imports: [
		ConfigModule.forRoot({
			validate: (env) => envSchema.parse(env),
			isGlobal: true,
		}),
		AuthModule,
		HttpModule,
		EnvModule,

	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(LoggerMiddleware).forRoutes('*')
	}
}
