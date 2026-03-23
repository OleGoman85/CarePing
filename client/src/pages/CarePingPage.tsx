import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PhoneShell } from "../components/PhoneShell";
import { useLocalReminders, type Weekday } from "../hooks/useLocalReminders";
import { useNowTick } from "../hooks/useNowTick";
import { usePolling } from "../hooks/usePolling";
import { api, type CheckInEvent, type NotificationLog } from "../lib/api";
import { msSince } from "../lib/time";
import { PillsSection } from "./careping/components/PillsSection";
import { PillsPopup } from "./careping/components/PillsPopup";
import { CheckInSettingsSection } from "./careping/components/CheckInSettingsSection";
import { ReceiverCheckInSection } from "./careping/components/ReceiverCheckInSection";
import { CaregiverAlertsSection } from "./careping/components/CaregiverAlertsSection";
import {
  buildReceiverUI,
  CHECKIN_LS_KEY,
  safeParse,
  type CheckInSettings,
} from "./careping/utils";

export default function CarePingPage() {
  const nowRef = useNowTick(250);
  const pills = useLocalReminders(nowRef.current);

  const [checkInSettings, setCheckInSettings] = useState<CheckInSettings>(() =>
    safeParse<CheckInSettings>(localStorage.getItem(CHECKIN_LS_KEY), {
      days: ["MON", "WED", "FRI"],
      timeHHMM: "10:00",
      intervalHours: 2,
    }),
  );

  useEffect(() => {
    localStorage.setItem(CHECKIN_LS_KEY, JSON.stringify(checkInSettings));
  }, [checkInSettings]);

  const toggleCheckInDay = useCallback((d: Weekday) => {
    setCheckInSettings((prev) => {
      const on = prev.days.includes(d);
      return {
        ...prev,
        days: on ? prev.days.filter((x) => x !== d) : [...prev.days, d],
      };
    });
  }, []);

  // pills form
  const [pillTitle, setPillTitle] = useState("Pills");
  const [pillTime, setPillTime] = useState("09:00");
  const [pillDays, setPillDays] = useState<Weekday[]>([
    "MON",
    "TUE",
    "WED",
    "THU",
    "FRI",
  ]);

  const togglePillDay = useCallback((d: Weekday) => {
    setPillDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }, []);

  const addPill = useCallback(() => {
    const title = pillTitle.trim();
    if (!title) return;

    pills.addReminder({
      title,
      timeHHMM: pillTime,
      days: pillDays.length > 0 ? pillDays : ["MON"],
    });
  }, [pillTitle, pillTime, pillDays, pills]);

  // server data
  const [busy, setBusy] = useState(false);
  const [lastAction, setLastAction] = useState<string>("");

  const [active, setActive] = useState<CheckInEvent | null>(null);
  const [logs, setLogs] = useState<NotificationLog[]>([]);

  // guards
  const remindedAt30Ref = useRef<string | null>(null);
  const remindedAt60Ref = useRef<string | null>(null);

  const refreshActive = useCallback(async () => {
    const r = await api.getActiveCheckIn();
    setActive(r.event);
  }, []);

  const refreshLogs = useCallback(async () => {
    const r = await api.getNotifications();
    setLogs(r.logs);
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshActive(), refreshLogs()]);
  }, [refreshActive, refreshLogs]);

  usePolling(refreshAll, 1000);

  const ensureProfile = useCallback(async () => {
    await api.demoStart();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureProfile();
        if (cancelled) return;
        await refreshAll();
      } catch {
        // silent
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ensureProfile, refreshAll]);

  // ✅ auto logic: 30s remind, 60s remind (server escalates on attempts>=2)
  useEffect(() => {
    const ev = active;
    if (!ev) return;
    if (ev.status !== "PENDING") return;

    const elapsedMs = msSince(ev.scheduledFor, nowRef.current);

    const needRemind30 = elapsedMs >= 30_000;
    const needRemind60 = elapsedMs >= 60_000;

    if (needRemind30 && remindedAt30Ref.current !== ev.id) {
      remindedAt30Ref.current = ev.id;
      void api.remind(ev.id).then(refreshAll).catch(console.error);
    }

    if (needRemind60 && remindedAt60Ref.current !== ev.id) {
      remindedAt60Ref.current = ev.id;
      void api.remind(ev.id).then(refreshAll).catch(console.error);
    }
  }, [active, nowRef, refreshAll]);

  const receiverUI = useMemo(
    () => buildReceiverUI(active, nowRef.current),
    [active, nowRef],
  );

  const onStartSimulation = useCallback(async () => {
    setBusy(true);
    setLastAction("");

    try {
      await ensureProfile();
      await api.triggerCheckIn(new Date().toISOString());

      setLastAction("Simulation started ✅");
      remindedAt30Ref.current = null;
      remindedAt60Ref.current = null;

      await refreshAll();
    } catch (e) {
      setLastAction(e instanceof Error ? e.message : "Start failed");
    } finally {
      setBusy(false);
    }
  }, [ensureProfile, refreshAll]);

  const onRestartSimulation = useCallback(async () => {
    setBusy(true);
    setLastAction("");

    try {
      await api.demoReset();
      await ensureProfile();

      setLastAction("Simulation restarted ✅");
      remindedAt30Ref.current = null;
      remindedAt60Ref.current = null;

      setActive(null);
      setLogs([]);

      await refreshAll();
    } catch (e) {
      setLastAction(e instanceof Error ? e.message : "Restart failed");
    } finally {
      setBusy(false);
    }
  }, [ensureProfile, refreshAll]);

  const onReceiverOk = useCallback(async () => {
    setBusy(true);
    setLastAction("");

    try {
      await api.confirmActiveCheckIn();
      setLastAction("Receiver confirmed ✅");
      await refreshAll();
    } catch (e) {
      setLastAction(e instanceof Error ? e.message : "Confirm failed");
    } finally {
      setBusy(false);
    }
  }, [refreshAll]);

  const onSos = useCallback(async () => {
    setBusy(true);
    setLastAction("");

    try {
      await ensureProfile();

      const created = await api.triggerCheckIn(new Date().toISOString());
      await api.sos(created.event.id);

      setLastAction("SOS sent 🚨");
      remindedAt30Ref.current = null;
      remindedAt60Ref.current = created.event.id;

      await refreshAll();
    } catch (e) {
      setLastAction(e instanceof Error ? e.message : "SOS failed");
    } finally {
      setBusy(false);
    }
  }, [ensureProfile, refreshAll]);

  return (
    <div
      className="
        min-h-screen
        p-6
        text-slate-100
        bg-slate-950
      "
    >
      <div
        className="
          max-w-6xl
          mx-auto space-y-6
        "
      >
        <div
          className="
            flex flex-wrap
            items-center justify-between gap-4
          "
        >
          <div
            className="
              space-y-1
            "
          >
            <div
              className="
                text-2xl font-black
              "
            >
              CarePing
            </div>

            {lastAction ? (
              <div
                className="
                  text-sm text-slate-300
                "
              >
                {lastAction}
              </div>
            ) : (
              <div
                className="
                  text-sm text-slate-400
                "
              >
                One page • two phones • instant start + instant SOS
              </div>
            )}
          </div>

          <div
            className="
              flex flex-wrap
              items-center gap-3
            "
          >
            <button
              onClick={() => void onStartSimulation()}
              disabled={busy}
              className="
                px-4 py-2
                text-slate-950 font-semibold
                bg-emerald-500
                rounded-xl
                disabled:opacity-60 hover:brightness-110
              "
            >
              {busy ? "…" : "Start simulation"}
            </button>

            <button
              onClick={() => void onRestartSimulation()}
              disabled={busy}
              className="
                px-4 py-2
                text-slate-100 font-semibold
                bg-slate-800
                rounded-xl
                disabled:opacity-60 hover:bg-slate-700
              "
            >
              {busy ? "…" : "Restart simulation"}
            </button>
          </div>
        </div>

        <div
          className="
            grid grid-cols-1
            gap-6 items-start
            lg:grid-cols-2
          "
        >
          <PhoneShell label="Receiver (elderly)">
            <div
              className="
                space-y-6
              "
            >
              <PillsSection
                pillTitle={pillTitle}
                pillTime={pillTime}
                pillDays={pillDays}
                onChangeTitle={setPillTitle}
                onChangeTime={setPillTime}
                onToggleDay={togglePillDay}
                onAdd={addPill}
                items={pills.items}
                onDelete={pills.removeReminder}
              />

              <CheckInSettingsSection
                value={checkInSettings}
                onToggleDay={toggleCheckInDay}
                onChangeTime={(v) =>
                  setCheckInSettings((prev) => ({
                    ...prev,
                    timeHHMM: v,
                  }))
                }
                onChangeInterval={(v) =>
                  setCheckInSettings((prev) => ({
                    ...prev,
                    intervalHours: v,
                  }))
                }
              />

              <ReceiverCheckInSection
                ui={receiverUI}
                busy={busy}
                onOk={() => void onReceiverOk()}
                onSos={() => void onSos()}
              />
            </div>

            {pills.popup ? (
              <PillsPopup
                title={pills.popup.title}
                onDone={pills.closePopupDone}
                onLater={pills.closePopup}
              />
            ) : null}
          </PhoneShell>

          <PhoneShell label="Caregiver (relative)">
            <CaregiverAlertsSection logs={logs} />
          </PhoneShell>
        </div>

        <div
          className="
            text-xs text-slate-500
          "
        >
          Active event:{" "}
          {active
            ? `${active.id} • ${active.status} • attempts=${active.attempts}`
            : "null"}
        </div>
      </div>
    </div>
  );
}

/*
Custom Hooks

useNowTick
Custom hook that provides the current time and updates it at a fixed interval.
Used for timers and time-based logic in the UI.

Example:
const nowRef = useNowTick(250)

-------

usePolling
Runs a function repeatedly at a given interval.

Example:
usePolling(refreshAll, 1000)

Meaning:
run refreshAll every 1000 milliseconds.

-------

useLocalReminders
Custom hook that manages local reminders for pills.

Responsibilities:
- storing reminders
- reading/writing from localStorage
- detecting when reminder time arrives
- controlling popup notifications


=======================================
Helper Functions & Utilities Reference
=======================================

api
Object that wraps all HTTP requests to the backend server.

Purpose:
Separates network logic from UI code.

Example usage in this component:
api.demoStart()           → initialize demo profile and plan
api.triggerCheckIn()      → create a new check-in event
api.getActiveCheckIn()    → fetch active event
api.getNotifications()    → fetch notification logs
api.remind(id)            → send reminder attempt
api.sos(id)               → escalate immediately

------

msSince(dateString, now)
Calculates how many milliseconds passed since a given timestamp.

Parameters:
dateString → ISO timestamp from backend (event.scheduledFor)
now        → current time in milliseconds

Used for:
- detecting 30 second reminder
- detecting 60 second reminder

Example:
const elapsedMs = msSince(ev.scheduledFor, nowRef.current)

------

buildReceiverUI(activeEvent, now)
Builds a UI description object for the receiver screen.

Purpose:
Separates UI decision logic from the main component.

It analyzes:
- current active event
- event status
- time passed since scheduled check-in

Returns data used by:
<ReceiverCheckInSection />

Example values produced:
- message text
- timer
- status
- button states

------

safeParse(jsonString, fallback)
Safely parses JSON data.

Why needed:
localStorage might contain invalid or corrupted JSON.

Behavior:
1. tries JSON.parse(jsonString)
2. if parsing fails → returns fallback value

Used for:
loading check-in settings from localStorage.

Example:
safeParse(localStorage.getItem(CHECKIN_LS_KEY), defaultSettings)

------

useLocalReminders
Custom hook for managing local pill reminders.

Responsibilities:
- storing reminder list
- saving reminders to localStorage
- checking current time
- triggering reminder popup

Returns:
items              → reminder list
addReminder()      → create reminder
removeReminder()   → delete reminder
popup              → popup state
closePopup()       → close popup
closePopupDone()   → mark reminder completed

------

useNowTick(intervalMs)
Custom hook that keeps track of the current time and updates it regularly.

Purpose:
Provide a continuously updated "now" value for time-based logic.

Example:
const nowRef = useNowTick(250)

Meaning:
update current time roughly every 250 milliseconds.

Used for:
- timers
- reminder checks
- check-in elapsed time

------

usePolling(fn, intervalMs)
Custom hook that repeatedly executes a function at a fixed interval.

Example:
usePolling(refreshAll, 1000)

Meaning:
run refreshAll every second.

Used for:
- continuously refreshing active check-in
- updating notification logs

------

refreshActive()
Local helper function inside this component.

Purpose:
Fetch the current active check-in from the backend
and store it in React state.

Implementation:
calls api.getActiveCheckIn()
then updates state with setActive()

------

refreshLogs()
Fetches notification logs from backend
and stores them in component state.

Implementation:
calls api.getNotifications()
then updates state with setLogs()

------

refreshAll()
Convenience function that refreshes both:

- active check-in
- notification logs

Runs both requests in parallel using Promise.all().

------

ensureProfile()
Ensures that demo profile and initial data exist on the backend.

Implementation:
calls api.demoStart()

Backend behavior:
If profile does not exist → create it.

------

toggleCheckInDay(day)
Toggles a weekday inside check-in settings.

Behavior:
if day exists → remove it
if day not present → add it

Used by:
CheckInSettingsSection component.

------

togglePillDay(day)
Toggles weekday selection for pill reminders.

Used when configuring which days pills should be taken.

------

addPill()
Creates a new pill reminder using the current form inputs.

Steps:
1. read title, time, selected days
2. validate title
3. call pills.addReminder()

------

onStartSimulation()
Starts a demo simulation.

Steps:
1. ensure profile exists
2. create a new check-in event
3. reset reminder guards
4. refresh UI data

------

onRestartSimulation()
Completely resets simulation state.

Steps:
1. reset demo backend database
2. recreate profile
3. clear active event and logs
4. refresh data

------

onReceiverOk()
Handles when the receiver presses the OK button.

Steps:
1. confirm active check-in
2. refresh UI

------

onSos()
Handles emergency SOS action.

Steps:
1. ensure profile exists
2. create check-in event
3. escalate immediately
4. refresh data
*/
