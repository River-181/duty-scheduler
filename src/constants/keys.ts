// localStorage 키 네임스페이스.
// Phase 2(팀/다중 로스터)에서 "default" 부분을 팀 ID로 교체하면 데이터 분리가 된다.
const NS = "randomduty";
const WORKSPACE = "default";

export type Collection = "staff" | "holidays" | "vacations" | "duty" | "rules";

export function storageKey(collection: Collection): string {
  return `${NS}:${WORKSPACE}:${collection}`;
}
