import { describe, it, expect } from "vitest";
import { generateSchedule } from "./scheduler";
import { isWeekend, parseDate, eachDate } from "./date";
import type { Staff, Holiday, Vacation } from "./types";

const staff: Staff[] = [
  { name: "김철수", rank: "사원" },
  { name: "이영희", rank: "대리" },
  { name: "박민수", rank: "과장" },
  { name: "최지우", rank: "사원" },
];

describe("date helpers", () => {
  it("주말 매핑: 금(평일)/토·일(주말)", () => {
    expect(isWeekend(parseDate("2025-06-06"))).toBe(false); // 금
    expect(isWeekend(parseDate("2025-06-07"))).toBe(true); // 토
    expect(isWeekend(parseDate("2025-06-08"))).toBe(true); // 일
  });

  it("eachDate 는 경계를 포함하고 off-by-one 이 없다(월 경계)", () => {
    expect(eachDate("2025-02-27", "2025-03-02")).toEqual([
      "2025-02-27",
      "2025-02-28",
      "2025-03-01",
      "2025-03-02",
    ]);
  });
});

describe("generateSchedule", () => {
  it("금요일은 배정된다(getDay>=5 버그 가드)", () => {
    const { schedule } = generateSchedule("2025-06-06", "2025-06-06", staff, [], []);
    expect(schedule).toHaveLength(1);
    expect(schedule[0].date).toBe("2025-06-06");
  });

  it("주말과 공휴일은 제외된다", () => {
    const holidays: Holiday[] = [{ date: "2025-06-06", description: "현충일" }];
    // 06-06(금,공휴일) 07(토) 08(일) 09(월) → 월요일만 배정
    const { schedule } = generateSchedule(
      "2025-06-06",
      "2025-06-09",
      staff,
      holidays,
      [],
    );
    expect(schedule).toHaveLength(1);
    expect(schedule[0].date).toBe("2025-06-09");
  });

  it("휴가 중인 직원은 배정되지 않는다", () => {
    const vac: Vacation[] = [
      { name: "김철수", start: "2025-06-09", end: "2025-06-13" },
    ];
    const { schedule } = generateSchedule("2025-06-09", "2025-06-13", staff, [], vac);
    expect(schedule).toHaveLength(5); // 월~금
    expect(schedule.some((s) => s.name === "김철수")).toBe(false);
  });

  it("공평성: 한 달 배정 시 스프레드 <= 1", () => {
    const { schedule } = generateSchedule("2025-06-01", "2025-06-30", staff, [], []);
    const counts = new Map<string, number>(staff.map((s) => [s.name, 0]));
    for (const d of schedule) counts.set(d.name, (counts.get(d.name) ?? 0) + 1);
    const vals = [...counts.values()];
    expect(Math.max(...vals) - Math.min(...vals)).toBeLessThanOrEqual(1);
  });

  it("가용 인원이 없으면 그날은 미배정", () => {
    const vac: Vacation[] = staff.map((s) => ({
      name: s.name,
      start: "2025-06-09",
      end: "2025-06-09",
    }));
    const { schedule, unassigned } = generateSchedule(
      "2025-06-09",
      "2025-06-09",
      staff,
      [],
      vac,
    );
    expect(schedule).toHaveLength(0);
    expect(unassigned).toEqual(["2025-06-09"]);
  });
});
