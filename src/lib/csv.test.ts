import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  importStaff,
  importHolidays,
  importVacations,
  importDuty,
  exportHolidays,
  downloadCsv,
} from "./csv";
import { CSV_HEADERS } from "@/constants/strings";

// downloadCsv 는 DOM/Blob 에 의존하므로, 내보낸 CSV 문자열만 가로채서 검사한다.
let captured = "";
beforeEach(() => {
  captured = "";
  // Blob 생성을 가로채 텍스트를 캡처
  vi.stubGlobal(
    "Blob",
    class {
      constructor(parts: string[]) {
        captured = parts.join("");
      }
    },
  );
  vi.stubGlobal("URL", {
    createObjectURL: () => "blob:mock",
    revokeObjectURL: () => {},
  });
  const a = { href: "", download: "", click: () => {} };
  vi.stubGlobal("document", {
    createElement: () => a,
    body: { appendChild: () => {}, removeChild: () => {} },
  });
});

describe("CSV import (v1 한국어 헤더)", () => {
  it("직원 CSV 를 파싱한다", () => {
    const csv = "이름,직급\n김철수,사원\n이영희,대리\n";
    const r = importStaff(csv);
    expect(r.ok).toBe(2);
    expect(r.skipped).toBe(0);
    expect(r.items[0]).toEqual({ name: "김철수", rank: "사원" });
  });

  it("선두 BOM 을 제거한다", () => {
    const csv = "﻿이름,직급\n박민수,과장\n";
    const r = importStaff(csv);
    expect(r.ok).toBe(1);
    expect(r.items[0].name).toBe("박민수");
  });

  it("따옴표로 감싼 콤마 포함 필드를 한 셀로 처리한다", () => {
    // 설명에 콤마가 들어가도 행이 쪼개지면 안 된다(papaparse 사용 이유)
    const csv = '날짜,설명\n2026-01-01,"신정, 하루 종일"\n';
    const r = importHolidays(csv);
    expect(r.ok).toBe(1);
    expect(r.items[0]).toEqual({
      date: "2026-01-01",
      description: "신정, 하루 종일",
    });
  });

  it("형식 오류 행은 건너뛴다(잘못된 날짜)", () => {
    const csv = "날짜,설명\n2026-13-99,엉터리\n2026-01-01,신정\n";
    const r = importHolidays(csv);
    expect(r.ok).toBe(1);
    expect(r.skipped).toBe(1);
    expect(r.items[0].date).toBe("2026-01-01");
  });

  it("휴가/당직 CSV 도 파싱한다", () => {
    const v = importVacations("이름,시작일,종료일\n김철수,2026-06-01,2026-06-05\n");
    expect(v.items[0]).toEqual({
      name: "김철수",
      start: "2026-06-01",
      end: "2026-06-05",
    });
    const d = importDuty("날짜,이름,직급\n2026-06-01,이영희,대리\n");
    expect(d.items[0]).toEqual({ date: "2026-06-01", name: "이영희", rank: "대리" });
  });
});

describe("CSV export", () => {
  it("BOM + v1 헤더로 내보내고, 콤마 필드는 자동으로 따옴표 처리된다", () => {
    exportHolidays([{ date: "2026-01-01", description: "신정, 하루 종일" }]);
    expect(captured.charCodeAt(0)).toBe(0xfeff); // 선두 BOM
    expect(captured).toContain(CSV_HEADERS.holidays.join(","));
    expect(captured).toContain('"신정, 하루 종일"'); // 콤마 포함 → 따옴표
  });

  it("내보낸 CSV 를 다시 가져오면 동일하다(왕복)", () => {
    const original = [
      { date: "2026-01-01", description: "신정, 하루 종일" },
      { date: "2026-03-01", description: "삼일절" },
    ];
    exportHolidays(original);
    const roundTrip = importHolidays(captured);
    expect(roundTrip.items).toEqual(original);
  });
});

describe("downloadCsv 파일명", () => {
  it("v1 과 동일한 헤더 행을 만든다", () => {
    downloadCsv("staff.csv", CSV_HEADERS.staff, [["김철수", "사원"]]);
    expect(captured).toContain("이름,직급");
  });
});
