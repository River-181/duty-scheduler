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
