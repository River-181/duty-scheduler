import { storageKey, type Collection } from "@/constants/keys";

// localStorage 기반 컬렉션 저장소.
// 모든 접근은 typeof window 가드 — SSR/빌드 시 호출돼도 안전하게 빈 배열을 돌려준다.
// 모듈 최상단에서 window 를 만지지 않는다.

export function load<T>(collection: Collection): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(collection));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function save<T>(collection: Collection, items: T[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(collection), JSON.stringify(items));
  } catch {
    // 저장 용량 초과 등은 조용히 무시(데이터 자체는 메모리에 유지됨)
  }
}
