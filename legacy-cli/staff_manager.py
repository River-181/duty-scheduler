import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import csv
import os

# 직원 데이터 파일 경로
STAFF_CSV = "staff.csv"

# 직원 데이터 로딩 함수
def load_staff():
    if not os.path.exists(STAFF_CSV):
        return []
    with open(STAFF_CSV, newline='', encoding='utf-8') as f:
        return list(csv.reader(f))[1:]  # 헤더 제외

# 직원 데이터 저장 함수
def save_staff(data):
    with open(STAFF_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['이름', '직급'])
        writer.writerows(data)

class StaffTab(ttk.Frame):
    def __init__(self, master):
        super().__init__(master)
        self.staff_data = load_staff()

        # UI 구성
        self.tree = ttk.Treeview(self, columns=('name', 'rank'), show='headings')
        self.tree.heading('name', text='이름')
        self.tree.heading('rank', text='직급')
        self.tree.pack(fill='both', expand=True)

        btn_frame = ttk.Frame(self)
        btn_frame.pack(pady=5)
        ttk.Button(btn_frame, text="추가", command=self.add_staff).pack(side='left', padx=5)
        ttk.Button(btn_frame, text="삭제", command=self.delete_staff).pack(side='left', padx=5)

        self.refresh()

    def refresh(self):
        self.tree.delete(*self.tree.get_children())
        for name, rank in self.staff_data:
            self.tree.insert('', 'end', values=(name, rank))

    def add_staff(self):
        popup = tk.Toplevel(self)
        popup.title("직원 추가")
        tk.Label(popup, text="이름:").grid(row=0, column=0)
        tk.Label(popup, text="직급:").grid(row=1, column=0)
        name_entry = tk.Entry(popup)
        rank_entry = tk.Entry(popup)
        name_entry.grid(row=0, column=1)
        rank_entry.grid(row=1, column=1)

        def save():
            name = name_entry.get().strip()
            rank = rank_entry.get().strip()
            if name and rank:
                self.staff_data.append([name, rank])
                save_staff(self.staff_data)
                self.refresh()
                popup.destroy()
            else:
                messagebox.showwarning("입력 오류", "이름과 직급을 입력하세요")

        ttk.Button(popup, text="저장", command=save).grid(row=2, column=0, columnspan=2)

    def delete_staff(self):
        selected = self.tree.selection()
        if not selected:
            messagebox.showinfo("선택 필요", "삭제할 직원을 선택하세요")
            return
        for item in selected:
            values = self.tree.item(item, 'values')
            self.staff_data = [row for row in self.staff_data if row != list(values)]
        save_staff(self.staff_data)
        self.refresh()

class DutyApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("직원 당직 프로그램")
        self.geometry("500x400")

        notebook = ttk.Notebook(self)
        notebook.pack(fill='both', expand=True)

        self.staff_tab = StaffTab(notebook)
        notebook.add(self.staff_tab, text="직원 관리")

        # 이후 탭: 공휴일 관리, 당직 생성, 스케줄 보기 등 추가 예정

if __name__ == '__main__':
    app = DutyApp()
    app.mainloop()
