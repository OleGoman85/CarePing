import { memo } from "react";
import type { Weekday } from "../../../hooks/useLocalReminders";
import type { CheckInSettings } from "../utils";
import { WeekdaysPicker } from "./WeekdaysPicker";

export const CheckInSettingsSection = memo(
  function CheckInSettingsSection(props: {
    value: CheckInSettings;
    onToggleDay: (d: Weekday) => void;
    onChangeTime: (v: string) => void;
    onChangeInterval: (v: 1 | 2 | 3) => void;
  }) {
    const { value, onToggleDay, onChangeTime, onChangeInterval } = props;

    return (
      <div>
        <div
          className="
            text-lg font-semibold
          "
        >
          Check-in settings
        </div>

        <div
          className="
            mt-2
            text-sm text-slate-300
          "
        >
          Days • time of check • interval (1–3h). (Simulation starts instantly.)
        </div>

        <WeekdaysPicker selected={value.days} onToggle={onToggleDay} />

        <div
          className="
            grid grid-cols-1
            mt-3
            gap-3
            sm:grid-cols-2
          "
        >
          <div>
            <div
              className="
                text-xs text-slate-400
              "
            >
              Time (HH:MM)
            </div>
            <input
              value={value.timeHHMM}
              onChange={(e) => onChangeTime(e.target.value)}
              placeholder="10:00"
              className="
                w-full
                mt-1 px-3 py-2
                bg-slate-900
                rounded-xl border border-slate-800
                outline-none
              "
            />
          </div>

          <div>
            <div
              className="
                text-xs text-slate-400
              "
            >
              Interval (hours)
            </div>
            <select
              value={value.intervalHours}
              onChange={(e) =>
                onChangeInterval(Number(e.target.value) as 1 | 2 | 3)
              }
              className="
                w-full
                mt-1 px-3 py-2
                bg-slate-900
                rounded-xl border border-slate-800
                outline-none
              "
            >
              <option value={1}>1 hour</option>
              <option value={2}>2 hours</option>
              <option value={3}>3 hours</option>
            </select>
          </div>
        </div>
      </div>
    );
  },
);
