import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import csv
import os
import datetime
from collections import deque

# 파일 경로
STAFF_CSV = "staff.csv"
HOLIDAY_CSV = "holidays.csv"
DUTY_CSV = "duty_schedule.csv"
VACATION_CSV = "vacations.csv"

# 데이터 로딩 및 저장 함수들
def load_csv(file_path):
    if not os.path.exists(file_path):
        return []
    with open(file_path, newline='', encoding='utf-8') as f:
        return list(csv.reader(f))[1:]

def save_csv(file_path, header, data):
    with open(file_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(data)

def is_holiday(date, holidays):
    return any(date.strftime('%Y-%m-%d') == h[0] for h in holidays)

def is_on_vacation(date, name, vacations):
    for v_name, start, end in vacations:
        if v_name == name:
            start_date = datetime.datetime.strptime(start, '%Y-%m-%d').date()
            end_date = datetime.datetime.strptime(end, '%Y-%m-%d').date()
            if start_date <= date <= end_date:
                return True
    return False

def generate_schedule(start_date, end_date, staff, holidays, vacations):
    schedule = []
    queue = deque(staff)
    current = start_date
    while current <= end_date:
        if current.weekday() < 5 and not is_holiday(current, holidays):
            for _ in range(len(queue)):
                name, rank = queue[0]
                if not is_on_vacation(current, name, vacations):
                    schedule.append([current.strftime('%Y-%m-%d'), name, rank])
                    queue.rotate(-1)
                    break
                else:
                    queue.rotate(-1)
        current += datetime.timedelta(days=1)
    return schedule

# GUI 탭 클래스들 (StaffTab, HolidayTab, VacationTab, DutyGenerateTab, DutyViewTab) 생략
# 원래 존재하는 코드에서 그대로 포함되도록 가정

class StaffTab(ttk.Frame):
    def __init__(self, master):
        super().__init__(master)
        self.data = load_csv(STAFF_CSV)
        self.tree = ttk.Treeview(self, columns=('name', 'rank'), show='headings')
        self.tree.heading('name', text='이름')
        self.tree.heading('rank', text='직급')
        self.tree.pack(fill='both', expand=True)

        frame = ttk.Frame(self)
        frame.pack(pady=5)
        ttk.Button(frame, text="추가", command=self.add).pack(side='left')
        ttk.Button(frame, text="삭제", command=self.delete).pack(side='left')
        self.refresh()

    def refresh(self):
        self.tree.delete(*self.tree.get_children())
        for row in self.data:
            self.tree.insert('', 'end', values=row)

    def add(self):
        popup = tk.Toplevel(self)
        tk.Label(popup, text="이름").grid(row=0, column=0)
        tk.Label(popup, text="직급").grid(row=1, column=0)
        e1, e2 = tk.Entry(popup), tk.Entry(popup)
        e1.grid(row=0, column=1)
        e2.grid(row=1, column=1)
        def save():
            if e1.get() and e2.get():
                self.data.append([e1.get(), e2.get()])
                save_csv(STAFF_CSV, ['이름', '직급'], self.data)
                self.refresh()
                popup.destroy()
        ttk.Button(popup, text="저장", command=save).grid(row=2, column=0, columnspan=2)

    def delete(self):
        selected = self.tree.selection()
        for item in selected:
            values = self.tree.item(item, 'values')
            self.data = [row for row in self.data if row != list(values)]
        save_csv(STAFF_CSV, ['이름', '직급'], self.data)
        self.refresh()

class HolidayTab(ttk.Frame):
    def __init__(self, master):
        super().__init__(master)
        self.data = load_csv(HOLIDAY_CSV)
        self.tree = ttk.Treeview(self, columns=('date', 'desc'), show='headings')
        self.tree.heading('date', text='날짜')
        self.tree.heading('desc', text='설명')
        self.tree.pack(fill='both', expand=True)

        frame = ttk.Frame(self)
        frame.pack(pady=5)
        ttk.Button(frame, text="추가", command=self.add).pack(side='left')
        ttk.Button(frame, text="삭제", command=self.delete).pack(side='left')
        self.refresh()

    def refresh(self):
        self.tree.delete(*self.tree.get_children())
        for row in self.data:
            self.tree.insert('', 'end', values=row)

    def add(self):
        popup = tk.Toplevel(self)
        tk.Label(popup, text="날짜 (YYYY-MM-DD)").grid(row=0, column=0)
        tk.Label(popup, text="설명").grid(row=1, column=0)
        e1, e2 = tk.Entry(popup), tk.Entry(popup)
        e1.grid(row=0, column=1)
        e2.grid(row=1, column=1)
        def save():
            try:
                datetime.datetime.strptime(e1.get(), '%Y-%m-%d')
                if e2.get():
                    self.data.append([e1.get(), e2.get()])
                    save_csv(HOLIDAY_CSV, ['날짜', '설명'], self.data)
                    self.refresh()
                    popup.destroy()
            except ValueError:
                messagebox.showerror("오류", "날짜 형식 오류")
        ttk.Button(popup, text="저장", command=save).grid(row=2, column=0, columnspan=2)

    def delete(self):
        selected = self.tree.selection()
        for item in selected:
            values = self.tree.item(item, 'values')
            self.data = [row for row in self.data if row != list(values)]
        save_csv(HOLIDAY_CSV, ['날짜', '설명'], self.data)
        self.refresh()

class VacationTab(ttk.Frame):
    def __init__(self, master):
        super().__init__(master)
        self.data = load_csv(VACATION_CSV)
        self.tree = ttk.Treeview(self, columns=('name', 'start', 'end'), show='headings')
        self.tree.heading('name', text='이름')
        self.tree.heading('start', text='시작일')
        self.tree.heading('end', text='종료일')
        self.tree.pack(fill='both', expand=True)

        frame = ttk.Frame(self)
        frame.pack(pady=5)
        ttk.Button(frame, text="추가", command=self.add).pack(side='left')
        ttk.Button(frame, text="삭제", command=self.delete).pack(side='left')
        self.refresh()

    def refresh(self):
        self.tree.delete(*self.tree.get_children())
        for row in self.data:
            self.tree.insert('', 'end', values=row)

    def add(self):
        popup = tk.Toplevel(self)
        tk.Label(popup, text="이름").grid(row=0, column=0)
        tk.Label(popup, text="시작일 (YYYY-MM-DD)").grid(row=1, column=0)
        tk.Label(popup, text="종료일 (YYYY-MM-DD)").grid(row=2, column=0)
        e1, e2, e3 = tk.Entry(popup), tk.Entry(popup), tk.Entry(popup)
        e1.grid(row=0, column=1)
        e2.grid(row=1, column=1)
        e3.grid(row=2, column=1)
        def save():
            try:
                datetime.datetime.strptime(e2.get(), '%Y-%m-%d')
                datetime.datetime.strptime(e3.get(), '%Y-%m-%d')
                if e1.get():
                    self.data.append([e1.get(), e2.get(), e3.get()])
                    save_csv(VACATION_CSV, ['이름', '시작일', '종료일'], self.data)
                    self.refresh()
                    popup.destroy()
            except ValueError:
                messagebox.showerror("오류", "날짜 형식 오류")
        ttk.Button(popup, text="저장", command=save).grid(row=3, column=0, columnspan=2)

    def delete(self):
        selected = self.tree.selection()
        for item in selected:
            values = self.tree.item(item, 'values')
            self.data = [row for row in self.data if row != list(values)]
        save_csv(VACATION_CSV, ['이름', '시작일', '종료일'], self.data)
        self.refresh()

class DutyGenerateTab(ttk.Frame):
    def __init__(self, master):
        super().__init__(master)
        tk.Label(self, text="시작일 (YYYY-MM-DD)").pack()
        self.e1 = tk.Entry(self)
        self.e1.pack()
        tk.Label(self, text="종료일 (YYYY-MM-DD)").pack()
        self.e2 = tk.Entry(self)
        self.e2.pack()
        ttk.Button(self, text="당직 생성", command=self.generate).pack(pady=10)

    def generate(self):
        try:
            start = datetime.datetime.strptime(self.e1.get(), '%Y-%m-%d').date()
            end = datetime.datetime.strptime(self.e2.get(), '%Y-%m-%d').date()
            if start > end:
                raise ValueError("시작일은 종료일보다 빨라야 합니다")
            staff = load_csv(STAFF_CSV)
            holidays = load_csv(HOLIDAY_CSV)
            vacations = load_csv(VACATION_CSV)
            schedule = generate_schedule(start, end, staff, holidays, vacations)
            save_csv(DUTY_CSV, ['날짜', '이름', '직급'], schedule)
            messagebox.showinfo("완료", f"{len(schedule)}건의 당직이 생성되었습니다.")
        except ValueError as e:
            messagebox.showerror("오류", str(e))

class DutyViewTab(ttk.Frame):
    def __init__(self, master):
        super().__init__(master)
        self.tree = ttk.Treeview(self, columns=('date', 'name', 'rank'), show='headings')
        self.tree.heading('date', text='날짜')
        self.tree.heading('name', text='이름')
        self.tree.heading('rank', text='직급')
        self.tree.pack(fill='both', expand=True)

        frame = ttk.Frame(self)
        frame.pack(pady=5)
        ttk.Button(frame, text="불러오기", command=self.load).pack(side='left')
        ttk.Button(frame, text="CSV 저장", command=self.save).pack(side='left')

    def load(self):
        data = load_csv(DUTY_CSV)
        self.tree.delete(*self.tree.get_children())
        for row in data:
            self.tree.insert('', 'end', values=row)

    def save(self):
        if not os.path.exists(DUTY_CSV):
            messagebox.showinfo("안내", "저장할 데이터가 없습니다.")
            return
        path = filedialog.asksaveasfilename(defaultextension=".csv")
        if path:
            with open(DUTY_CSV, 'r', encoding='utf-8') as src, open(path, 'w', encoding='utf-8') as dst:
                dst.write(src.read())
            messagebox.showinfo("완료", "CSV로 저장되었습니다.")

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

        self.view_tab = DutyViewTab(notebook)
        notebook.add(self.view_tab, text="당직 보기")

if __name__ == '__main__':
    app = DutyApp()
    app.mainloop()
