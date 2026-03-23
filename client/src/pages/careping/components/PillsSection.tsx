import { memo } from "react";
import type { Weekday } from "../../../hooks/useLocalReminders";
import { WeekdaysPicker } from "./WeekdaysPicker";

export const PillsSection = memo(function PillsSection(props: {
  pillTitle: string;
  pillTime: string;
  pillDays: Weekday[];
  onChangeTitle: (v: string) => void;
  onChangeTime: (v: string) => void;
  onToggleDay: (d: Weekday) => void;
  onAdd: () => void;
  items: { id: string; title: string; timeHHMM: string; days: Weekday[] }[];
  onDelete: (id: string) => void;
}) {
  const {
    pillTitle,
    pillTime,
    pillDays,
    onChangeTitle,
    onChangeTime,
    onToggleDay,
    onAdd,
    items,
    onDelete,
  } = props;

  return (
    <div>
      <div
        className="
          text-lg font-semibold
        "
      >
        Pills schedule
      </div>

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
            Task
          </div>
          <input
            value={pillTitle}
            onChange={(e) => onChangeTitle(e.target.value)}
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
            Time (HH:MM)
          </div>
          <input
            value={pillTime}
            onChange={(e) => onChangeTime(e.target.value)}
            placeholder="09:00"
            className="
              w-full
              mt-1 px-3 py-2
              bg-slate-900
              rounded-xl border border-slate-800
              outline-none
            "
          />
        </div>
      </div>

      <WeekdaysPicker selected={pillDays} onToggle={onToggleDay} />

      <div
        className="
          flex
          mt-3
          items-center gap-3
        "
      >
        <button
          onClick={onAdd}
          className="
            px-4 py-2
            text-slate-950 font-semibold
            bg-emerald-500
            rounded-xl
            hover:brightness-110
          "
        >
          Add reminder
        </button>

        <div
          className="
            text-xs text-slate-400
          "
        >
          Saved to localStorage
        </div>
      </div>

      <div
        className="
          flex flex-col
          mt-4
          gap-2
        "
      >
        {items.length === 0 ? (
          <div
            className="
              text-sm text-slate-500
            "
          >
            No pill reminders yet.
          </div>
        ) : (
          items.map((r) => (
            <div
              key={r.id}
              className="
                flex
                p-3
                bg-slate-900
                rounded-2xl border border-slate-800
                items-center justify-between gap-3
              "
            >
              <div>
                <div
                  className="
                    font-semibold
                  "
                >
                  {r.title}
                </div>
                <div
                  className="
                    text-xs text-slate-400
                  "
                >
                  {r.timeHHMM} • {r.days.join(", ")}
                </div>
              </div>

              <button
                onClick={() => onDelete(r.id)}
                className="
                  px-3 py-2
                  text-sm font-semibold
                  bg-slate-800
                  rounded-xl
                  hover:bg-slate-700
                "
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
});
