import { Type } from '@sinclair/typebox'
import { prisma } from '../db.js'
import { type App, IdParams, requireProfile } from './_shared.js'

const ContactCreateBody = Type.Object(
	{
		name: Type.String({ minLength: 1, maxLength: 80 }),
		phone: Type.String({ minLength: 3, maxLength: 30 }),
		priority: Type.Optional(Type.Integer({ minimum: 1, maximum: 10 })),
	},
	{ additionalProperties: false },
)

export async function registerContactsRoutes(app: App) {
	app.get('/contacts', async () => {
		const profile = await requireProfile(app)

		const contacts = await prisma.contact.findMany({
			where: { profileId: profile.id },
			orderBy: { priority: 'asc' },
		})

		return { ok: true, contacts }
	})

	app.post(
		'/contacts',
		{ schema: { body: ContactCreateBody } },
		async (req) => {
			const profile = await requireProfile(app)

			const contact = await prisma.contact.create({
				data: {
					profileId: profile.id,
					name: req.body.name,
					phone: req.body.phone,
					priority: req.body.priority ?? 1,
				},
			})

			return { ok: true, contact }
		},
	)

	app.delete('/contacts/:id', { schema: { params: IdParams } }, async (req) => {
		const profile = await requireProfile(app)

		const contact = await prisma.contact.findFirst({
			where: { id: req.params.id, profileId: profile.id },
		})
		if (!contact) throw app.httpErrors.notFound('Contact not found')

		await prisma.contact.delete({ where: { id: contact.id } })
		return { ok: true }
	})
}
