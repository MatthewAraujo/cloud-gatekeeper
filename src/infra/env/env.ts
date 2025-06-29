import { z } from 'zod'

export const envSchema = z.object({
	DATABASE_URL: z.string().url(),
	JWT_PRIVATE_KEY: z.string(),
	JWT_PUBLIC_KEY: z.string(),
	CLOUDFLARE_ACCOUNT_ID: z.string(),
	AWS_BUCKET_NAME: z.string(),
	AWS_ACCESS_KEY_ID: z.string(),
	AWS_SECRET_ACCESS_KEY: z.string(),
	AWS_REGION: z.string().optional().default('us-east-1'),
	REDIS_HOST: z.string().optional().default('127.0.0.1'),
	REDIS_PORT: z.coerce.number().optional().default(6379),
	REDIS_DB: z.coerce.number().optional().default(0),
	PORT: z.coerce.number().optional().default(3333),
	OPENAI_API_KEY: z.string(),
	SLACK_BOT_TOKEN: z.string(),
	SLACK_DEFAULT_CHANNEL: z.string().optional().default('#all-cloud-gatekeeper'),
	SLACK_SIGNING_SECRET: z.string(),
	SLACK_APP_TOKEN: z.string(),
})

export type Env = z.infer<typeof envSchema>
