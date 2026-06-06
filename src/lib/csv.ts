import Papa from "papaparse";
import type { ZodType } from "zod";
import { CSV_HEADERS } from "@/constants/strings";
import {
  type Staff,
  type Holiday,
  type Vacation,
  type DutyEntry,
  StaffSchema,
  HolidaySchema,
  VacationSchema,
  DutyEntrySchema,
} from "./types";

// 모두 클라이언트 측. v1(파이썬) CSV 와 1:1 호환:
//  - 헤더는 한국어, 열 순서 고정(CSV_HEADERS)
//  - 내보내기: 선두에 BOM(엑셀 한글 깨짐 방지)
//  - 가져오기: papaparse 로 따옴표·콤마 포함 필드 안전 처리, BOM 제거

export interface ImportResult<T> {
  items: T[];
  ok: number;
  skipped: number;
}

// CSV 한국어 헤더 → 객체 필드 매핑
type FieldMap = Record<string, string>;

const STAFF_MAP: FieldMap = { 이름: "name", 직급: "rank" };
const HOLIDAY_MAP: FieldMap = { 날짜: "date", 설명: "description" };
const VACATION_MAP: FieldMap = { 이름: "name", 시작일: "start", 종료일: "end" };
const DUTY_MAP: FieldMap = { 날짜: "date", 이름: "name", 직급: "rank" };

function parseWithSchema<T>(
  text: string,
  map: FieldMap,
  schema: ZodType<T>,
): ImportResult<T> {
  // 방어적 BOM 제거(papaparse 가 대개 처리하지만 안전망)
  const clean = text.replace(/^﻿/, "");
  const parsed = Papa.parse<Record<string, string>>(clean, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const items: T[] = [];
  let skipped = 0;

  for (const row of parsed.data) {
    const obj: Record<string, string> = {};
    for (const [korHeader, field] of Object.entries(map)) {
      obj[field] = (row[korHeader] ?? "").trim();
    }
    const result = schema.safeParse(obj);
    if (result.success) {
      items.push(result.data);
    } else {
      skipped += 1;
    }
  }

  return { items, ok: items.length, skipped };
}

export function importStaff(text: string): ImportResult<Staff> {
  return parseWithSchema(text, STAFF_MAP, StaffSchema);
}
export function importHolidays(text: string): ImportResult<Holiday> {
  return parseWithSchema(text, HOLIDAY_MAP, HolidaySchema);
}
export function importVacations(text: string): ImportResult<Vacation> {
  return parseWithSchema(text, VACATION_MAP, VacationSchema);
}
export function importDuty(text: string): ImportResult<DutyEntry> {
  return parseWithSchema(text, DUTY_MAP, DutyEntrySchema);
}

// ── 내보내기 ──────────────────────────────────────────────

function buildCsv(header: readonly string[], rows: string[][]): string {
  const body = Papa.unparse(
    { fields: [...header], data: rows },
    { quotes: false },
  );
  return "﻿" + body; // 엑셀 한글용 BOM
}

export function downloadCsv(
  filename: string,
  header: readonly string[],
  rows: string[][],
): void {
  const csv = buildCsv(header, rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportStaff(items: Staff[]): void {
  downloadCsv(
    "staff.csv",
    CSV_HEADERS.staff,
    items.map((s) => [s.name, s.rank]),
  );
}
export function exportHolidays(items: Holiday[]): void {
  downloadCsv(
    "holidays.csv",
    CSV_HEADERS.holidays,
    items.map((h) => [h.date, h.description]),
  );
}
export function exportVacations(items: Vacation[]): void {
  downloadCsv(
    "vacations.csv",
    CSV_HEADERS.vacations,
    items.map((v) => [v.name, v.start, v.end]),
  );
}
export function exportDuty(items: DutyEntry[]): void {
  downloadCsv(
    "duty_schedule.csv",
    CSV_HEADERS.duty,
    items.map((d) => [d.date, d.name, d.rank]),
  );
}
