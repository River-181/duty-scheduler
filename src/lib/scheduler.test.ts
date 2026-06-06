import { describe, it, expect } from "vitest";
import { generateSchedule } from "./scheduler";
import { isWeekend, parseDate, eachDate } from "./date";
import { defaultRule } from "./rules";
import type { Staff, Holiday, Vacation, DutyRule } from "./types";

const staff: Staff[] = [
  { name: "김철수", rank: "사원" },
  { name: "이영희", rank: "대리" },
  { name: "박민수", rank: "과장" },
  { name: "최지우", rank: "사원" },
];

// 기본 규칙(평일 1인 공평)에 부분 덮어쓰기
function rule(overrides: Partial<DutyRule> = {}): DutyRule {
  return { ...defaultRule(), ...overrides };
}

const gen = (
  start: string,
  end: string,
  r: DutyRule,
  h: Holiday[] = [],
  v: Vacation[] = [],
  s: Staff[] = staff,
) => generateSchedule(start, end, s, h, v, r);

describe("date helpers", () => {
  it("주말 매핑: 금(평일)/토·일(주말)", () => {
    expect(isWeekend(parseDate("2025-06-06"))).toBe(false);
    expect(isWeekend(parseDate("2025-06-07"))).toBe(true);
    expect(isWeekend(parseDate("2025-06-08"))).toBe(true);
  });
  it("eachDate 경계 포함, off-by-one 없음(월 경계)", () => {
    expect(eachDate("2025-02-27", "2025-03-02")).toEqual([
      "2025-02-27",
      "2025-02-28",
      "2025-03-01",
      "2025-03-02",
    ]);
  });
});

describe("기본 규칙(평일 1인 공평)", () => {
  it("금요일은 배정된다(getDay>=5 버그 가드)", () => {
    const { schedule } = gen("2025-06-06", "2025-06-06", rule());
    expect(schedule).toHaveLength(1);
    expect(schedule[0].date).toBe("2025-06-06");
  });

  it("주말과 공휴일은 제외된다", () => {
    const holidays: Holiday[] = [{ date: "2025-06-06", description: "현충일" }];
    const { schedule } = gen("2025-06-06", "2025-06-09", rule(), holidays);
    expect(schedule).toHaveLength(1);
    expect(schedule[0].date).toBe("2025-06-09");
  });

  it("휴가 중인 직원은 배정되지 않는다", () => {
    const vac: Vacation[] = [
      { name: "김철수", start: "2025-06-09", end: "2025-06-13" },
    ];
    const { schedule } = gen("2025-06-09", "2025-06-13", rule(), [], vac);
    expect(schedule).toHaveLength(5);
    expect(schedule.some((s) => s.name === "김철수")).toBe(false);
  });

  it("공평성: 한 달 스프레드 <= 1", () => {
    const { schedule } = gen("2025-06-01", "2025-06-30", rule());
    const counts = new Map<string, number>(staff.map((s) => [s.name, 0]));
    for (const d of schedule) counts.set(d.name, (counts.get(d.name) ?? 0) + 1);
    const vals = [...counts.values()];
    expect(Math.max(...vals) - Math.min(...vals)).toBeLessThanOrEqual(1);
  });

  it("가용 인원이 없으면 부족분(shortfall) 기록", () => {
    const vac: Vacation[] = staff.map((s) => ({
      name: s.name,
      start: "2025-06-09",
      end: "2025-06-09",
    }));
    const { schedule, shortfalls } = gen("2025-06-09", "2025-06-09", rule(), [], vac);
    expect(schedule).toHaveLength(0);
    expect(shortfalls).toEqual([
      { date: "2025-06-09", needed: 1, filled: 0, reason: "가용 인원 부족" },
    ]);
  });
});

describe("근무일 정의", () => {
  it("주말 포함(weekdays 0~6)", () => {
    const { schedule } = gen("2025-06-07", "2025-06-08", rule({ weekdays: [0, 1, 2, 3, 4, 5, 6] }));
    expect(schedule.map((s) => s.date)).toEqual(["2025-06-07", "2025-06-08"]);
  });

  it("holidayMode include: 공휴일에도 배정", () => {
    const holidays: Holiday[] = [{ date: "2025-06-06", description: "현충일" }];
    const { schedule } = gen("2025-06-06", "2025-06-06", rule({ holidayMode: "include" }), holidays);
    expect(schedule).toHaveLength(1);
  });

  it("holidayMode only: 공휴일에만 배정", () => {
    const holidays: Holiday[] = [{ date: "2025-06-11", description: "임시공휴일" }];
    // 06-09~06-13 중 공휴일(수, 06-11)에만
    const { schedule } = gen("2025-06-09", "2025-06-13", rule({ holidayMode: "only" }), holidays);
    expect(schedule.map((s) => s.date)).toEqual(["2025-06-11"]);
  });

  it("특정 요일만(월·수·금)", () => {
    // 2025-06-09(월)~15(일): 월(9) 수(11) 금(13)
    const { schedule } = gen("2025-06-09", "2025-06-15", rule({ weekdays: [1, 3, 5] }));
    expect(schedule.map((s) => s.date)).toEqual([
      "2025-06-09",
      "2025-06-11",
      "2025-06-13",
    ]);
  });
});

describe("조 구성", () => {
  it("하루 N명 배정", () => {
    const { schedule } = gen("2025-06-09", "2025-06-09", rule({ peoplePerDay: 2 }));
    expect(schedule.filter((s) => s.date === "2025-06-09")).toHaveLength(2);
  });

  it("allowedRanks: 허용 직급만 배정", () => {
    const { schedule } = gen("2025-06-01", "2025-06-30", rule({ allowedRanks: ["과장"] }));
    expect(schedule.every((s) => s.rank === "과장")).toBe(true);
    expect(schedule.every((s) => s.name === "박민수")).toBe(true);
  });

  it("requiredRanks: 매일 시니어 최소 1명 포함", () => {
    const { schedule, shortfalls } = gen(
      "2025-06-09",
      "2025-06-13",
      rule({ peoplePerDay: 2, requiredRanks: ["과장"] }),
    );
    expect(shortfalls).toHaveLength(0);
    const byDate = new Map<string, string[]>();
    for (const s of schedule) {
      byDate.set(s.date, [...(byDate.get(s.date) ?? []), s.rank]);
    }
    for (const ranks of byDate.values()) {
      expect(ranks).toContain("과장");
    }
  });
});

describe("배정 방식 · 휴식 · 상한", () => {
  it("minRestDays=1: 연속일 같은 사람 금지", () => {
    const two: Staff[] = [
      { name: "A", rank: "사원" },
      { name: "B", rank: "사원" },
    ];
    const { schedule } = gen("2025-06-09", "2025-06-13", rule({ minRestDays: 1 }), [], [], two);
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].name).not.toBe(schedule[i - 1].name);
    }
  });

  it("maxPerPerson 상한을 넘지 않는다", () => {
    const { schedule, shortfalls } = gen(
      "2025-06-01",
      "2025-06-30",
      rule({ maxPerPerson: 2 }),
    );
    const counts = new Map<string, number>();
    for (const s of schedule) counts.set(s.name, (counts.get(s.name) ?? 0) + 1);
    for (const c of counts.values()) expect(c).toBeLessThanOrEqual(2);
    // 4명*2회=8건만 가능 → 나머지 평일은 부족분
    expect(schedule).toHaveLength(8);
    expect(shortfalls.length).toBeGreaterThan(0);
  });

  it("rotation: 등록 순서대로 순환", () => {
    const { schedule } = gen("2025-06-09", "2025-06-13", rule({ strategy: "rotation" }));
    expect(schedule.map((s) => s.name)).toEqual([
      "김철수",
      "이영희",
      "박민수",
      "최지우",
      "김철수",
    ]);
  });

  it("random: 같은 입력은 같은 결과(결정적 시드)", () => {
    const a = gen("2025-06-01", "2025-06-30", rule({ strategy: "random" }));
    const b = gen("2025-06-01", "2025-06-30", rule({ strategy: "random" }));
    expect(a.schedule).toEqual(b.schedule);
  });

  it("weekendWeight: 주말 가중으로 주말 당직이 분산된다", () => {
    // 주말 포함, 가중 2 → 주말 당직을 한 사람이 몰아받지 않음
    const { schedule } = gen(
      "2025-06-01",
      "2025-06-30",
      rule({ weekdays: [0, 1, 2, 3, 4, 5, 6], weekendWeight: 2 }),
    );
    const weekendCounts = new Map<string, number>(staff.map((s) => [s.name, 0]));
    for (const s of schedule) {
      if (isWeekend(parseDate(s.date)))
        weekendCounts.set(s.name, (weekendCounts.get(s.name) ?? 0) + 1);
    }
    const vals = [...weekendCounts.values()];
    expect(Math.max(...vals) - Math.min(...vals)).toBeLessThanOrEqual(1);
  });
});
