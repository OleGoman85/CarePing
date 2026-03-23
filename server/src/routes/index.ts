import type { App } from './_shared.js'
import { registerProfileRoutes } from './profile.js'
import { registerContactsRoutes } from './contacts.js'
import { registerPlansRoutes } from './plans.js'
import { registerCheckInsRoutes, registerDemoRoutes } from './checkins.js'
import { registerNotificationsRoutes } from './notifications.js'

export async function registerRoutes(app: App) {
	app.get('/health', async () => ({ ok: true }))

	await registerProfileRoutes(app)
	await registerContactsRoutes(app)
	await registerPlansRoutes(app)
	await registerCheckInsRoutes(app)
	await registerNotificationsRoutes(app)
	await registerDemoRoutes(app)
}
