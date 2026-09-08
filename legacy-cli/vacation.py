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
VACATION_CSV = "vacations.csv"

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

def load_vacations():
    if not os.path.exists(VACATION_CSV):
        return []
    with open(VACATION_CSV, newline='', encoding='utf-8') as f:
        return list(csv.reader(f))[1:]

def save_vacations(data):
    with open(VACATION_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['이름', '시작일', '종료일'])
        writer.writerows(data)

def is_holiday(date, holiday_data):
    return any(date.strftime('%Y-%m-%d') == h[0] for h in holiday_data)

def is_on_vacation(date, name, vacation_data):
    for v_name, start, end in vacation_data:
        if v_name == name:
            start_date = datetime.datetime.strptime(start, '%Y-%m-%d').date()
            end_date = datetime.datetime.strptime(end, '%Y-%m-%d').date()
            if start_date <= date <= end_date:
                return True
    return False

def generate_duty_schedule(start_date, end_date, staff_data, holiday_data, vacation_data):
    current = start_date
    schedule = []
    staff_queue = deque(staff_data)
    while current <= end_date:
        if current.weekday() < 5 and not is_holiday(current, holiday_data):
            for _ in range(len(staff_queue)):
                name, rank = staff_queue[0]
                if not is_on_vacation(current, name, vacation_data):
                    schedule.append([current.strftime('%Y-%m-%d'), name, rank])
                    staff_queue.rotate(-1)
                    break
                else:
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

class VacationTab(ttk.Frame):
    def __init__(self, master):
        super().__init__(master)
        self.vacation_data = load_vacations()

        self.tree = ttk.Treeview(self, columns=('name', 'start', 'end'), show='headings')
        self.tree.heading('name', text='이름')
        self.tree.heading('start', text='시작일')
        self.tree.heading('end', text='종료일')
        self.tree.pack(fill='both', expand=True)

        btn_frame = ttk.Frame(self)
        btn_frame.pack(pady=5)
        ttk.Button(btn_frame, text="추가", command=self.add_vacation).pack(side='left', padx=5)
        ttk.Button(btn_frame, text="삭제", command=self.delete_vacation).pack(side='left', padx=5)

        self.refresh()

    def refresh(self):
        self.tree.delete(*self.tree.get_children())
        for row in self.vacation_data:
            self.tree.insert('', 'end', values=row)

    def add_vacation(self):
        popup = tk.Toplevel(self)
        popup.title("휴가 추가")
        tk.Label(popup, text="이름:").grid(row=0, column=0)
        tk.Label(popup, text="시작일 (YYYY-MM-DD):").grid(row=1, column=0)
        tk.Label(popup, text="종료일 (YYYY-MM-DD):").grid(row=2, column=0)
        name_entry = tk.Entry(popup)
        start_entry = tk.Entry(popup)
        end_entry = tk.Entry(popup)
        name_entry.grid(row=0, column=1)
        start_entry.grid(row=1, column=1)
        end_entry.grid(row=2, column=1)

        def save():
            name = name_entry.get().strip()
            start = start_entry.get().strip()
            end = end_entry.get().strip()
            try:
                datetime.datetime.strptime(start, '%Y-%m-%d')
                datetime.datetime.strptime(end, '%Y-%m-%d')
                if name:
                    self.vacation_data.append([name, start, end])
                    save_vacations(self.vacation_data)
                    self.refresh()
                    popup.destroy()
                else:
                    messagebox.showwarning("입력 오류", "이름을 입력하세요")
            except ValueError:
                messagebox.showerror("입력 오류", "날짜 형식이 올바르지 않습니다")

        ttk.Button(popup, text="저장", command=save).grid(row=3, column=0, columnspan=2)

    def delete_vacation(self):
        selected = self.tree.selection()
        if not selected:
            messagebox.showinfo("선택 필요", "삭제할 항목을 선택하세요")
            return
        for item in selected:
            values = self.tree.item(item, 'values')
            self.vacation_data = [row for row in self.vacation_data if row != list(values)]
        save_vacations(self.vacation_data)
        self.refresh()

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
            vacations = load_vacations()
            if not staff:
                messagebox.showerror("오류", "직원 데이터가 없습니다.")
                return
            schedule = generate_duty_schedule(start_date, end_date, staff, holidays, vacations)
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

        self.vacation_tab = VacationTab(notebook)
        notebook.add(self.vacation_tab, text="휴가 관리")

        self.duty_tab = DutyGenerateTab(notebook)
        notebook.add(self.duty_tab, text="당직 생성")

if __name__ == '__main__':
    app = DutyApp()
    app.mainloop()