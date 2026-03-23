import type { ReactNode } from "react";

type Props = {
  label: string;
  children: ReactNode;
};

export function PhoneShell({ label, children }: Props) {
  return (
    <div
      className="
        p-4
        bg-slate-900
        border border-slate-800 rounded-3xl
        shadow
      "
    >
      <div
        className="
          text-sm text-slate-400
        "
      >
        {label}
      </div>

      <div
        className="
          overflow-y-auto overflow-x-hidden flex flex-col
          min-h-128 max-h-168
          mt-3 p-4
          bg-slate-950
          border border-slate-800 rounded-3xl
        "
      >
        {children}
      </div>
    </div>
  );
}
