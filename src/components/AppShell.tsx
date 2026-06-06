"use client";

import { useState } from "react";
import { useData } from "@/context/useData";
import { APP, TABS } from "@/constants/strings";
import { StaffTab } from "@/components/tabs/StaffTab";
import { HolidayTab } from "@/components/tabs/HolidayTab";
import { VacationTab } from "@/components/tabs/VacationTab";
import { DutyGenerateTab } from "@/components/tabs/DutyGenerateTab";
import { DutyViewTab } from "@/components/tabs/DutyViewTab";

type TabKey = "staff" | "holiday" | "vacation" | "generate" | "view";

const TAB_ORDER: TabKey[] = [
  "staff",
  "holiday",
  "vacation",
  "generate",
  "view",
];

// 탭은 라우트가 아니라 클라이언트 상태 → DataProvider 가 탭 전환에도 유지된다.
export function AppShell() {
  const { hydrated } = useData();
  const [tab, setTab] = useState<TabKey>("staff");

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{APP.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{APP.subtitle}</p>
      </header>

      <nav className="mb-5 flex flex-wrap gap-1 border-b border-slate-200">
        {TAB_ORDER.map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {TABS[key]}
          </button>
        ))}
      </nav>

      <main>
        {!hydrated ? (
          <div className="py-16 text-center text-sm text-slate-400">
            불러오는 중…
          </div>
        ) : (
          <>
            {tab === "staff" && <StaffTab />}
            {tab === "holiday" && <HolidayTab />}
            {tab === "vacation" && <VacationTab />}
            {tab === "generate" && (
              <DutyGenerateTab onDone={() => setTab("view")} />
            )}
            {tab === "view" && <DutyViewTab />}
          </>
        )}
      </main>
    </div>
  );
}
