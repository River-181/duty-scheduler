"use client";

import { useState } from "react";
import { ACTION, RULE } from "@/constants/strings";
import { WEEKDAY_LABELS } from "@/lib/rules";
import type { DutyRule, HolidayMode, Strategy } from "@/lib/types";

interface RuleEditorProps {
  rule: DutyRule;
  availableRanks: string[];
  onSave: (rule: DutyRule) => void;
  onCancel: () => void;
}

// 규칙(룰셋) 편집 모달 — 기관별 당직 조건을 한 화면에서 구성한다.
export function RuleEditor({
  rule,
  availableRanks,
  onSave,
  onCancel,
}: RuleEditorProps) {
  const [r, setR] = useState<DutyRule>(rule);
  const [error, setError] = useState("");

  function set<K extends keyof DutyRule>(key: K, value: DutyRule[K]) {
    setR((prev) => ({ ...prev, [key]: value }));
  }

  function toggleWeekday(d: number) {
    set(
      "weekdays",
      r.weekdays.includes(d)
        ? r.weekdays.filter((x) => x !== d)
        : [...r.weekdays, d].sort(),
    );
  }

  function toggleRank(field: "allowedRanks" | "requiredRanks", rank: string) {
    const cur = r[field];
    set(
      field,
      cur.includes(rank) ? cur.filter((x) => x !== rank) : [...cur, rank],
    );
  }

  function handleSave() {
    if (!r.name.trim()) {
      setError(RULE.name + "을 입력하세요.");
      return;
    }
    if (r.holidayMode !== "only" && r.weekdays.length === 0) {
      setError("근무 요일을 1개 이상 선택하세요.");
      return;
    }
    onSave({ ...r, name: r.name.trim() });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          {RULE.preset} {RULE.edit}
        </h2>

        <div className="space-y-4 text-sm">
          {/* 이름 */}
          <Field label={RULE.name}>
            <input
              type="text"
              value={r.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="예: 평일 1인 공평"
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </Field>

          {/* 근무 요일 */}
          <Field label={RULE.workdays}>
            <div className="flex gap-1">
              {WEEKDAY_LABELS.map((label, d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleWeekday(d)}
                  className={`h-9 w-9 rounded-md text-sm font-medium ${
                    r.weekdays.includes(d)
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  } ${d === 0 ? "text-red-500" : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>

          {/* 공휴일 처리 */}
          <Field label={RULE.holidayMode}>
            <RadioRow
              value={r.holidayMode}
              onChange={(v) => set("holidayMode", v as HolidayMode)}
              options={[
                { value: "exclude", label: RULE.holidayExclude },
                { value: "include", label: RULE.holidayInclude },
                { value: "only", label: RULE.holidayOnly },
              ]}
            />
          </Field>

          {/* 하루 인원 */}
          <Field label={RULE.peoplePerDay}>
            <input
              type="number"
              min={1}
              value={r.peoplePerDay}
              onChange={(e) =>
                set("peoplePerDay", Math.max(1, Number(e.target.value) || 1))
              }
              className="w-24 rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </Field>

          {/* 직급 제약 */}
          {availableRanks.length > 0 && (
            <>
              <Field label={RULE.allowedRanks} hint={RULE.allowedRanksHint}>
                <RankChips
                  ranks={availableRanks}
                  selected={r.allowedRanks}
                  onToggle={(rank) => toggleRank("allowedRanks", rank)}
                />
              </Field>
              <Field label={RULE.requiredRanks} hint={RULE.requiredRanksHint}>
                <RankChips
                  ranks={availableRanks}
                  selected={r.requiredRanks}
                  onToggle={(rank) => toggleRank("requiredRanks", rank)}
                />
              </Field>
            </>
          )}

          {/* 배정 방식 */}
          <Field label={RULE.strategy}>
            <RadioRow
              value={r.strategy}
              onChange={(v) => set("strategy", v as Strategy)}
              options={[
                { value: "fair", label: RULE.stratFair },
                { value: "rotation", label: RULE.stratRotation },
                { value: "random", label: RULE.stratRandom },
              ]}
            />
          </Field>

          {/* 휴식 간격 / 상한 / 가중치 */}
          <div className="grid grid-cols-3 gap-3">
            <Field label={RULE.minRestDays}>
              <input
                type="number"
                min={0}
                value={r.minRestDays}
                onChange={(e) =>
                  set("minRestDays", Math.max(0, Number(e.target.value) || 0))
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              />
            </Field>
            <Field label={RULE.maxPerPerson}>
              <input
                type="number"
                min={1}
                value={r.maxPerPerson ?? ""}
                placeholder="∞"
                onChange={(e) =>
                  set(
                    "maxPerPerson",
                    e.target.value === ""
                      ? null
                      : Math.max(1, Number(e.target.value) || 1),
                  )
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              />
            </Field>
            <Field label={RULE.weekendWeight}>
              <input
                type="number"
                min={0}
                step={0.5}
                value={r.weekendWeight}
                onChange={(e) =>
                  set("weekendWeight", Math.max(0, Number(e.target.value) || 0))
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              />
            </Field>
          </div>
          <p className="text-xs text-slate-400">
            {RULE.minRestHint} · {RULE.maxPerPersonHint} · {RULE.weekendWeightHint}
          </p>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            {ACTION.cancel}
          </button>
          <button
            onClick={handleSave}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {ACTION.save}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block font-medium text-slate-600">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function RadioRow({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 text-sm ${
            value === o.value
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function RankChips({
  ranks,
  selected,
  onToggle,
}: {
  ranks: string[];
  selected: string[];
  onToggle: (rank: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {ranks.map((rank) => (
        <button
          key={rank}
          type="button"
          onClick={() => onToggle(rank)}
          className={`rounded-full px-3 py-1 text-sm ${
            selected.includes(rank)
              ? "bg-blue-100 text-blue-800 ring-1 ring-blue-400"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {rank}
        </button>
      ))}
    </div>
  );
}
