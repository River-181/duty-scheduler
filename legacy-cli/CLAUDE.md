# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Two versions

- **v1 (this directory, `*.py`)** — the original Korean-language desktop GUI described below.
- **v2 (`web/`)** — a serverless web remodel: Next.js (App Router, static export) + TypeScript +
  Tailwind, data in browser `localStorage`, CSV import/export compatible with the v1 files. It
  adds a month-calendar view, fairness-balanced scheduling, and statistics. It is self-contained
  (own git repo, README, MIT license, GitHub Pages deploy workflow). See `web/README.md`. Work
  there with `cd web && npm install && npm run dev`; verify with `npm test` and `npm run build`.

## What this is (v1)

A Korean-language desktop GUI app for generating staff on-call duty rosters (직원 당직).
Built entirely with the Python standard library — `tkinter` for the UI, `csv` for storage.
No third-party dependencies, no build step, no package manifest. All user-facing strings are in Korean.

## Run

```bash
python3 main.py
```

`main.py` is the real entry point — it is the consolidated, fully-implemented application with all five tabs. Run it from this directory; CSV files are read/written relative to the current working directory.

## File layout — important

The four module files are **incremental development snapshots**, not imported modules. Each is a standalone, independently-runnable `DutyApp` that adds one more feature than the last, and each leaves earlier tabs stubbed with `...` placeholders (e.g. `class StaffTab(ttk.Frame): ...`). They do not import each other and there is no shared package.

- `staff_manager.py` — snapshot 1: staff tab only
- `holiday_manager.py` — snapshot 2: + holiday tab
- `vacation.py` — snapshot 3: + vacation tab + vacation-aware scheduler (most complete snapshot)
- `duty_scheduler.py` — snapshot of the schedule-generation logic (no vacation handling)
- `main.py` — **the merged final version**: all five tabs with every method implemented

When changing behavior, edit `main.py`. The snapshot files are historical and contain duplicated copies of the same functions (`load_staff`, `is_holiday`, etc.); they are not the source of truth.

## Data model

Persistence is flat CSV files in the working directory, each with a Korean header row that `load_csv` skips:

| File | Columns |
|------|---------|
| `staff.csv` | 이름 (name), 직급 (rank) |
| `holidays.csv` | 날짜 (date `YYYY-MM-DD`), 설명 (description) |
| `vacations.csv` | 이름, 시작일 (start), 종료일 (end) |
| `duty_schedule.csv` | 날짜, 이름, 직급 |

All files are UTF-8. Rows are passed around as plain `list[str]`; there are no model classes.

## Scheduling algorithm (`generate_schedule` in main.py)

Round-robin assignment over a date range using `collections.deque` and `deque.rotate(-1)`:

- Skips weekends (`date.weekday() >= 5`) and any date in `holidays.csv`.
- For each working day, walks the queue until it finds a staff member not on vacation that day, assigns them, then rotates them to the back. Staff on vacation are rotated past without being assigned.
- Date strings are the canonical key format `%Y-%m-%d` throughout.

## UI conventions

- Each tab is a `ttk.Frame` subclass held in a `ttk.Notebook`, displaying rows in a `ttk.Treeview`.
- Add/delete use a `tk.Toplevel` popup; saving validates input, rewrites the entire CSV via `save_csv`, then calls `self.refresh()` to repaint the tree.
- Date fields are validated with `datetime.strptime(..., '%Y-%m-%d')` inside a try/except that surfaces errors via `messagebox`.
- Deletion matches rows by exact value equality (`row != list(values)`), so duplicate rows are deleted together.
