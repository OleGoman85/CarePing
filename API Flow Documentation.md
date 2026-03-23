# API Flow Documentation

***Base Configuration***

```
API_BASE = 'http://localhost:3001'
All requests require header: 'Content-Type: application/json'
Responses always format: { ok: true, ...data } | { ok: false, error: string, message: string }
```

# 🔄 Demo Routes (Simulation Management)

***POST /demo/start***

What it does: Creates or gets existing profile and plan for demo

Request body: {}

Success response (200):

```
{
  ok: true,
  profile: {
    id: string,
    name: string,
    phone: string | null,
    createdAt: string,
    updatedAt: string
  },
  plan: {
    id: string,
    title: string,
    everyDays: number,
    windowFrom: string, // "09:00"
    windowTo: string,   // "11:00"
    isActive: boolean
  }
}
```

***POST /demo/reset***

What it does: Completely resets demo data (deletes all logs, events, plans, contacts, profile)

Request body: {}

Success response (200): { ok: true }

# 👤 Profile Routes

***GET /profile***

What it does: Gets user profile with contacts and plans

Response (200):
```
{
  ok: true,
  profile: {
    id: string,
    name: string,
    phone: string | null,
    createdAt: string,
    updatedAt: string,
    contacts: Array<{
      id: string,
      name: string,
      phone: string,
      priority: number
    }>,
    plans: Array<{
      id: string,
      title: string,
      everyDays: number,
      windowFrom: string,
      windowTo: string,
      isActive: boolean
    }>
  } | null
}
````

***POST /profile***

What it does: Creates new profile (only if none exists)

Request body:
```
{
  name: string,        // required, 1-80 chars
  phone?: string       // optional, 3-30 chars
}
```
Response (200): { ok: true, profile: Profile }

***PUT /profile***
What it does: Updates existing profile

Request body:
```
{
  name?: string,       // optional, 1-80 chars
  phone?: string       // optional, 3-30 chars
}
```
Response (200): { ok: true, profile: Profile }

# 📞 Contacts Routes (Escalation Contacts)

***GET /contacts***

What it does: Gets all contacts (sorted by priority asc)

Response (200):
```
{
  ok: true,
  contacts: Array<{
    id: string,
    name: string,
    phone: string,
    priority: number,   // 1 = most important
    profileId: string
  }>
}
```

***POST /contacts***

What it does: Creates new contact

Request body:
```
{
  name: string,        // required, 1-80 chars
  phone: string,       // required, 3-30 chars
  priority?: number    // optional, 1-10, default 1
}
```
Response (200): { ok: true, contact: Contact }

***DELETE /contacts/:id***

What it does: Deletes contact by ID

URL params: id: string (10-60 chars)

Response (200): { ok: true }

# 📅 Plans Routes (Check-in Plans)
Response (200):

***GET /plans***
What it does: Gets all check-in plans
```
{
  ok: true,
  plans: Array<{
    id: string,
    title: string,
    everyDays: number,     // 1-30 days
    windowFrom: string,    // "HH:MM"
    windowTo: string,      // "HH:MM"
    isActive: boolean,
    profileId: string
  }>
}
```
***POST /plans***

What it does: Creates new check-in plan

Request body:
```
{
  title: string,           // required, 1-120 chars
  everyDays: number,       // required, 1-30
  windowFrom: string,      // required, format "HH:MM" (00-23:00-59)
  windowTo: string,        // required, format "HH:MM", must be after windowFrom
  isActive?: boolean       // optional, default true
}
```
Response (200): { ok: true, plan: Plan }

***PATCH /plans/:id/toggle***

What it does: Toggles plan active status (true/false)

URL params: id: string (10-60 chars)

Response (200): { ok: true, plan: Plan }

# ✅ Check-ins Routes (Check-in Events)
***GET /checkins***

What it does: Gets ALL check-in events

Response (200):

```
{
  ok: true,
  events: Array<{
    id: string,
    scheduledFor: string,   // ISO date-time
    status: 'PENDING' | 'CONFIRMED' | 'ESCALATED' | 'CANCELLED',
    attempts: number,
    confirmedAt: string | null,
    escalatedAt: string | null,
    plan: {
      id: string,
      title: string,
      everyDays: number,
      windowFrom: string,
      windowTo: string
    }
  }>
}
```
***GET /checkins/active***

What it does: Gets ACTIVE (PENDING) check-in event

Response (200):

```
{
  ok: true,
  event: {
    id: string,
    scheduledFor: string,
    status: 'PENDING',
    attempts: number,
    confirmedAt: null,
    escalatedAt: null,
    plan: Plan
  } | null
}
````

***POST /checkins/active/confirm***

What it does: Confirms active check-in (user pressed OK)

Request body: {}

Response (200):
```
{
  ok: true,
  event: {
    ...event,
    status: 'CONFIRMED',
    confirmedAt: string    // current time
  }
}
````

***POST /checkins/trigger***

What it does: Creates new check-in event

Request body:

```
{
  planId?: string,           // optional, specific plan ID
  scheduledFor?: string      // optional, ISO date-time (default now)
}
```
Response (200):

```
{
  ok: true,
  event: CheckInEvent        // status 'PENDING', attempts = 0
}
```

***POST /checkins/:id/remind***

What it does:

- Increments attempts counter

- When attempts >= 2, escalates to ESCALATED

- On escalation, creates notifications for all contacts
	- URL params: id: string (10-60 chars)
	- Request body: {}
	- Response (200):
```
{
  ok: true,
  escalated: boolean,        // whether escalation happened in this request
  event: CheckInEvent,       // updated event
  notify: []                 // (reserved)
}
```

***POST /checkins/:id/escalate***

What it does: Forces escalation (if status is PENDING)

**URL params:** id: string (10-60 chars)

**Request body:** {}

**Response (200):**
```
{
  ok: true,
  escalated: boolean,        // true if escalation happened
  event: CheckInEvent        // status 'ESCALATED' if escalated
}
````

***POST /checkins/:id/sos***

What it does: Instant escalation with SOS message

**URL params:** id: string (10-60 chars)

**Request body:** {}

**Response (200):**

```
{
  ok: true,
  event: CheckInEvent        // status 'ESCALATED'
}
```

***Message in logs:*** "CarePing SOS: user needs help now (\"{plan.title}\")"

# 📋 Notifications Routes (Notification Logs)

***GET /notifications***
What it does: Gets all notification logs (sorted by createdAt desc)

**Response (200):**
```
{
  ok: true,
  logs: Array<{
    id: string,
    createdAt: string,       // ISO date-time
    channel: 'SMS' | 'CALL',
    toPhone: string,
    message: string,
    event: {
      id: string,
      scheduledFor: string,
      status: string
    },
    contact: {
      id: string,
      name: string,
      phone: string,
      priority: number
    } | null
  }>
}
````

# 🏥 Health Check
***GET /health***

What it does: Server health check

**Response (200):** { ok: true }

# 📌 Important Notes for Frontend Developers

### Check-in Event Statuses:

- ***PENDING*** - waiting for confirmation

- ***CONFIRMED*** - confirmed by user (OK pressed)

- ***ESCALATED*** - escalated to contacts

- ***CANCELLED*** - cancelled (not used in current logic)

### Escalation Logic:
- First /remind (attempts=1) → only increments counter

- Second /remind (attempts=2) → escalation + notifications to all contacts

- /sos → instant escalation regardless of attempts

***Data Formats:***

- Time: always "HH:MM" (24-hour format)

- Dates: ISO strings (new Date().toISOString())

- IDs: strings 10-60 chars (cuid)

***Common Errors:***

- 404 - resource not found

- 400 - invalid parameters (e.g., windowFrom >= windowTo)

- 409 - conflict (profile already exists)

