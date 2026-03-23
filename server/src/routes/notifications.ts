import { prisma } from '../db.js'
import { type App, requireProfile } from './_shared.js'

export async function registerNotificationsRoutes(app: App) {
	app.get('/notifications', async () => {
		const profile = await requireProfile(app)

		const logs = await prisma.notificationLog.findMany({
			where: { event: { plan: { profileId: profile.id } } },
			orderBy: { createdAt: 'desc' },
			include: { event: true, contact: true },
		})

		return { ok: true, logs }
	})
}
