import { Type } from '@sinclair/typebox'
import { prisma } from '../db.js'
import { type App, IdParams, TimeHHMM, requireProfile } from './_shared.js'

const PlanCreateBody = Type.Object(
	{
		title: Type.String({ minLength: 1, maxLength: 120 }),
		everyDays: Type.Integer({ minimum: 1, maximum: 30 }),
		windowFrom: TimeHHMM,
		windowTo: TimeHHMM,
		isActive: Type.Optional(Type.Boolean()),
	},
	{ additionalProperties: false },
)

export async function registerPlansRoutes(app: App) {
	app.get('/plans', async () => {
		const profile = await requireProfile(app)

		const plans = await prisma.plan.findMany({
			where: { profileId: profile.id },
			orderBy: { createdAt: 'desc' },
		})

		return { ok: true, plans }
	})

	app.post('/plans', { schema: { body: PlanCreateBody } }, async (req) => {
		const profile = await requireProfile(app)

		if (req.body.windowFrom >= req.body.windowTo) {
			throw app.httpErrors.badRequest(
				'windowFrom must be earlier than windowTo',
			)
		}

		const plan = await prisma.plan.create({
			data: {
				profileId: profile.id,
				title: req.body.title,
				everyDays: req.body.everyDays,
				windowFrom: req.body.windowFrom,
				windowTo: req.body.windowTo,
				isActive: req.body.isActive ?? true,
			},
		})

		return { ok: true, plan }
	})

	app.patch(
		'/plans/:id/toggle',
		{ schema: { params: IdParams } },
		async (req) => {
			const profile = await requireProfile(app)

			const plan = await prisma.plan.findFirst({
				where: { id: req.params.id, profileId: profile.id },
			})
			if (!plan) throw app.httpErrors.notFound('Plan not found')

			const updated = await prisma.plan.update({
				where: { id: plan.id },
				data: { isActive: !plan.isActive },
			})

			return { ok: true, plan: updated }
		},
	)
}
