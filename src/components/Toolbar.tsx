"use client";

import { useRef } from "react";
import { ACTION } from "@/constants/strings";

interface ToolbarProps {
  onAdd: () => void;
  onDelete: () => void;
  onImport: (text: string) => void;
  onExport: () => void;
  deleteDisabled?: boolean;
}

// 추가 / 삭제 / 가져오기(CSV) / 내보내기(CSV)
export function Toolbar({
  onAdd,
  onDelete,
  onImport,
  onExport,
  deleteDisabled,
}: ToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const text = await file.text();
      onImport(text);
    }
    // 같은 파일 다시 선택해도 onChange 발생하도록 초기화
    e.target.value = "";
  }

  const base =
    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={onAdd}
        className={`${base} bg-blue-600 text-white hover:bg-blue-700`}
      >
        {ACTION.add}
      </button>
      <button
        onClick={onDelete}
        disabled={deleteDisabled}
        className={`${base} bg-red-50 text-red-700 hover:bg-red-100`}
      >
        {ACTION.delete}
      </button>
      <div className="flex-1" />
      <button
        onClick={() => fileRef.current?.click()}
        className={`${base} border border-slate-300 text-slate-700 hover:bg-slate-100`}
      >
        {ACTION.import}
      </button>
      <button
        onClick={onExport}
        className={`${base} border border-slate-300 text-slate-700 hover:bg-slate-100`}
      >
        {ACTION.export}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
