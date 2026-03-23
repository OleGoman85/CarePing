import { Type } from '@sinclair/typebox'
import { prisma } from '../db.js'
import { type App, getSingleProfile } from './_shared.js'

const ProfileCreateBody = Type.Object(
	{
		name: Type.String({ minLength: 1, maxLength: 80 }),
		phone: Type.Optional(Type.String({ minLength: 3, maxLength: 30 })),
	},
	{ additionalProperties: false },
)

const ProfileUpdateBody = Type.Object(
	{
		name: Type.Optional(Type.String({ minLength: 1, maxLength: 80 })),
		phone: Type.Optional(Type.String({ minLength: 3, maxLength: 30 })),
	},
	{ additionalProperties: false },
)

export async function registerProfileRoutes(app: App) {
	app.get('/profile', async () => {
		const profile = await getSingleProfile()
		return { ok: true, profile }
	})

	app.post('/profile', { schema: { body: ProfileCreateBody } }, async (req) => {
		const existing = await prisma.profile.findFirst()
		if (existing) throw app.httpErrors.conflict('Profile already exists')

		const profile = await prisma.profile.create({
			data: { name: req.body.name, phone: req.body.phone },
		})

		return { ok: true, profile }
	})

	app.put('/profile', { schema: { body: ProfileUpdateBody } }, async (req) => {
		const existing = await prisma.profile.findFirst()
		if (!existing) throw app.httpErrors.notFound('Profile not found')

		const profile = await prisma.profile.update({
			where: { id: existing.id },
			data: {
				...(req.body.name !== undefined ? { name: req.body.name } : {}),
				...(req.body.phone !== undefined ? { phone: req.body.phone } : {}),
			},
		})

		return { ok: true, profile }
	})
}
