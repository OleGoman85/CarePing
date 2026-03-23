import { memo, useMemo } from "react";
import type { NotificationLog } from "../../../lib/api";

export const CaregiverAlertsSection = memo(
  function CaregiverAlertsSection(props: { logs: NotificationLog[] }) {
    const last3 = useMemo(() => props.logs.slice(0, 3), [props.logs]);

    return (
      <div
        className="
          flex flex-col
          min-h-0
        "
      >
        <div
          className="
            text-lg font-semibold
          "
        >
          Alerts
        </div>

        <div
          className="
            mt-2
            text-sm text-slate-300
          "
        >
          Showing last 3 messages (ESCALATED)
        </div>

        <div
          className="
            flex flex-col overflow-hidden
            mt-4
            gap-3
          "
        >
          {last3.length === 0 ? (
            <div
              className="
                text-slate-500 text-sm
              "
            >
              No alerts yet.
            </div>
          ) : (
            last3.map((l) => (
              <div
                key={l.id}
                className="
                  p-3
                  bg-red-950/30
                  border border-red-900/60 rounded-2xl
                "
              >
                <div
                  className="
                    text-xs text-slate-400
                  "
                >
                  {new Date(l.createdAt).toLocaleString()}
                  {" • "}
                  {l.channel} → {l.toPhone}
                </div>

                <div
                  className="
                    mt-1
                    text-sm text-red-400 font-semibold
                  "
                >
                  {l.message}
                </div>
              </div>
            ))
          )}
        </div>

        <div
          className="
            flex-1
          "
        />

        <div
          className="
            text-xs text-slate-500
          "
        >
          (Appears automatically after 60s if no OK, or instantly on SOS)
        </div>
      </div>
    );
  },
);
