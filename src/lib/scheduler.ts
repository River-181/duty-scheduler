import type { Staff, Holiday, Vacation, DutyEntry, DutyRule } from "./types";
import { eachDate, isWeekend, parseDate } from "./date";

// 규칙(DutyRule) 기반 당직 생성 엔진.
// v1(파이썬)은 "평일·공휴일 제외 + 휴가자 건너뛰기 + 라운드로빈" 고정 규칙이었다.
// 여기서는 기관마다 다른 규칙(근무일 정의, 하루 인원, 직급 제약, 휴식 간격,
// 배정 방식, 1인 상한, 주말 가중치)을 받아 처리한다.

/** v1 is_on_vacation(main.py L30) — 문자열 비교로 TZ 무관 */
function isOnVacation(
  dateStr: string,
  name: string,
  vacations: Vacation[],
): boolean {
  return vacations.some(
    (v) => v.name === name && v.start <= dateStr && dateStr <= v.end,
  );
}

/** 규칙에 따라 해당 날짜가 당직일인지 판정 */
function isDutyDay(
  dateStr: string,
  rule: DutyRule,
  holidays: Set<string>,
): boolean {
  const holiday = holidays.has(dateStr);
  if (rule.holidayMode === "only") return holiday;
  const onWeekday = rule.weekdays.includes(parseDate(dateStr).getDay());
  if (rule.holidayMode === "include") return onWeekday || holiday;
  // exclude
  return onWeekday && !holiday;
}

/** 주말 또는 공휴일 → 가중치 적용 대상 */
function isHeavyDay(dateStr: string, holidays: Set<string>): boolean {
  return isWeekend(parseDate(dateStr)) || holidays.has(dateStr);
}

/** 날짜 문자열에서 결정적 시드 생성(무작위 전략 재현용) */
function seedFrom(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 PRNG — 시드 동일 시 동일 수열(테스트·재생성 일관성) */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface PersonState {
  staff: Staff;
  index: number; // 등록 순서(결정적 동점 처리)
  count: number; // 당직 횟수(상한·rotation)
  weighted: number; // 가중 횟수(fair)
  lastDate: string | null; // 마지막 당직일(휴식 간격)
}

export interface Shortfall {
  date: string;
  needed: number;
  filled: number;
  reason: string;
}

export interface GenerateResult {
  schedule: DutyEntry[];
  shortfalls: Shortfall[];
}

function dayGapOk(
  state: PersonState,
  dateStr: string,
  minRestDays: number,
): boolean {
  if (minRestDays <= 0 || !state.lastDate) return true;
  const diff =
    (parseDate(dateStr).getTime() - parseDate(state.lastDate).getTime()) /
    86400000;
  return diff > minRestDays;
}

export function generateSchedule(
  startStr: string,
  endStr: string,
  staff: Staff[],
  holidays: Holiday[],
  vacations: Vacation[],
  rule: DutyRule,
): GenerateResult {
  const holidaySet = new Set(holidays.map((h) => h.date));
  const states: PersonState[] = staff.map((s, index) => ({
    staff: s,
    index,
    count: 0,
    weighted: 0,
    lastDate: null,
  }));

  const schedule: DutyEntry[] = [];
  const shortfalls: Shortfall[] = [];

  const allowed = new Set(rule.allowedRanks);
  const required = new Set(rule.requiredRanks);

  for (const dateStr of eachDate(startStr, endStr)) {
    if (!isDutyDay(dateStr, rule, holidaySet)) continue;

    // 후보군: 휴가 아님 + 허용 직급 + 휴식 간격 충족 + 상한 미만
    const pool = states.filter((st) => {
      if (isOnVacation(dateStr, st.staff.name, vacations)) return false;
      if (allowed.size > 0 && !allowed.has(st.staff.rank)) return false;
      if (!dayGapOk(st, dateStr, rule.minRestDays)) return false;
      if (rule.maxPerPerson !== null && st.count >= rule.maxPerPerson)
        return false;
      return true;
    });

    // 전략별 정렬/선택 순서
    const order = orderPool(pool, dateStr, rule);

    const picked: PersonState[] = [];

    // 시니어(필수 직급) 우선 1명 확보
    if (required.size > 0) {
      const senior = order.find((st) => required.has(st.staff.rank));
      if (senior) picked.push(senior);
    }

    for (const st of order) {
      if (picked.length >= rule.peoplePerDay) break;
      if (!picked.includes(st)) picked.push(st);
    }

    // 결과 기록
    const heavy = isHeavyDay(dateStr, holidaySet);
    for (const st of picked) {
      schedule.push({
        date: dateStr,
        name: st.staff.name,
        rank: st.staff.rank,
      });
      st.count += 1;
      st.weighted += heavy ? rule.weekendWeight : 1;
      st.lastDate = dateStr;
    }

    // 부족분 기록
    const seniorUnmet =
      required.size > 0 && !picked.some((st) => required.has(st.staff.rank));
    if (picked.length < rule.peoplePerDay || seniorUnmet) {
      shortfalls.push({
        date: dateStr,
        needed: rule.peoplePerDay,
        filled: picked.length,
        reason: seniorUnmet
          ? "필수 직급(시니어) 인원 부족"
          : "가용 인원 부족",
      });
    }
  }

  return { schedule, shortfalls };

  function orderPool(
    p: PersonState[],
    dateStr: string,
    r: DutyRule,
  ): PersonState[] {
    if (r.strategy === "random") {
      const rnd = mulberry32(seedFrom(dateStr));
      // Fisher–Yates(결정적)
      const arr = [...p];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
    const key =
      r.strategy === "fair"
        ? (st: PersonState) => st.weighted
        : (st: PersonState) => st.count; // rotation: 가중치 없는 순수 라운드로빈
    return [...p].sort((a, b) => key(a) - key(b) || a.index - b.index);
  }
}
