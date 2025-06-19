import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { EnvService } from './env/env.service'
import { ConsoleLogger } from '@nestjs/common'

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		logger: new ConsoleLogger('Bootstrap', {
		}),
	})

	const configService = app.get(EnvService)
	const port = configService.get('PORT')

	await app.listen(port)
}
bootstrap()
