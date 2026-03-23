import { Type } from '@sinclair/typebox'
import { prisma } from '../db.js'
import { type App, IdParams, requireProfile } from './_shared.js'

const CheckInTriggerBody = Type.Object(
	{
		planId: Type.Optional(Type.String({ minLength: 10, maxLength: 60 })),
		scheduledFor: Type.Optional(Type.String({ format: 'date-time' })),
	},
	{ additionalProperties: false },
)

async function getActivePendingEvent(profileId: string) {
	const now = new Date()
	return prisma.checkInEvent.findFirst({
		where: {
			status: 'PENDING',
			scheduledFor: { lte: now }, //lte = less than or equal
			plan: { profileId },
		},
		include: { plan: true },
		orderBy: { createdAt: 'desc' },
	})
}

async function writeEscalationLogs(
	app: App,
	profileId: string,
	eventId: string,
	message: string,
) {
	const contacts = await prisma.contact.findMany({
		where: { profileId },
		orderBy: { priority: 'asc' },
	})

	if (contacts.length === 0) return

	await prisma.notificationLog.createMany({
		data: contacts.map((c) => ({
			eventId,
			contactId: c.id,
			channel: 'SMS',
			toPhone: c.phone,
			message,
		})),
	})

	for (const c of contacts) {
		app.log.warn(
			{ to: c.phone, contactId: c.id, eventId },
			`ESCALATION SMS -> ${message}`,
		)
	}
}

async function escalateEvent(
	app: App,
	profileId: string,
	eventId: string,
	message: string,
) {
	// just if  PENDING
	const updated = await prisma.checkInEvent.update({
		where: { id: eventId },
		data: { status: 'ESCALATED', escalatedAt: new Date() },
		include: { plan: true },
	})

	await writeEscalationLogs(app, profileId, updated.id, message)
	return updated
}

export async function registerDemoRoutes(app: App) {
	app.post('/demo/reset', async () => {
		await prisma.notificationLog.deleteMany()
		await prisma.checkInEvent.deleteMany()
		await prisma.plan.deleteMany()
		await prisma.contact.deleteMany()
		await prisma.profile.deleteMany()
		return { ok: true }
	})

	app.post('/demo/start', async () => {
		let profile = await prisma.profile.findFirst()
		if (!profile) {
			profile = await prisma.profile.create({
				data: { name: 'Grandma Maria', phone: '+358000000' },
			})
		}

		const caregiverPhone = '+358111111'
		const caregiverName = 'Oleg'

		const existingContact = await prisma.contact.findFirst({
			where: { profileId: profile.id, phone: caregiverPhone },
		})

		if (!existingContact) {
			await prisma.contact.create({
				data: {
					profileId: profile.id,
					name: caregiverName,
					phone: caregiverPhone,
					priority: 1,
				},
			})
		}

		let plan = await prisma.plan.findFirst({
			where: { profileId: profile.id, isActive: true },
			orderBy: { createdAt: 'desc' },
		})

		if (!plan) {
			plan = await prisma.plan.create({
				data: {
					profileId: profile.id,
					title: 'Check-in',
					everyDays: 2,
					windowFrom: '09:00',
					windowTo: '11:00',
					isActive: true,
				},
			})
		}

		return { ok: true, profile, plan }
	})
}

export async function registerCheckInsRoutes(app: App) {
	app.get('/checkins', async () => {
		const profile = await requireProfile(app)

		const events = await prisma.checkInEvent.findMany({
			where: { plan: { profileId: profile.id } },
			include: { plan: true },
			orderBy: { createdAt: 'desc' },
		})

		return { ok: true, events }
	})

	app.get('/checkins/active', async () => {
		const profile = await requireProfile(app)
		const event = await getActivePendingEvent(profile.id)
		return { ok: true, event }
	})

	app.post('/checkins/active/confirm', async () => {
		const profile = await requireProfile(app)

		const event = await getActivePendingEvent(profile.id)
		if (!event) throw app.httpErrors.notFound('No active check-in')

		const updated = await prisma.checkInEvent.update({
			where: { id: event.id },
			data: { status: 'CONFIRMED', confirmedAt: new Date() },
			include: { plan: true },
		})

		return { ok: true, event: updated }
	})

	app.post(
		'/checkins/trigger',
		{ schema: { body: CheckInTriggerBody } },
		async (req) => {
			const profile = await requireProfile(app)

			const plan = req.body.planId
				? await prisma.plan.findFirst({
					where: {
						id: req.body.planId,
						profileId: profile.id,
						isActive: true,
					},
				})
				: await prisma.plan.findFirst({
					where: { profileId: profile.id, isActive: true },
					orderBy: { createdAt: 'desc' },
				})

			if (!plan) throw app.httpErrors.notFound('Active plan not found')

			const scheduledFor = req.body.scheduledFor
				? new Date(req.body.scheduledFor)
				: new Date()

			if (Number.isNaN(scheduledFor.getTime())) {
				throw app.httpErrors.badRequest(
					'scheduledFor must be a valid ISO date-time',
				)
			}

			const event = await prisma.checkInEvent.create({
				data: { planId: plan.id, scheduledFor, status: 'PENDING', attempts: 0 },
				include: { plan: true },
			})

			return { ok: true, event }
		},
	)

	// ✅ remind: attempts++.
	// escalate if attempts becomes >=2.
	app.post(
		'/checkins/:id/remind',
		{ schema: { params: IdParams } },
		async (req) => {
			const profile = await requireProfile(app)

			const result = await prisma.$transaction(async (tx) => {
				const event = await tx.checkInEvent.findFirst({
					where: { id: req.params.id, plan: { profileId: profile.id } },
					include: { plan: true },
				})
				if (!event) throw app.httpErrors.notFound('Check-in event not found')

				if (event.status !== 'PENDING') {
					return {
						escalated: event.status === 'ESCALATED',
						event,
						didEscalateNow: false,
					}
				}

				const nextAttempts = event.attempts + 1
				const shouldEscalate = nextAttempts >= 2

				const updated = await tx.checkInEvent.update({
					where: { id: event.id },
					data: {
						attempts: nextAttempts,
						...(shouldEscalate
							? { status: 'ESCALATED', escalatedAt: new Date() }
							: {}),
					},
					include: { plan: true },
				})

				return {
					escalated: shouldEscalate,
					event: updated,
					didEscalateNow: shouldEscalate,
				}
			})

			if (result.didEscalateNow) {
				const message = `CarePing: no confirmation for check-in "${result.event.plan.title}"`
				await writeEscalationLogs(app, profile.id, result.event.id, message)
			}

			return {
				ok: true,
				escalated: result.escalated,
				event: result.event,
				notify: [],
			}
		},
	)

	// ✅ optional endpoint: force escalate now 
	app.post(
		'/checkins/:id/escalate',
		{ schema: { params: IdParams } },
		async (req) => {
			const profile = await requireProfile(app)

			const event = await prisma.checkInEvent.findFirst({
				where: { id: req.params.id, plan: { profileId: profile.id } },
				include: { plan: true },
			})
			if (!event) throw app.httpErrors.notFound('Check-in event not found')

			if (event.status !== 'PENDING') {
				return { ok: true, escalated: event.status === 'ESCALATED', event }
			}

			const message = `CarePing: no confirmation for check-in "${event.plan.title}"`
			const updated = await escalateEvent(app, profile.id, event.id, message)
			return { ok: true, escalated: true, event: updated }
		},
	)

	// ✅ SOS: 
	app.post(
		'/checkins/:id/sos',
		{ schema: { params: IdParams } },
		async (req) => {
			const profile = await requireProfile(app)

			const event = await prisma.checkInEvent.findFirst({
				where: { id: req.params.id, plan: { profileId: profile.id } },
				include: { plan: true },
			})
			if (!event) throw app.httpErrors.notFound('Check-in event not found')

			if (event.status !== 'PENDING') {
				return { ok: true, event }
			}

			const message = `CarePing SOS: user needs help now ("${event.plan.title}")`
			const updated = await prisma.checkInEvent.update({
				where: { id: event.id },
				data: { status: 'ESCALATED', escalatedAt: new Date() },
				include: { plan: true },
			})

			await writeEscalationLogs(app, profile.id, updated.id, message)

			return { ok: true, event: updated }
		},
	)
}
