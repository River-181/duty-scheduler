"use client";

import { useState } from "react";
import { ACTION, MSG } from "@/constants/strings";

export interface DialogField {
  key: string;
  label: string;
  type: "text" | "date";
  placeholder?: string;
}

interface EntityDialogProps {
  title: string;
  fields: DialogField[];
  onSave: (values: Record<string, string>) => void;
  onCancel: () => void;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// v1 tk.Toplevel 팝업 대체. 저장 시 필수/날짜 형식 검증 후 인라인 오류 표시.
export function EntityDialog({
  title,
  fields,
  onSave,
  onCancel,
}: EntityDialogProps) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, ""])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const next: Record<string, string> = {};
    for (const f of fields) {
      const v = (values[f.key] ?? "").trim();
      if (!v) {
        next[f.key] = MSG.required;
      } else if (f.type === "date" && !DATE_RE.test(v)) {
        next[f.key] = MSG.invalidDate;
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const trimmed = Object.fromEntries(
      fields.map((f) => [f.key, (values[f.key] ?? "").trim()]),
    );
    onSave(trimmed);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                {f.label}
              </label>
              <input
                type={f.type === "date" ? "date" : "text"}
                value={values[f.key] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.key]: e.target.value }))
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {errors[f.key] && (
                <p className="mt-1 text-xs text-red-600">{errors[f.key]}</p>
              )}
            </div>
          ))}
        </div>
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
