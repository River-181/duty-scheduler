import type { DutyRule } from "./types";

export const ALL_WEEKDAYS = [1, 2, 3, 4, 5]; // 월~금
export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// 새 규칙의 기본값(편집기 초기 상태). id 는 호출부에서 채운다.
export function emptyRule(): Omit<DutyRule, "id"> {
  return {
    name: "",
    weekdays: [...ALL_WEEKDAYS],
    holidayMode: "exclude",
    peoplePerDay: 1,
    allowedRanks: [],
    requiredRanks: [],
    strategy: "fair",
    minRestDays: 0,
    maxPerPerson: null,
    weekendWeight: 1,
  };
}

// 고유 id 생성(브라우저/Node 모두 crypto.randomUUID 사용 가능).
export function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `r-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

export function createRule(partial: Omit<DutyRule, "id">): DutyRule {
  return { id: newId(), ...partial };
}

// 내장 예시 템플릿 — 기관별 규칙 예시. id 는 고정(중복 추가 방지에 사용 가능).
export const TEMPLATES: DutyRule[] = [
  {
    id: "tpl-weekday-1",
    name: "기본 · 평일 1인 공평",
    weekdays: [1, 2, 3, 4, 5],
    holidayMode: "exclude",
    peoplePerDay: 1,
    allowedRanks: [],
    requiredRanks: [],
    strategy: "fair",
    minRestDays: 0,
    maxPerPerson: null,
    weekendWeight: 1,
  },
  {
    id: "tpl-weekend-2",
    name: "주말·공휴일 2인 (시니어 가중)",
    weekdays: [0, 6], // 토·일
    holidayMode: "include", // 공휴일도 포함
    peoplePerDay: 2,
    allowedRanks: [],
    requiredRanks: [],
    strategy: "fair",
    minRestDays: 3, // 연속 주말 방지
    maxPerPerson: null,
    weekendWeight: 1.5, // 주말 부담 가중
  },
  {
    id: "tpl-mwf-rotation",
    name: "월·수·금 순환",
    weekdays: [1, 3, 5],
    holidayMode: "exclude",
    peoplePerDay: 1,
    allowedRanks: [],
    requiredRanks: [],
    strategy: "rotation",
    minRestDays: 0,
    maxPerPerson: null,
    weekendWeight: 1,
  },
];

// 첫 사용 시 시드할 기본 프리셋(평일 1인 공평) — 고정 id.
export function defaultRule(): DutyRule {
  return { ...TEMPLATES[0] };
}
