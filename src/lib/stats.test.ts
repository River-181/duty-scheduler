import { describe, it, expect } from "vitest";
import { computeStats } from "./stats";
import type { Staff, DutyEntry } from "./types";

const staff: Staff[] = [
  { name: "김철수", rank: "사원" },
  { name: "이영희", rank: "대리" },
];

describe("computeStats", () => {
  it("현재 직원을 0건으로도 포함하고 횟수를 센다", () => {
    const duty: DutyEntry[] = [
      { date: "2026-06-01", name: "김철수", rank: "사원" },
      { date: "2026-06-02", name: "김철수", rank: "사원" },
    ];
    const s = computeStats(staff, duty);
    expect(s.total).toBe(2);
    expect(s.perStaff).toEqual([
      { name: "김철수", rank: "사원", count: 2 },
      { name: "이영희", rank: "대리", count: 0 },
    ]);
    expect(s.spread).toBe(2);
  });

  it("표 합계는 항상 total 과 일치한다(삭제된 직원의 당직 포함)", () => {
    // 박민수는 staff 목록에 없지만 스케줄엔 남아 있다(삭제된 직원)
    const duty: DutyEntry[] = [
      { date: "2026-06-01", name: "김철수", rank: "사원" },
      { date: "2026-06-02", name: "박민수", rank: "과장" },
    ];
    const s = computeStats(staff, duty);
    const sum = s.perStaff.reduce((acc, x) => acc + x.count, 0);
    expect(sum).toBe(s.total);
    expect(s.total).toBe(2);
    expect(s.perStaff.some((p) => p.name === "박민수")).toBe(true);
  });

  it("빈 입력은 스프레드 0", () => {
    expect(computeStats([], []).spread).toBe(0);
  });
});
