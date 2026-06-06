import type { Staff, Holiday, Vacation, DutyEntry } from "./types";
import { eachDate, isWeekend, parseDate } from "./date";

// v1(파이썬) generate_schedule(main.py L39–54)의 충실한 이식 + 공평성 업그레이드.
//
// v1: collections.deque + rotate(-1) 순수 라운드로빈. 휴가로 회전이 밀리면 누적이
//     불공평해진다.
// v2: "현재 당직 횟수가 가장 적은 사람"을 고르는 최소 카운트 그리디. 모든 스킵 규칙
//     (주말·공휴일 제외, 휴가자 제외, 아무도 없으면 미배정)은 그대로 유지한다.
//     동점은 staff 배열 인덱스 오름차순 → 결정적이며, 동일 카운트 상태에서는
//     라운드로빈과 같은 순서를 재현한다.

/** v1 is_holiday(main.py L27) */
function holidaySet(holidays: Holiday[]): Set<string> {
  return new Set(holidays.map((h) => h.date));
}

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

export interface GenerateResult {
  schedule: DutyEntry[];
  /** 근무일이지만 가용 인원이 없어 배정하지 못한 날짜 목록 */
  unassigned: string[];
}

export function generateSchedule(
  startStr: string,
  endStr: string,
  staff: Staff[],
  holidays: Holiday[],
  vacations: Vacation[],
): GenerateResult {
  const holidays_ = holidaySet(holidays);
  const counts = new Map<string, number>(staff.map((s) => [s.name, 0]));
  const schedule: DutyEntry[] = [];
  const unassigned: string[] = [];

  for (const dateStr of eachDate(startStr, endStr)) {
    const d = parseDate(dateStr);
    if (isWeekend(d) || holidays_.has(dateStr)) continue; // v1 스킵 규칙

    // 그날 휴가가 아닌 직원만 후보. 배열 인덱스를 동점 처리에 사용.
    let pick: Staff | null = null;
    let pickCount = Infinity;
    for (const s of staff) {
      if (isOnVacation(dateStr, s.name, vacations)) continue;
      const c = counts.get(s.name) ?? 0;
      if (c < pickCount) {
        pick = s;
        pickCount = c;
      }
    }

    if (!pick) {
      // v1과 동일: 가용 인원이 없으면 그날은 배정하지 않는다.
      unassigned.push(dateStr);
      continue;
    }

    schedule.push({ date: dateStr, name: pick.name, rank: pick.rank });
    counts.set(pick.name, pickCount + 1);
  }

  return { schedule, unassigned };
}
