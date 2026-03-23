import Fastify from 'fastify'
import cors from '@fastify/cors'
import sensible from '@fastify/sensible'
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { registerRoutes } from './routes/index.js'
import type { FastifyError } from 'fastify'

async function main() {
	const app = Fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>()

	await app.register(cors, { origin: true })
	await app.register(sensible)

	await registerRoutes(app)

	app.setErrorHandler((err, _req, reply) => {
		const e = err as FastifyError & { code?: string; validation?: unknown }

		if (e.code === 'FST_ERR_VALIDATION') {
			return reply.code(400).send({
				ok: false,
				error: 'VALIDATION_ERROR',
				message: e.message,
			})
		}

		const status = e.statusCode ?? 500
		return reply.code(status).send({
			ok: false,
			error: status >= 500 ? 'INTERNAL_ERROR' : 'CLIENT_ERROR',
			message: e.message,
		})
	})

	const PORT = Number(process.env.PORT ?? 3001)
	await app.listen({ port: PORT, host: '0.0.0.0' })
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
