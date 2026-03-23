import { requestOk } from './http'

export type CheckInStatus = 'PENDING' | 'CONFIRMED' | 'ESCALATED' | 'CANCELLED'

export type CheckInEvent = {
	id: string
	status: CheckInStatus
	attempts: number
	scheduledFor: string
	plan: { id: string; title: string }
}

export type NotificationLog = {
	id: string
	createdAt: string
	channel: 'SMS' | 'CALL'
	toPhone: string
	message: string
}


export const api = {
	// demo
	async demoStart() {
		return requestOk<{ profile: unknown; plan: unknown }>('/demo/start', {
			method: 'POST',
			body: JSON.stringify({}),
		})
	},

	async demoReset() {
		return requestOk<Record<string, never>>('/demo/reset', {
			method: 'POST',
			body: JSON.stringify({}),
		})
	},

	// checkins
	async getActiveCheckIn() {
		return requestOk<{ event: CheckInEvent | null }>('/checkins/active')
	},

	async confirmActiveCheckIn() {
		return requestOk<{ event: CheckInEvent }>('/checkins/active/confirm', {
			method: 'POST',
			body: JSON.stringify({}),
		})
	},

	async triggerCheckIn(scheduledForISO?: string) {
		return requestOk<{ event: CheckInEvent }>('/checkins/trigger', {
			method: 'POST',
			body: JSON.stringify(
				scheduledForISO ? { scheduledFor: scheduledForISO } : {},
			),
		})
	},

	async remind(eventId: string) {
		return requestOk<{
			escalated: boolean
			event: CheckInEvent
			notify: unknown[]
		}>(`/checkins/${eventId}/remind`, {
			method: 'POST',
			body: JSON.stringify({}),
		})
	},

	async escalate(eventId: string) {
		return requestOk<{ escalated: boolean; event: CheckInEvent }>(
			`/checkins/${eventId}/escalate`,
			{
				method: 'POST',
				body: JSON.stringify({}),
			},
		)
	},

	async sos(eventId: string) {
		return requestOk<{ event: CheckInEvent }>(`/checkins/${eventId}/sos`, {
			method: 'POST',
			body: JSON.stringify({}),
		})
	},

	// notifications
	async getNotifications() {
		return requestOk<{ logs: NotificationLog[] }>('/notifications')
	},
}
