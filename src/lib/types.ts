import { z } from "zod";

// v1(파이썬) CSV 행 모양을 그대로 따른다 → CSV 왕복이 단순해진다.
export interface Staff {
  name: string; // 이름
  rank: string; // 직급
}

export interface Holiday {
  date: string; // 날짜 (YYYY-MM-DD)
  description: string; // 설명
}

export interface Vacation {
  name: string; // 이름
  start: string; // 시작일 (YYYY-MM-DD)
  end: string; // 종료일 (YYYY-MM-DD)
}

export interface DutyEntry {
  date: string; // 날짜 (YYYY-MM-DD)
  name: string; // 이름
  rank: string; // 직급
}

// 날짜 전용 문자열 검증. 신뢰할 수 없는 입력(CSV 가져오기) 경계에서만 zod 사용.
// 패턴뿐 아니라 실제 달력상 유효한 날짜인지까지 확인한다(2026-13-99, 2월 30일 등 거부).
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다")
  .refine((s) => {
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return (
      dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
    );
  }, "존재하지 않는 날짜입니다");

export const StaffSchema = z.object({
  name: z.string().min(1),
  rank: z.string().min(1),
});

export const HolidaySchema = z.object({
  date: dateString,
  description: z.string().min(1),
});

export const VacationSchema = z.object({
  name: z.string().min(1),
  start: dateString,
  end: dateString,
});

export const DutyEntrySchema = z.object({
  date: dateString,
  name: z.string().min(1),
  rank: z.string(),
});

// ── 당직 규칙(룰셋) ───────────────────────────────────────────
// 기관마다 자기 규칙을 프리셋으로 저장/선택해 당직을 생성한다.

export type Strategy = "fair" | "rotation" | "random";

// 공휴일 처리:
//  exclude — 근무 요일이어도 공휴일이면 당직 제외(평일 당직의 기본)
//  include — 공휴일도 정상 당직일로 취급
//  only    — 오직 공휴일만 당직일(요일 설정 무시)
export type HolidayMode = "exclude" | "include" | "only";

export interface DutyRule {
  id: string;
  name: string; // 프리셋 이름
  // 근무일 정의
  weekdays: number[]; // 당직 대상 요일 (0=일 .. 6=토)
  holidayMode: HolidayMode;
  // 조 구성
  peoplePerDay: number; // 하루 당직 인원 (>=1)
  allowedRanks: string[]; // 당직 가능 직급 ([] = 전체 허용)
  requiredRanks: string[]; // 하루 조에 최소 1명 포함해야 하는 직급 ([] = 제약 없음)
  // 배정 방식 · 휴식
  strategy: Strategy;
  minRestDays: number; // 같은 사람 재당직 최소 간격(달력일, 0 = 제약 없음)
  // 상한 · 가중치
  maxPerPerson: number | null; // 1인 최대 당직 횟수 (null = 무제한)
  weekendWeight: number; // 주말·공휴일 당직 가중치(fair 전략, 기본 1)
}

export const DutyRuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  weekdays: z.array(z.number().int().min(0).max(6)),
  holidayMode: z.enum(["exclude", "include", "only"]),
  peoplePerDay: z.number().int().min(1).max(50),
  allowedRanks: z.array(z.string()),
  requiredRanks: z.array(z.string()),
  strategy: z.enum(["fair", "rotation", "random"]),
  minRestDays: z.number().int().min(0).max(365),
  maxPerPerson: z.number().int().min(1).nullable(),
  weekendWeight: z.number().min(0).max(10),
});
