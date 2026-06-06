"use client";

import { useMemo } from "react";
import { useData } from "@/context/useData";
import { computeStats } from "@/lib/stats";
import { FIELD } from "@/constants/strings";

// 직원별 당직 횟수 + 공평성 스프레드(max-min). 스프레드가 0~1이면 잘 균형잡힌 것.
export function StatsPanel() {
  const { staff, duty } = useData();
  const stats = useMemo(() => computeStats(staff, duty), [staff, duty]);

  const max = stats.perStaff.length
    ? Math.max(...stats.perStaff.map((s) => s.count))
    : 0;

  const balanced = stats.spread <= 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Stat label="총 당직" value={`${stats.total}건`} />
        <Stat label="직원 수" value={`${stats.perStaff.length}명`} />
        <Stat
          label="공평성 (최다−최소)"
          value={`${stats.spread}`}
          tone={balanced ? "good" : "warn"}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2 font-medium">{FIELD.name}</th>
              <th className="px-3 py-2 font-medium">{FIELD.rank}</th>
              <th className="px-3 py-2 font-medium">당직 횟수</th>
              <th className="px-3 py-2 font-medium">분포</th>
            </tr>
          </thead>
          <tbody>
            {stats.perStaff.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-slate-400">
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              stats.perStaff.map((s) => (
                <tr key={s.name} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-800">{s.name}</td>
                  <td className="px-3 py-2 text-slate-500">{s.rank}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">
                    {s.count}
                  </td>
                  <td className="px-3 py-2">
                    <div className="h-2 w-full rounded bg-slate-100">
                      <div
                        className="h-2 rounded bg-blue-500"
                        style={{
                          width: max ? `${(s.count / max) * 100}%` : "0%",
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "warn";
}) {
  const color =
    tone === "good"
      ? "text-green-700"
      : tone === "warn"
        ? "text-amber-700"
        : "text-slate-900";
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}
