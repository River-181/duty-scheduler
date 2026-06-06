import type { Staff, DutyEntry } from "./types";

export interface StaffStat {
  name: string;
  rank: string;
  count: number;
}

export interface DutyStats {
  perStaff: StaffStat[];
  total: number;
  /** 공평성 지표: 최다 - 최소 (0~1이면 잘 균형잡힘) */
  spread: number;
}

// 직원별 당직 횟수와 공평성 스프레드 계산.
// - 스케줄에 등장하지 않는 직원도 0건으로 포함한다(완전한 그림).
// - 직원 목록엔 없지만 스케줄에 남아 있는 이름(예: 삭제된 직원)도 포함해,
//   표의 합계가 항상 total(= duty.length)과 일치하도록 한다.
export function computeStats(staff: Staff[], duty: DutyEntry[]): DutyStats {
  const rankByName = new Map<string, string>(staff.map((s) => [s.name, s.rank]));
  const counts = new Map<string, number>(staff.map((s) => [s.name, 0]));
  for (const d of duty) {
    counts.set(d.name, (counts.get(d.name) ?? 0) + 1);
    if (!rankByName.has(d.name)) rankByName.set(d.name, d.rank);
  }

  const perStaff: StaffStat[] = [...counts.entries()].map(([name, count]) => ({
    name,
    rank: rankByName.get(name) ?? "",
    count,
  }));
  // 횟수 내림차순으로 보기 좋게 정렬
  perStaff.sort((a, b) => b.count - a.count);

  const values = perStaff.map((s) => s.count);
  const spread = values.length ? Math.max(...values) - Math.min(...values) : 0;

  return { perStaff, total: duty.length, spread };
}
