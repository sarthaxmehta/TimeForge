# ⚡ TimeForge — Professional Timetable Management System

A production-ready, full-featured school and college timetable management platform built with React + Vite.

![TimeForge](https://img.shields.io/badge/TimeForge-v2.0-6366f1?style=for-the-badge&logo=react)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![Build](https://img.shields.io/badge/build-passing-success?style=for-the-badge)

---

## ✨ Features

### 🏫 Institution Management
- Configure institution name, type (school/college), academic year, and semester
- Working days configuration (any combination Mon–Sun)
- Period timing (start time, duration, count per day)
- Configurable break periods with custom labels

### 👩‍🏫 Teacher Management
- Add teachers with employee ID, department, specialization, qualification
- Color-coded teacher tags for visual identification
- Max workload limit (periods per week)
- Teacher-view timetable — see each teacher's full schedule

### 🏛️ Class & Subject Management
- **Grid & List views** for all classes with stream grouping
- **Batch section creation** — add Class 10 with sections A, B, C in one step
- Assign room number, student strength, class teacher, and stream per class
- Subject cards with **inline teacher & period editing** — no page navigation needed
- **Subject color coding** for visual identification
- Elective subject flag
- **Copy subjects** from one class to another (bulk duplicate)
- Subject code support (e.g., MATH101)

### 📅 Timetable Generation
- Auto-generates **conflict-free** timetables
- Respects teacher max periods / week
- Avoids scheduling the same subject twice in a day
- Break periods are automatically skipped
- Class view **and** Teacher view of generated timetables
- Color-coded timetable cells by subject
- Period time labels (e.g., 9:00 – 9:45)
- Subject legend below each timetable

### 📄 PDF Export
- Export individual class timetable as PDF
- Export **all class timetables** as a multi-page PDF
- Institution header (name, class, academic year, date)
- Print button for browser printing

### 📊 Reports & Analytics
- Teacher workload progress bars with overload detection
- Class period coverage chart
- Subject distribution across classes
- **Conflict alerts** — missing teachers, overloaded staff, empty classes
- Post-generation schedule quality check (unscheduled subjects)

### 💾 Data Management
- All data persisted in **localStorage** (no backend needed)
- Export all data as JSON backup
- Import data from JSON file or paste
- Clear all data with confirmation

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/sarthaxmehta/TimeForge.git
cd TimeForge

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Visit `http://localhost:5173` after starting the dev server.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 8 |
| State Management | Zustand (with persistence) |
| PDF Export | jsPDF + html2canvas |
| Icons | Lucide React |
| Storage | localStorage (no backend) |
| Styling | Vanilla CSS (custom design system) |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Modal.jsx          # Reusable modal dialog
│   ├── ColorPicker.jsx    # Color swatch picker
│   └── Toast.jsx          # Global toast notifications
├── pages/
│   ├── Dashboard.jsx      # Overview & quick-start
│   ├── TeachersPage.jsx   # Teacher management
│   ├── ClassesPage.jsx    # Classes & subject assignment
│   ├── TimetableView.jsx  # Generated timetables + PDF
│   ├── ReportsPage.jsx    # Analytics & conflict detection
│   └── SettingsPage.jsx   # Institution & schedule settings
├── store/
│   └── useStore.js        # Zustand state management
├── utils/
│   ├── generator.js       # Timetable generation algorithm
│   └── pdfExport.js       # PDF export utilities
├── App.jsx                # Root layout + sidebar navigation
├── index.css              # Design system (light theme)
└── main.jsx               # Entry point
```

---

## 🗺️ Usage Guide

1. **Settings** → Enter institution name, configure working days, periods, and break slots
2. **Teachers** → Add teaching staff with their workload limits
3. **Classes & Subjects** → Create classes (with batch section support), assign subjects with teachers
4. **Reports** → Review workload and fix any conflicts before generating
5. **Timetables** → Generate, view (class/teacher mode), and export as PDF

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

## 📜 License

MIT © 2025 TimeForge
