import { memo } from "react";

export const PillsPopup = memo(function PillsPopup(props: {
  title: string;
  onDone: () => void;
  onLater: () => void;
}) {
  const { title, onDone, onLater } = props;

  return (
    <div
      className="
        flex
        p-6
        bg-black/60
        fixed inset-0 items-center justify-center
      "
    >
      <div
        className="
          w-full max-w-md
          p-5
          bg-slate-950
          rounded-3xl border border-slate-800
        "
      >
        <div
          className="
            text-sm text-slate-400
          "
        >
          Reminder
        </div>
        <div
          className="
            mt-2
            text-xl font-semibold
          "
        >
          {title}
        </div>
        <div
          className="
            mt-1
            text-sm text-slate-300
          "
        >
          Time to do it.
        </div>

        <div
          className="
            flex
            mt-4
            gap-3
          "
        >
          <button
            onClick={onDone}
            className="
              flex-1
              py-3
              text-slate-950 font-bold
              bg-emerald-500
              rounded-2xl
            "
          >
            OK
          </button>

          <button
            onClick={onLater}
            className="
              px-4
              font-semibold
              bg-slate-800
              rounded-2xl
              hover:bg-slate-700
            "
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
});
