// 모든 사용자 노출 문자열을 한 곳에 모아 둔다(다국어 확장 대비).

export const APP = {
  title: "당직 스케줄러",
  subtitle: "직원 · 공휴일 · 휴가를 관리하고 공평한 당직표를 자동 생성합니다",
};

export const TABS = {
  staff: "직원 관리",
  holiday: "공휴일 관리",
  vacation: "휴가 관리",
  generate: "당직 생성",
  view: "당직 보기",
};

// CSV 헤더 — v1(파이썬) 파일과 1:1 호환되어야 한다.
export const CSV_HEADERS = {
  staff: ["이름", "직급"],
  holidays: ["날짜", "설명"],
  vacations: ["이름", "시작일", "종료일"],
  duty: ["날짜", "이름", "직급"],
} as const;

export const FIELD = {
  name: "이름",
  rank: "직급",
  date: "날짜",
  description: "설명",
  start: "시작일",
  end: "종료일",
};

export const ACTION = {
  add: "추가",
  delete: "삭제",
  save: "저장",
  cancel: "취소",
  import: "가져오기",
  export: "내보내기",
  generate: "당직 생성",
};

export const RULE = {
  preset: "당직 규칙",
  newRule: "새 규칙",
  edit: "편집",
  addTemplates: "예시 템플릿 추가",
  name: "규칙 이름",
  workdays: "근무 요일",
  holidayMode: "공휴일 처리",
  holidayExclude: "제외(공휴일엔 당직 없음)",
  holidayInclude: "포함(공휴일도 당직)",
  holidayOnly: "공휴일만 당직",
  peoplePerDay: "하루 당직 인원",
  allowedRanks: "당직 가능 직급",
  allowedRanksHint: "선택 안 하면 전체 직급 허용",
  requiredRanks: "필수 직급(매일 최소 1명)",
  requiredRanksHint: "예: 과장 이상 1명 필수",
  strategy: "배정 방식",
  stratFair: "공평(최소 횟수 우선)",
  stratRotation: "순환(등록 순서)",
  stratRandom: "무작위",
  minRestDays: "최소 휴식 간격(일)",
  minRestHint: "0이면 제약 없음. 1이면 연속일 금지.",
  maxPerPerson: "1인 최대 횟수",
  maxPerPersonHint: "비우면 무제한",
  weekendWeight: "주말·공휴일 가중치",
  weekendWeightHint: "공평 배정 시 주말 당직을 더 무겁게(예: 1.5)",
  noRanks: "직원 직급이 없습니다. 먼저 직원을 등록하세요.",
  shortfallSummary: (n: number) => `${n}일은 규칙을 다 채우지 못했습니다.`,
};

export const MSG = {
  datePlaceholder: "YYYY-MM-DD",
  invalidDate: "날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)",
  required: "필수 항목입니다",
  noStaff: "직원 데이터가 없습니다. 먼저 직원을 추가하세요.",
  startAfterEnd: "시작일은 종료일보다 이전이어야 합니다.",
  generated: (n: number) => `총 ${n}건의 당직이 생성되었습니다.`,
  imported: (ok: number, skipped: number) =>
    `${ok}건을 가져왔습니다${skipped ? `, ${skipped}건은 형식 오류로 건너뜀` : ""}.`,
  importFailed: "CSV를 읽지 못했습니다. 헤더와 형식을 확인하세요.",
  emptyTable: "데이터가 없습니다.",
  selectToDelete: "삭제할 항목을 선택하세요.",
  confirmDelete: (n: number) => `${n}개 항목을 삭제할까요?`,
  confirmImport: (n: number) =>
    `기존 ${n}건을 가져온 데이터로 덮어씁니다. 계속할까요?`,
};
