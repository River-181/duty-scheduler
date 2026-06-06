"use client";

import { useState } from "react";
import { useData } from "@/context/useData";
import { DataTable } from "@/components/DataTable";
import { EntityDialog } from "@/components/EntityDialog";
import { Toolbar } from "@/components/Toolbar";
import { FIELD, MSG } from "@/constants/strings";
import type { Vacation } from "@/lib/types";
import { importVacations, exportVacations } from "@/lib/csv";

export function VacationTab() {
  const { vacations, setVacations } = useData();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [dialog, setDialog] = useState(false);
  const [msg, setMsg] = useState("");

  function add(values: Record<string, string>) {
    if (values.start > values.end) {
      setMsg(MSG.startAfterEnd);
      return;
    }
    setVacations([
      ...vacations,
      { name: values.name, start: values.start, end: values.end },
    ]);
    setDialog(false);
    setMsg("");
  }

  function remove() {
    if (selected.size === 0) {
      setMsg(MSG.selectToDelete);
      return;
    }
    setVacations(vacations.filter((_, i) => !selected.has(i)));
    setSelected(new Set());
    setMsg("");
  }

  function handleImport(text: string) {
    const r = importVacations(text);
    if (r.ok === 0 && r.skipped === 0) {
      setMsg(MSG.importFailed);
      return;
    }
    if (
      vacations.length > 0 &&
      !window.confirm(MSG.confirmImport(vacations.length))
    ) {
      return;
    }
    setVacations(r.items as Vacation[]);
    setSelected(new Set());
    setMsg(MSG.imported(r.ok, r.skipped));
  }

  return (
    <div className="space-y-3">
      <Toolbar
        onAdd={() => setDialog(true)}
        onDelete={remove}
        onImport={handleImport}
        onExport={() => exportVacations(vacations)}
        deleteDisabled={selected.size === 0}
      />
      {msg && <p className="text-sm text-slate-500">{msg}</p>}
      <DataTable
        columns={[
          { key: "name", label: FIELD.name },
          { key: "start", label: FIELD.start },
          { key: "end", label: FIELD.end },
        ]}
        rows={vacations as unknown as Record<string, string>[]}
        selected={selected}
        onSelectedChange={setSelected}
      />
      {dialog && (
        <EntityDialog
          title="휴가 추가"
          fields={[
            { key: "name", label: FIELD.name, type: "text" },
            { key: "start", label: FIELD.start, type: "date" },
            { key: "end", label: FIELD.end, type: "date" },
          ]}
          onSave={add}
          onCancel={() => setDialog(false)}
        />
      )}
    </div>
  );
}
