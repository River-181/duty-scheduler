"use client";

import { useMemo, useRef, useState } from "react";
import { useData } from "@/context/useData";
import { ACTION, FIELD, MSG, RULE } from "@/constants/strings";
import { generateSchedule } from "@/lib/scheduler";
import { todayStr } from "@/lib/date";
import { createRule, emptyRule, TEMPLATES } from "@/lib/rules";
import { DutyRuleSchema, type DutyRule } from "@/lib/types";
import { RuleEditor } from "@/components/RuleEditor";

export function DutyGenerateTab({ onDone }: { onDone?: () => void }) {
  const { staff, holidays, vacations, rules, setRules, setDuty } = useData();
  const [start, setStart] = useState(todayStr());
  const [end, setEnd] = useState(todayStr());
  const [selectedId, setSelectedId] = useState<string>("");
  const [editing, setEditing] = useState<DutyRule | null>(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const availableRanks = useMemo(
    () => [...new Set(staff.map((s) => s.rank))],
    [staff],
  );

  // 선택된 규칙(없거나 삭제됐으면 첫 번째로 폴백)
  const current = rules.find((r) => r.id === selectedId) ?? rules[0];

  function generate() {
    setMsg("");
    setError("");
    if (staff.length === 0) {
      setError(MSG.noStaff);
      return;
    }
    if (!current) {
      setError("규칙이 없습니다. 규칙을 먼저 만드세요.");
      return;
    }
    if (start > end) {
      setError(MSG.startAfterEnd);
      return;
    }
    const { schedule, shortfalls } = generateSchedule(
      start,
      end,
      staff,
      holidays,
      vacations,
      current,
    );
    setDuty(schedule);
    const extra = shortfalls.length
      ? ` (${RULE.shortfallSummary(shortfalls.length)})`
      : "";
    setMsg(MSG.generated(schedule.length) + extra);
    onDone?.();
  }

  // ── 규칙 관리 ──
  function saveRule(rule: DutyRule) {
    const exists = rules.some((r) => r.id === rule.id);
    setRules(exists ? rules.map((r) => (r.id === rule.id ? rule : r)) : [...rules, rule]);
    setSelectedId(rule.id);
    setEditing(null);
  }

  function removeRule() {
    if (!current) return;
    if (rules.length === 1) {
      setError("규칙은 최소 1개 필요합니다.");
      return;
    }
    if (!window.confirm(`'${current.name}' 규칙을 삭제할까요?`)) return;
    const next = rules.filter((r) => r.id !== current.id);
    setRules(next);
    setSelectedId(next[0]?.id ?? "");
  }

  function addTemplates() {
    const have = new Set(rules.map((r) => r.id));
    const toAdd = TEMPLATES.filter((t) => !have.has(t.id));
    if (toAdd.length === 0) {
      setMsg("추가할 새 템플릿이 없습니다.");
      return;
    }
    setRules([...rules, ...toAdd]);
    setMsg(`${toAdd.length}개 템플릿을 추가했습니다.`);
  }

  function exportRules() {
    const blob = new Blob([JSON.stringify(rules, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "duty-rules.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function importRules(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const valid = arr
        .map((x) => DutyRuleSchema.safeParse(x))
        .filter((r) => r.success)
        .map((r) => createRule({ ...(r.data as DutyRule) })); // 새 id 부여(충돌 방지)
      if (valid.length === 0) {
        setError("가져올 규칙이 없습니다(형식 오류).");
        return;
      }
      setRules([...rules, ...valid]);
      setMsg(`${valid.length}개 규칙을 가져왔습니다.`);
    } catch {
      setError("JSON 파일을 읽지 못했습니다.");
    }
  }

  const btn =
    "rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40";

  return (
    <div className="max-w-2xl space-y-5">
      {/* 규칙 프리셋 */}
      <section className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">
            {RULE.preset}
          </span>
          <select
            value={current?.id ?? ""}
            onChange={(e) => setSelectedId(e.target.value)}
            className="min-w-48 rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
          >
            {rules.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <div className="flex-1" />
          <button
            className={btn}
            onClick={() => current && setEditing(current)}
            disabled={!current}
          >
            {RULE.edit}
          </button>
          <button
            className={btn}
            onClick={() => setEditing(createRule(emptyRule()))}
          >
            {RULE.newRule}
          </button>
          <button className={btn} onClick={removeRule}>
            {ACTION.delete}
          </button>
        </div>
        {current && <RuleSummary rule={current} />}
        <div className="flex flex-wrap gap-2 pt-1">
          <button className={btn} onClick={addTemplates}>
            {RULE.addTemplates}
          </button>
          <button className={btn} onClick={exportRules}>
            규칙 {ACTION.export}
          </button>
          <button className={btn} onClick={() => fileRef.current?.click()}>
            규칙 {ACTION.import}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={importRules}
          />
        </div>
      </section>

      {/* 기간 + 생성 */}
      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">
              {FIELD.start}
            </span>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
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
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>
        </div>
        <button
          onClick={generate}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {ACTION.generate}
        </button>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {msg && <p className="text-sm text-green-700">{msg}</p>}

      {editing && (
        <RuleEditor
          rule={editing}
          availableRanks={availableRanks}
          onSave={saveRule}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}

const WD = ["일", "월", "화", "수", "목", "금", "토"];
const HOLIDAY_LABEL = {
  exclude: "공휴일 제외",
  include: "공휴일 포함",
  only: "공휴일만",
};
const STRAT_LABEL = { fair: "공평", rotation: "순환", random: "무작위" };

function RuleSummary({ rule }: { rule: DutyRule }) {
  const parts: string[] = [];
  parts.push(
    rule.holidayMode === "only"
      ? "공휴일만"
      : rule.weekdays.map((d) => WD[d]).join("·") +
          " / " +
          HOLIDAY_LABEL[rule.holidayMode],
  );
  parts.push(`하루 ${rule.peoplePerDay}인`);
  parts.push(STRAT_LABEL[rule.strategy]);
  if (rule.minRestDays > 0) parts.push(`휴식 ${rule.minRestDays}일`);
  if (rule.allowedRanks.length) parts.push(`직급 ${rule.allowedRanks.join(",")}`);
  if (rule.requiredRanks.length)
    parts.push(`필수 ${rule.requiredRanks.join(",")}`);
  if (rule.maxPerPerson !== null) parts.push(`최대 ${rule.maxPerPerson}회`);
  if (rule.weekendWeight !== 1) parts.push(`주말×${rule.weekendWeight}`);
  return <p className="text-xs text-slate-500">{parts.join(" · ")}</p>;
}
