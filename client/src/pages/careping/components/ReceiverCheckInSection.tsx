import { memo } from "react";
import type { ReceiverUI } from "../utils";

export const ReceiverCheckInSection = memo(
  function ReceiverCheckInSection(props: {
    ui: ReceiverUI;
    busy: boolean;
    onOk: () => void;
    onSos: () => void;
  }) {
    const { ui, busy, onOk, onSos } = props;

    return (
      <div>
        <div
          className="
            text-lg font-semibold
          "
        >
          {ui.title}
        </div>

        <div
          className="
            mt-2
            text-sm text-slate-300
          "
        >
          {ui.timerText}
        </div>

        <button
          onClick={onOk}
          disabled={ui.okDisabled || busy}
          className={`
            w-full
            mt-3 py-4
            font-bold text-slate-950
            rounded-2xl
            disabled:opacity-60 ${ui.okColor}
          `}
        >
          {ui.okLabel}
        </button>

        <div
          className="
            mt-2
            text-xs text-slate-400
          "
        >
          {ui.hintText}
        </div>

        <button
          onClick={onSos}
          disabled={busy}
          className="
            w-full
            mt-3 py-4
            text-slate-950 font-extrabold
            bg-red-500
            rounded-2xl
            hover:brightness-110 disabled:opacity-60
          "
        >
          {busy ? "…" : "SOS • Need help now"}
        </button>
      </div>
    );
  },
);
