"use client";

import { useRef, useState } from "react";
import { useData } from "@/context/useData";
import { DataTable } from "@/components/DataTable";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { StatsPanel } from "@/components/stats/StatsPanel";
import { ACTION, FIELD, MSG } from "@/constants/strings";
import { exportDuty, importDuty } from "@/lib/csv";
import type { DutyEntry } from "@/lib/types";
import { weekdayKo } from "@/lib/date";

type View = "list" | "calendar" | "stats";

const VIEW_LABEL: Record<View, string> = {
  list: "목록",
  calendar: "캘린더",
  stats: "통계",
};

export function DutyViewTab() {
  const { duty, setDuty, holidays } = useData();
  const [view, setView] = useState<View>("list");
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const r = importDuty(await file.text());
    if (r.ok === 0 && r.skipped === 0) {
      setMsg(MSG.importFailed);
      return;
    }
    if (duty.length > 0 && !window.confirm(MSG.confirmImport(duty.length))) {
      return;
    }
    setDuty(r.items as DutyEntry[]);
    setMsg(MSG.imported(r.ok, r.skipped));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-md border border-slate-300 p-0.5">
          {(["list", "calendar", "stats"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded px-3 py-1 text-sm font-medium ${
                view === v
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {VIEW_LABEL[v]}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          {ACTION.import}
        </button>
        <button
          onClick={() => exportDuty(duty)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          {ACTION.export}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      {msg && <p className="text-sm text-slate-500">{msg}</p>}

      {view === "list" && (
        <DataTable
          columns={[
            {
              key: "date",
              label: FIELD.date,
              render: (v) => (v ? `${v} (${weekdayKo(v)})` : ""),
            },
            { key: "name", label: FIELD.name },
            { key: "rank", label: FIELD.rank },
          ]}
          rows={duty as unknown as Record<string, string>[]}
        />
      )}
      {view === "calendar" && (
        <MonthCalendar duty={duty} holidays={holidays} />
      )}
      {view === "stats" && <StatsPanel />}
    </div>
  );
}
