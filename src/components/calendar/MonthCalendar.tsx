"use client";

import { useMemo, useState } from "react";
import type { DutyEntry, Holiday } from "@/lib/types";
import { parseDate } from "@/lib/date";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n: number) => String(n).padStart(2, "0");

interface MonthCalendarProps {
  duty: DutyEntry[];
  holidays: Holiday[];
}

// 월 그리드 뷰. 주말·공휴일을 시각적으로 구분하고, 각 날짜 셀에 배정된 당직자
// 이름을 표시한다. date.ts 의 안전한 파싱만 사용해 TZ off-by-one 을 피한다.
export function MonthCalendar({ duty, holidays }: MonthCalendarProps) {
  const dutyByDate = useMemo(() => {
    const m = new Map<string, DutyEntry>();
    for (const d of duty) m.set(d.date, d);
    return m;
  }, [duty]);

  const holidaySet = useMemo(
    () => new Set(holidays.map((h) => h.date)),
    [holidays],
  );

  // 초기 월: 첫 당직 날짜, 없으면 오늘.
  const initial = useMemo(() => {
    const base = duty.length
      ? parseDate(duty[0].date)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return { year: base.getFullYear(), month: base.getMonth() };
  }, [duty]);

  const [cursor, setCursor] = useState(initial);

  const { year, month } = cursor;
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);

  function shift(delta: number) {
    const d = new Date(year, month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => shift(-1)}
          className="rounded-md px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
        >
          ← 이전
        </button>
        <h3 className="text-base font-semibold text-slate-900">
          {year}년 {month + 1}월
        </h3>
        <button
          onClick={() => shift(1)}
          className="rounded-md px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
        >
          다음 →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md bg-slate-200 text-sm">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`bg-slate-100 py-1.5 text-center text-xs font-medium ${
              i === 0 ? "text-red-600" : i === 6 ? "text-blue-600" : "text-slate-500"
            }`}
          >
            {w}
          </div>
        ))}

        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`b${idx}`} className="min-h-16 bg-slate-50" />;
          }
          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
          const weekday = idx % 7;
          const isHoliday = holidaySet.has(dateStr);
          const isSun = weekday === 0;
          const isSat = weekday === 6;
          const entry = dutyByDate.get(dateStr);

          return (
            <div
              key={dateStr}
              className={`min-h-16 p-1.5 ${
                isHoliday ? "bg-red-50" : "bg-white"
              }`}
            >
              <div
                className={`text-xs font-medium ${
                  isHoliday || isSun
                    ? "text-red-600"
                    : isSat
                      ? "text-blue-600"
                      : "text-slate-700"
                }`}
              >
                {day}
              </div>
              {entry && (
                <div className="mt-1 truncate rounded bg-blue-100 px-1 py-0.5 text-xs text-blue-800">
                  {entry.name}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
