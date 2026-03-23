import { useEffect, useMemo, useState } from "react";
import { api, type CheckInEvent } from "../lib/api";

type State =
  | { kind: "loading" }
  | { kind: "idle"; event: CheckInEvent | null }
  | { kind: "confirming"; event: CheckInEvent }
  | { kind: "confirmed"; event: CheckInEvent }
  | { kind: "error"; message: string };

export function ActiveCheckInPage() {
  const [state, setState] = useState<State>({ kind: "loading" });

  async function fetchActive() {
    const data = await api.getActiveCheckIn();
    setState({ kind: "idle", event: data.event });
  }

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const data = await api.getActiveCheckIn();
        if (!isMounted) return;
        setState({ kind: "idle", event: data.event });
      } catch (e) {
        if (!isMounted) return;
        setState({
          kind: "error",
          message: e instanceof Error ? e.message : "Unknown error",
        });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const title = useMemo(() => {
    if (state.kind === "idle" && state.event) return state.event.plan.title;
    if (state.kind === "confirming") return state.event.plan.title;
    if (state.kind === "confirmed") return state.event.plan.title;
    return "CarePing";
  }, [state]);

  async function reload() {
    try {
      setState({ kind: "loading" });
      await fetchActive();
    } catch (e) {
      setState({
        kind: "error",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  async function confirm() {
    if (state.kind !== "idle" || !state.event) return;

    try {
      setState({
        kind: "confirming",
        event: state.event,
      });

      const data = await api.confirmActiveCheckIn();

      setState({
        kind: "confirmed",
        event: data.event,
      });
    } catch (e) {
      setState({
        kind: "error",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  return (
    <div
      className="
        flex
        min-h-screen
        p-6
        text-zinc-100
        bg-zinc-950
        items-center justify-center
      "
    >
      <div
        className="
          w-full max-w-md
          p-6 space-y-4
          bg-zinc-900/60
          rounded-2xl border border-zinc-800
          shadow-xl
        "
      >
        <div
          className="
            text-2xl font-semibold
          "
        >
          {title}
        </div>

        {state.kind === "loading" && (
          <div
            className="
              text-zinc-300
            "
          >
            Loading…
          </div>
        )}

        {state.kind === "error" && (
          <div
            className="
              space-y-3
            "
          >
            <div
              className="
                text-red-300
              "
            >
              Error: {state.message}
            </div>

            <button
              onClick={() => void reload()}
              className="
                w-full
                py-3
                text-zinc-900 font-semibold
                bg-zinc-100
                rounded-xl
              "
            >
              Repeat
            </button>
          </div>
        )}

        {state.kind === "idle" && !state.event && (
          <div
            className="
              space-y-3
            "
          >
            <div
              className="
                text-zinc-300
              "
            >
              There is no active verification at the moment.
            </div>

            <button
              onClick={() => void reload()}
              className="
                w-full
                py-3
                font-semibold
                bg-zinc-800
                rounded-xl border border-zinc-700
              "
            >
              Update
            </button>
          </div>
        )}

        {state.kind === "idle" && state.event && (
          <div
            className="
              space-y-4
            "
          >
            <div
              className="
                text-zinc-300
              "
            >
              Is everything fine? Press the button:
            </div>

            <button
              onClick={() => void confirm()}
              className="
                w-full
                py-6
                text-zinc-950 text-2xl font-black
                bg-emerald-400
                rounded-2xl
                active:scale-[0.99] transition
              "
            >
              OK
            </button>
            <div
              className="
                text-xs text-zinc-400
              "
            >
              Attempts: {state.event.attempts}
            </div>
          </div>
        )}

        {state.kind === "confirming" && (
          <div
            className="
              text-zinc-300
            "
          >
            Confirm…
          </div>
        )}

        {state.kind === "confirmed" && (
          <div
            className="
              space-y-3
            "
          >
            <div
              className="
                text-emerald-300 font-semibold
              "
            >
              Confirmed, ✅ Thank You!
            </div>

            <button
              onClick={() => void reload()}
              className="
                w-full
                py-3
                font-semibold
                bg-zinc-800
                rounded-xl border border-zinc-700
              "
            >
              Update
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
