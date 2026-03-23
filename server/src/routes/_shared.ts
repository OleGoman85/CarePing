import { Type } from '@sinclair/typebox'
import type {
	FastifyBaseLogger,
	FastifyInstance,
	RawServerDefault,
} from 'fastify'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { prisma } from '../db.js'

export type App = FastifyInstance<
	RawServerDefault,
	IncomingMessage,
	ServerResponse<IncomingMessage>,
	FastifyBaseLogger,
	TypeBoxTypeProvider
>

export const TimeHHMM = Type.String({
	pattern: '^([01]\\d|2[0-3]):[0-5]\\d$',
})

export const IdParams = Type.Object(
	{ id: Type.String({ minLength: 10, maxLength: 60 }) },
	{ additionalProperties: false },
)

export async function requireProfile(app: App) {
	const profile = await prisma.profile.findFirst()
	if (!profile) {
		throw app.httpErrors.notFound('Profile not found')
	}
	return profile
}


export async function getSingleProfile() {
	return prisma.profile.findFirst({
		include: {
			contacts: { orderBy: { priority: 'asc' } },
			plans: { orderBy: { createdAt: 'desc' } },
		},
	})
}

/*
FastifyInstance<
  RawServerDefault,
  IncomingMessage,
  ServerResponse<IncomingMessage>,
  FastifyBaseLogger,
  TypeBoxTypeProvider
>

Type reference for our Fastify server instance.

RawServerDefault
- The underlying Node.js HTTP server implementation used by Fastify.

IncomingMessage
- The Node.js type representing an incoming HTTP request (req).

ServerResponse<IncomingMessage>
- The Node.js type representing the HTTP response object (reply).

FastifyBaseLogger
- The built-in Fastify logger type used for app.log (info, warn, error).

TypeBoxTypeProvider
- Integrates @sinclair/typebox schemas with Fastify so request/response
  schemas automatically provide correct TypeScript types.
*/