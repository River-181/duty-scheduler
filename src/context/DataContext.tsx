"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Staff, Holiday, Vacation, DutyEntry } from "@/lib/types";
import * as storage from "@/lib/storage";

// 단일 하이드레이션 시임(seam).
// SSR/첫 클라이언트 렌더는 항상 빈 상태 + hydrated=false 로 동일 → 불일치 없음.
// 마운트 후 useEffect 에서 localStorage 를 1회 읽어 상태를 채운다.
// 모든 변이는 상태 갱신 + storage.save write-through.

export interface DataContextValue {
  hydrated: boolean;
  staff: Staff[];
  holidays: Holiday[];
  vacations: Vacation[];
  duty: DutyEntry[];
  setStaff: (items: Staff[]) => void;
  setHolidays: (items: Holiday[]) => void;
  setVacations: (items: Vacation[]) => void;
  setDuty: (items: DutyEntry[]) => void;
}

export const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [staff, setStaffState] = useState<Staff[]>([]);
  const [holidays, setHolidaysState] = useState<Holiday[]>([]);
  const [vacations, setVacationsState] = useState<Vacation[]>([]);
  const [duty, setDutyState] = useState<DutyEntry[]>([]);

  useEffect(() => {
    // localStorage 는 SSR 에 없으므로 마운트 후 1회만 읽어 상태를 채운다.
    // 이는 의도된 하이드레이션 패턴이라 set-state-in-effect 규칙을 끈다.
    /* eslint-disable react-hooks/set-state-in-effect */
    setStaffState(storage.load<Staff>("staff"));
    setHolidaysState(storage.load<Holiday>("holidays"));
    setVacationsState(storage.load<Vacation>("vacations"));
    setDutyState(storage.load<DutyEntry>("duty"));
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // write-through 설정자 — 상태 갱신과 localStorage 저장을 한 번에.
  const setStaff = useCallback((items: Staff[]) => {
    setStaffState(items);
    storage.save<Staff>("staff", items);
  }, []);
  const setHolidays = useCallback((items: Holiday[]) => {
    setHolidaysState(items);
    storage.save<Holiday>("holidays", items);
  }, []);
  const setVacations = useCallback((items: Vacation[]) => {
    setVacationsState(items);
    storage.save<Vacation>("vacations", items);
  }, []);
  const setDuty = useCallback((items: DutyEntry[]) => {
    setDutyState(items);
    storage.save<DutyEntry>("duty", items);
  }, []);

  return (
    <DataContext.Provider
      value={{
        hydrated,
        staff,
        holidays,
        vacations,
        duty,
        setStaff,
        setHolidays,
        setVacations,
        setDuty,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
