"use client";

import { useState } from "react";
import { useData } from "@/context/useData";
import { DataTable } from "@/components/DataTable";
import { EntityDialog } from "@/components/EntityDialog";
import { Toolbar } from "@/components/Toolbar";
import { FIELD, MSG } from "@/constants/strings";
import type { Holiday } from "@/lib/types";
import { importHolidays, exportHolidays } from "@/lib/csv";
import { weekdayKo } from "@/lib/date";

export function HolidayTab() {
  const { holidays, setHolidays } = useData();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [dialog, setDialog] = useState(false);
  const [msg, setMsg] = useState("");

  function add(values: Record<string, string>) {
    setHolidays([
      ...holidays,
      { date: values.date, description: values.description },
    ]);
    setDialog(false);
    setMsg("");
  }

  function remove() {
    if (selected.size === 0) {
      setMsg(MSG.selectToDelete);
      return;
    }
    setHolidays(holidays.filter((_, i) => !selected.has(i)));
    setSelected(new Set());
    setMsg("");
  }

  function handleImport(text: string) {
    const r = importHolidays(text);
    if (r.ok === 0 && r.skipped === 0) {
      setMsg(MSG.importFailed);
      return;
    }
    if (
      holidays.length > 0 &&
      !window.confirm(MSG.confirmImport(holidays.length))
    ) {
      return;
    }
    setHolidays(r.items as Holiday[]);
    setSelected(new Set());
    setMsg(MSG.imported(r.ok, r.skipped));
  }

  return (
    <div className="space-y-3">
      <Toolbar
        onAdd={() => setDialog(true)}
        onDelete={remove}
        onImport={handleImport}
        onExport={() => exportHolidays(holidays)}
        deleteDisabled={selected.size === 0}
      />
      {msg && <p className="text-sm text-slate-500">{msg}</p>}
      <DataTable
        columns={[
          {
            key: "date",
            label: FIELD.date,
            render: (v) => (v ? `${v} (${weekdayKo(v)})` : ""),
          },
          { key: "description", label: FIELD.description },
        ]}
        rows={holidays as unknown as Record<string, string>[]}
        selected={selected}
        onSelectedChange={setSelected}
      />
      {dialog && (
        <EntityDialog
          title={`${FIELD.date} 추가`}
          fields={[
            { key: "date", label: FIELD.date, type: "date" },
            { key: "description", label: FIELD.description, type: "text" },
          ]}
          onSave={add}
          onCancel={() => setDialog(false)}
        />
      )}
    </div>
  );
}
