import { memo } from "react";
import type { Weekday } from "../../../hooks/useLocalReminders";
import { WEEKDAYS } from "../utils";

export const WeekdaysPicker = memo(function WeekdaysPicker(props: {
  selected: Weekday[];
  onToggle: (d: Weekday) => void;
}) {
  const { selected, onToggle } = props;

  return (
    <div
      className="
        flex flex-wrap
        mt-3
        gap-2
      "
    >
      {WEEKDAYS.map((d) => {
        const on = selected.includes(d.key);
        return (
          <button
            key={d.key}
            onClick={() => onToggle(d.key)}
            className={`
              px-3 py-2
              text-sm font-semibold
              rounded-xl border
              ${
              on
              ? "bg-emerald-500 text-slate-950 border-emerald-400"
              : "bg-slate-900 text-slate-100 border-slate-800 hover:bg-slate-800"
              }
            `}
          >
            {d.label}
          </button>
        );
      })}
    </div>
  );
});
