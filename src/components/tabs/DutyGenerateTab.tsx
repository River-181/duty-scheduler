"use client";

import { useState } from "react";
import { useData } from "@/context/useData";
import { ACTION, FIELD, MSG } from "@/constants/strings";
import { generateSchedule } from "@/lib/scheduler";
import { todayStr } from "@/lib/date";

export function DutyGenerateTab({ onDone }: { onDone?: () => void }) {
  const { staff, holidays, vacations, setDuty } = useData();
  const [start, setStart] = useState(todayStr());
  const [end, setEnd] = useState(todayStr());
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  function generate() {
    setMsg("");
    setError("");
    if (staff.length === 0) {
      setError(MSG.noStaff);
      return;
    }
    if (start > end) {
      setError(MSG.startAfterEnd);
      return;
    }
    const { schedule, unassigned } = generateSchedule(
      start,
      end,
      staff,
      holidays,
      vacations,
    );
    setDuty(schedule);
    const extra =
      unassigned.length > 0
        ? ` (가용 인원이 없어 ${unassigned.length}일은 미배정)`
        : "";
    setMsg(MSG.generated(schedule.length) + extra);
    onDone?.();
  }

  return (
    <div className="max-w-md space-y-4">
      <p className="text-sm text-slate-500">
        주말과 공휴일은 제외되고, 휴가 중인 직원은 건너뜁니다. 당직 횟수가 가장
        적은 직원부터 공평하게 배정합니다.
      </p>
      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-600">
            {FIELD.start}
          </span>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-600">
            {FIELD.end}
          </span>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </label>
        <button
          onClick={generate}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {ACTION.generate}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {msg && <p className="text-sm text-green-700">{msg}</p>}
    </div>
  );
}
