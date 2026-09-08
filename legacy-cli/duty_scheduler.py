import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import csv
import os
import datetime
from collections import deque

# 직원 데이터 파일 경로
STAFF_CSV = "staff.csv"
HOLIDAY_CSV = "holidays.csv"
DUTY_CSV = "duty_schedule.csv"

# 직원 데이터 로딩 함수
def load_staff():
    if not os.path.exists(STAFF_CSV):
        return []
    with open(STAFF_CSV, newline='', encoding='utf-8') as f:
        return list(csv.reader(f))[1:]  # 헤더 제외

def save_staff(data):
    with open(STAFF_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['이름', '직급'])
        writer.writerows(data)

def load_holidays():
    if not os.path.exists(HOLIDAY_CSV):
        return []
    with open(HOLIDAY_CSV, newline='', encoding='utf-8') as f:
        return list(csv.reader(f))[1:]

def save_holidays(data):
    with open(HOLIDAY_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['날짜', '설명'])
        writer.writerows(data)

def is_holiday(date, holiday_data):
    return any(date.strftime('%Y-%m-%d') == h[0] for h in holiday_data)

def generate_duty_schedule(start_date, end_date, staff_data, holiday_data):
    current = start_date
    schedule = []
    staff_queue = deque(staff_data)
    while current <= end_date:
        if current.weekday() < 5 and not is_holiday(current, holiday_data):
            name, rank = staff_queue[0]
            schedule.append([current.strftime('%Y-%m-%d'), name, rank])
            staff_queue.rotate(-1)
        current += datetime.timedelta(days=1)
    return schedule

def save_duty_schedule(schedule):
    with open(DUTY_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['날짜', '이름', '직급'])
        writer.writerows(schedule)

class StaffTab(ttk.Frame): ...  # 생략: 기존 StaffTab 코드 유지
class HolidayTab(ttk.Frame): ...  # 생략: 기존 HolidayTab 코드 유지

class DutyGenerateTab(ttk.Frame):
    def __init__(self, master):
        super().__init__(master)

        tk.Label(self, text="시작일 (YYYY-MM-DD):").pack()
        self.start_entry = tk.Entry(self)
        self.start_entry.pack()

        tk.Label(self, text="종료일 (YYYY-MM-DD):").pack()
        self.end_entry = tk.Entry(self)
        self.end_entry.pack()

        ttk.Button(self, text="당직 생성", command=self.generate).pack(pady=10)

    def generate(self):
        try:
            start_date = datetime.datetime.strptime(self.start_entry.get().strip(), '%Y-%m-%d').date()
            end_date = datetime.datetime.strptime(self.end_entry.get().strip(), '%Y-%m-%d').date()
            if start_date > end_date:
                raise ValueError("시작일은 종료일보다 이전이어야 합니다.")
            staff = load_staff()
            holidays = load_holidays()
            if not staff:
                messagebox.showerror("오류", "직원 데이터가 없습니다.")
                return
            schedule = generate_duty_schedule(start_date, end_date, staff, holidays)
            save_duty_schedule(schedule)
            messagebox.showinfo("완료", f"총 {len(schedule)}건의 당직이 생성되었습니다.")
        except ValueError as e:
            messagebox.showerror("입력 오류", str(e))

class DutyApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("직원 당직 프로그램")
        self.geometry("500x400")

        notebook = ttk.Notebook(self)
        notebook.pack(fill='both', expand=True)

        self.staff_tab = StaffTab(notebook)
        notebook.add(self.staff_tab, text="직원 관리")

        self.holiday_tab = HolidayTab(notebook)
        notebook.add(self.holiday_tab, text="공휴일 관리")

        self.duty_tab = DutyGenerateTab(notebook)
        notebook.add(self.duty_tab, text="당직 생성")

if __name__ == '__main__':
    app = DutyApp()
    app.mainloop()