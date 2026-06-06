// 날짜 유틸 — 타임존 함정 차단이 핵심.
//
// 규칙:
//  1) 주말 판정: JS getDay()는 일=0..토=6. v1 파이썬의 weekday()<5(=근무일)에
//     대응하는 주말은 일(0) 또는 토(6). 절대 getDay()>=5 로 쓰지 말 것(금요일 오인).
//  2) 날짜 전용 값에 new Date("YYYY-MM-DD") / toISOString() 금지 — UTC 왕복으로
//     하루가 밀린다. 컴포넌트 단위로 파싱하고 로컬 기준으로 포맷한다.
//  3) 공휴일/휴가 비교는 "YYYY-MM-DD" 문자열 사전순 비교로 처리 → TZ 무관.

const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" → 로컬 자정 기준 Date */
export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Date → "YYYY-MM-DD" (로컬 기준, UTC 변환 없음) */
export function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 주말(토·일) 여부 */
export function isWeekend(d: Date): boolean {
  const w = d.getDay();
  return w === 0 || w === 6;
}

/** start..end(포함) 사이의 모든 날짜를 "YYYY-MM-DD"로 반환. start>end면 빈 배열. */
export function eachDate(startStr: string, endStr: string): string[] {
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  const out: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    out.push(formatDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** 오늘 "YYYY-MM-DD" */
export function todayStr(): string {
  return formatDate(new Date());
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

/** "YYYY-MM-DD" → 요일 한글 한 글자 */
export function weekdayKo(dateStr: string): string {
  return WEEKDAY_KO[parseDate(dateStr).getDay()];
}
