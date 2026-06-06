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
