"use client";

import { useState } from "react";
import { useData } from "@/context/useData";
import { DataTable } from "@/components/DataTable";
import { EntityDialog } from "@/components/EntityDialog";
import { Toolbar } from "@/components/Toolbar";
import { FIELD, MSG } from "@/constants/strings";
import type { Staff } from "@/lib/types";
import { importStaff, exportStaff } from "@/lib/csv";

export function StaffTab() {
  const { staff, setStaff } = useData();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [dialog, setDialog] = useState(false);
  const [msg, setMsg] = useState("");

  function add(values: Record<string, string>) {
    setStaff([...staff, { name: values.name, rank: values.rank }]);
    setDialog(false);
    setMsg("");
  }

  function remove() {
    if (selected.size === 0) {
      setMsg(MSG.selectToDelete);
      return;
    }
    setStaff(staff.filter((_, i) => !selected.has(i)));
    setSelected(new Set());
    setMsg("");
  }

  function handleImport(text: string) {
    const r = importStaff(text);
    if (r.ok === 0 && r.skipped === 0) {
      setMsg(MSG.importFailed);
      return;
    }
    if (staff.length > 0 && !window.confirm(MSG.confirmImport(staff.length))) {
      return;
    }
    setStaff(r.items as Staff[]);
    setSelected(new Set());
    setMsg(MSG.imported(r.ok, r.skipped));
  }

  return (
    <div className="space-y-3">
      <Toolbar
        onAdd={() => setDialog(true)}
        onDelete={remove}
        onImport={handleImport}
        onExport={() => exportStaff(staff)}
        deleteDisabled={selected.size === 0}
      />
      {msg && <p className="text-sm text-slate-500">{msg}</p>}
      <DataTable
        columns={[
          { key: "name", label: FIELD.name },
          { key: "rank", label: FIELD.rank },
        ]}
        rows={staff as unknown as Record<string, string>[]}
        selected={selected}
        onSelectedChange={setSelected}
      />
      {dialog && (
        <EntityDialog
          title={`${FIELD.name} ${FIELD.rank} 추가`}
          fields={[
            { key: "name", label: FIELD.name, type: "text" },
            { key: "rank", label: FIELD.rank, type: "text" },
          ]}
          onSave={add}
          onCancel={() => setDialog(false)}
        />
      )}
    </div>
  );
}
