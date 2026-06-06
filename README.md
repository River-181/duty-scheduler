# 당직 스케줄러 (Duty Scheduler)

직원 · 공휴일 · 휴가를 관리하고 **공평한 당직표를 자동 생성**하는 웹 애플리케이션입니다.
주말과 공휴일은 자동으로 제외되고, 휴가 중인 직원은 건너뛰며, 당직 횟수가 가장 적은
직원부터 배정해 부담을 고르게 나눕니다.

> 파이썬 tkinter 데스크톱 도구를 웹으로 리모델링한 2번째 버전입니다.
> **서버가 없습니다.** 모든 데이터는 사용자의 브라우저(localStorage)에만 저장되므로,
> 회사·팀마다 별도 설치나 계정 없이 같은 URL을 열어 독립적으로 사용할 수 있습니다.

## 주요 기능

- **직원 / 공휴일 / 휴가 관리** — 추가·삭제, 표 형태 보기
- **규칙 기반 당직 생성** — 기관마다 다른 규칙을 **프리셋(룰셋)** 으로 저장하고 골라서 생성
- **3가지 보기** — 목록 / 월 캘린더 / 통계(직원별 횟수 + 공평성 지표)
- **CSV 가져오기·내보내기** — 한글 헤더, 엑셀 호환(BOM). 기존 파이썬 버전 CSV와 100% 호환
- **오프라인·프라이버시** — 데이터가 외부로 전송되지 않음(브라우저에만 저장)

### 당직 규칙(룰셋)

기관마다 당직 규칙이 다릅니다. 이 앱은 규칙을 **명명된 프리셋**으로 저장해 두고 생성 시
선택합니다. 프리셋은 JSON으로 내보내기/가져오기 할 수 있어 기관 간 공유도 가능합니다.
한 규칙에 다음 조건들을 묶을 수 있습니다:

- **근무일 정의** — 당직 대상 요일(예: 평일만 / 주말 포함 / 월·수·금) + 공휴일 처리(제외 / 포함 / 공휴일만)
- **조 구성** — 하루 당직 인원(N명), 당직 가능 직급 제한, 매일 필수 직급(예: 과장↑ 1명)
- **배정 방식** — 공평(최소 횟수 우선) / 순환(등록 순서) / 무작위(결정적 시드)
- **휴식·상한** — 같은 사람 재당직 최소 간격(연속 방지), 1인 최대 횟수, 주말·공휴일 가중치

내장 예시 템플릿: `평일 1인 공평`, `주말·공휴일 2인(시니어 가중)`, `월·수·금 순환`.
규칙을 다 채우지 못한 날은 생성 후 "부족분"으로 알려 줍니다.

## 빠른 시작

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 단위 테스트(스케줄러·날짜·CSV 왕복)
```

프로덕션 정적 빌드:

```bash
npm run build      # out/ 폴더에 정적 사이트 생성
```

## 배포

이 앱은 **정적 사이트**(`output: "export"`)라 서버 없이 어디에나 올릴 수 있습니다.

- **GitHub Pages** — 저장소 `Settings → Pages → Source` 를 *GitHub Actions* 로 설정하면
  `main` 브랜치 push 시 `.github/workflows/deploy.yml` 이 자동 배포합니다.
  프로젝트 사이트 경로(`/<repo>/`)는 빌드 시 `NEXT_PUBLIC_BASE_PATH` 로 자동 주입됩니다.
- **Vercel / Netlify / S3 등** — `out/` 폴더를 그대로 호스팅하면 됩니다.
  하위 경로가 아닌 루트 도메인에 올릴 때는 `NEXT_PUBLIC_BASE_PATH` 를 비워 둡니다.

## CSV 형식 (기존 버전 호환)

| 파일 | 헤더 |
|------|------|
| `staff.csv` | `이름,직급` |
| `holidays.csv` | `날짜,설명` (날짜: `YYYY-MM-DD`) |
| `vacations.csv` | `이름,시작일,종료일` |
| `duty_schedule.csv` | `날짜,이름,직급` |

각 관리 탭의 **가져오기/내보내기** 버튼으로 위 CSV를 주고받습니다. 모두 UTF-8이며
내보낼 때 엑셀 한글 깨짐 방지를 위해 BOM을 포함합니다.

## 기술 스택

- [Next.js](https://nextjs.org) (App Router, 정적 export) · React · TypeScript
- Tailwind CSS v4
- [Zod](https://zod.dev) (CSV 가져오기 검증) · [PapaParse](https://www.papaparse.com) (CSV 파싱)

## 동작 방식

당직 배정 알고리즘은 입력 날짜 범위의 각 근무일에 대해:

1. 주말(토·일)과 공휴일을 건너뜁니다.
2. 그날 휴가가 아닌 직원만 후보로 둡니다.
3. 현재까지 당직 횟수가 가장 적은 직원을 배정합니다(동점은 등록 순서).
4. 가용 인원이 없으면 그날은 미배정으로 둡니다.

모든 날짜 비교는 `YYYY-MM-DD` 문자열 기반이라 시간대(타임존)에 영향을 받지 않습니다.

---

## English

A web app to manage staff, holidays, and vacations and **auto-generate a fair
on-call (duty) roster**. Weekends and holidays are skipped, staff on vacation are
excluded, and the person with the fewest assignments so far is picked next — so
the load stays balanced.

It is a **serverless** remodel of a Python/tkinter desktop tool. All data lives in
the browser's `localStorage`, so different companies or teams can open the same URL
and use it independently — no accounts, no backend, nothing leaves the browser.

**Features:** staff/holiday/vacation CRUD · **rule-based scheduler** with named,
shareable rule presets (duty weekdays + holiday handling, people-per-day, rank
constraints, fair/rotation/random strategy, min rest gap, per-person cap, weekend
weighting) · list / month-calendar / statistics views · CSV import-export
(Excel-compatible, fully compatible with the original Python version's files).
Each organization configures its own rules; presets export/import as JSON.

**Run:** `npm install && npm run dev` (dev) · `npm run build` (static export to `out/`).

**Deploy:** static export — host `out/` anywhere. A GitHub Pages workflow is included
(`.github/workflows/deploy.yml`); enable *Settings → Pages → Source: GitHub Actions*.

## License

[MIT](./LICENSE)
