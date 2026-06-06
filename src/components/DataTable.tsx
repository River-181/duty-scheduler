"use client";

import { MSG } from "@/constants/strings";

export interface Column {
  key: string;
  label: string;
  /** 셀 커스텀 렌더(예: 요일 배지) */
  render?: (value: string, row: Record<string, string>) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  rows: Record<string, string>[];
  /** 선택된 행 인덱스. 제공 시 체크박스 열이 표시된다. */
  selected?: Set<number>;
  onSelectedChange?: (next: Set<number>) => void;
}

export function DataTable({
  columns,
  rows,
  selected,
  onSelectedChange,
}: DataTableProps) {
  const selectable = !!selected && !!onSelectedChange;

  function toggle(i: number) {
    if (!selected || !onSelectedChange) return;
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    onSelectedChange(next);
  }

  function toggleAll() {
    if (!selected || !onSelectedChange) return;
    if (selected.size === rows.length) onSelectedChange(new Set());
    else onSelectedChange(new Set(rows.map((_, i) => i)));
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-left text-slate-600">
          <tr>
            {selectable && (
              <th className="w-10 px-3 py-2">
                <input
                  type="checkbox"
                  aria-label="전체 선택"
                  checked={rows.length > 0 && selected!.size === rows.length}
                  onChange={toggleAll}
                />
              </th>
            )}
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-2 font-medium">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-3 py-8 text-center text-slate-400"
              >
                {MSG.emptyTable}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={i}
                className="border-t border-slate-100 hover:bg-slate-50"
              >
                {selectable && (
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label={`${i + 1}행 선택`}
                      checked={selected!.has(i)}
                      onChange={() => toggle(i)}
                    />
                  </td>
                )}
                {columns.map((c) => (
                  <td key={c.key} className="px-3 py-2 text-slate-800">
                    {c.render ? c.render(row[c.key] ?? "", row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
