# CarePing

CarePing is a demo / prototype application for elderly check-ins with caregiver alerts.

The app shows two devices on one screen:

- **Receiver (elderly)** — the elderly user's device
- **Caregiver (relative)** — the caregiver's device

The system supports two main flows:

1. **Check-in simulation**  
   The elderly user sees a large `OK` button.  
   If confirmation is not received in time, the state changes, the button turns red, and an alert message is sent to the caregiver.

2. **SOS**  
   The elderly user can press `SOS • Need help now`, and an emergency alert is sent to the caregiver immediately.

The application also includes local pill reminders stored in `localStorage`.

---

## Features

### Receiver side
- pill schedule setup
- weekday selection
- time selection
- local popup reminders
- check-in confirmation via `OK`
- instant `SOS` button

### Caregiver side
- displays recent alert messages
- automatically receives an alert when a check-in is not confirmed
- immediately receives SOS alerts

### Backend logic
- profile creation and storage
- caregiver contact storage
- check-in plan storage
- check-in event creation
- check-in confirmation
- escalation when no response is received
- notification logging in SQLite through Prisma

---

## Tech Stack

### Client
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router

### Server
- Node.js
- Fastify
- TypeScript
- Prisma
- SQLite

---
How It Works
1. Initial seed

When the frontend starts, it calls demoStart().
The backend creates these records if they do not already exist:
- Profile
- caregiver contact
- active Plan

This ensures the application is always ready for the check-in simulation.

---

2. Start simulation

When the user clicks Start simulation:
- a new CheckInEvent is created
- the event becomes active immediately
- the left phone starts the timer
- for the first 30 seconds the OK button is green
- after 30 seconds the button becomes red
- after 60 seconds, if OK was not pressed, the backend escalates the event
- an alert appears on the caregiver phone

---

3. Confirm check-in

When OK is pressed:
- the current active CheckInEvent gets the status CONFIRMED
- the timer stops
- no caregiver alert is sent

---

4. SOS flow

When SOS • Need help now is pressed:
- a new event is created
- it is escalated immediately through a dedicated endpoint
- a NotificationLog entry is created right away
- the caregiver sees the alert without waiting for the timer

---

5. Pill reminders

- Pill reminders work locally:
- they are stored in localStorage
- checked every second
- a popup appears at the scheduled time
- the user can press OK or Later
- This logic is separate from the backend.

### Install dependencies

- cd client
- npm nstall
- npm run dev
---

- cd../server
- npm nstall
- npm run dev

###

![alt text](https://github.com/OleGoman85/CarePing/blob/main/01.png)
![alt text](https://github.com/OleGoman85/CarePing/blob/main/02.png)
![alt text](https://github.com/OleGoman85/CarePing/blob/main/03.png)
