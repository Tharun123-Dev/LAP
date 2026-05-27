<div align="center">

# 🏢 LAP System

### Leave · Attendance · Payroll

**A full-stack HRMS built for modern organizations — dynamic permissions, smart payroll, and real-time workflows.**

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_App-2563EB?style=for-the-badge)](https://your-deployment-link.com)
[![Documentation](https://img.shields.io/badge/📄_Docs-Read_Now-0D9488?style=for-the-badge)](#-documentation)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](#)
[![Built By](https://img.shields.io/badge/Built_By-Future_Invo_Solutions-1A2C5B?style=for-the-badge)](#)

-----

</div>

## 🔗 Deployment

|Environment |URL                                       |Status |
|------------|------------------------------------------|-------|
|🟢 Production|  https://lap-phi.vercel.app/login       |Live   |

## 📌 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Modules](#-modules)
- [Permission System](#-permission-system)
- [Attendance](#-attendance-module)
- [Leave](#-leave-module)
- [Payroll](#-payroll-module)
- [Notifications](#-notifications)
- [Reports](#-reports)
- [System Settings](#-system-settings)
- [Key Rules](#-key-rules)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)

-----

## 🧭 Overview

**LAP System** is an integrated Human Resource Management System (HRMS) built to manage the complete employee lifecycle — from onboarding and daily attendance tracking to leave management, payroll processing, and analytical reporting.

The system is built around a **dynamic, permission-based access control architecture** — every employee’s dashboard, sidebar, and available actions are built entirely from their assigned permissions. No static dashboards. No hardcoded roles.

```
Employee Created → Permissions Assigned → Attendance Tracked
→ Leave Managed → Policies Applied → Payroll Run → Payslip Generated → Reports
```

-----

## ✨ Features

- 🔐 **Dynamic Permission System** — module-level access control, sidebar built from permissions
- 👥 **Employee Management** — full profiles, departments, designations, reporting hierarchy
- 📅 **Attendance Tracking** — check-in/out, late marks, half-day, OT, regularization
- 🌴 **Leave Management** — multiple leave types, configurable policies, monthly history popup
- 💰 **Payroll Engine** — PF, ESI, PT, TDS, LOP deductions, prorated calculations
- 🔔 **Smart Notifications** — permission-routed alerts for all approvals and status changes
- 📊 **Reports & Analytics** — attendance, leave, payroll, headcount reports with export
- ⚙️ **System Settings** — org-wide policies for attendance, leave, and payroll

-----

## 🛠 Tech Stack

> Update this section with your actual stack

|Layer     |Technology                                     |
|----------|-----------------------------------------------|
|Frontend  |React.js      |
|Backend   | Django   |
|Database  |MySQL / 
|Auth      |JWT / Session-based                            |
|Deployment|Vercel / Render                |

-----

## 📦 Modules

|Module         |Route                  |Description                                      |
|---------------|-----------------------|-------------------------------------------------|
|Dashboard      |`/dashboard`           |Stats overview, notifications, dynamic navigation|
|Payroll        |`/payroll`             |Payroll runs, payslips, salary config            |
|My Payslips    |`/payroll/mypayslips`  |Employee payslip viewer                          |
|My Salary      |`/payroll/mysalary`    |Salary structure view                            |
|Payroll Runs   |`/payroll/runs`        |Monthly payroll processing                       |
|Salary Config  |`/payroll/salaryconfig`|Assign & configure salary structures             |
|Reports        |`/reports`             |Attendance, leave, payroll, headcount analytics  |
|Notifications  |`/notifications`       |All system alerts and approval updates           |
|Settings       |`/settings`            |Profile & password management                    |
|System Settings|`/systemsettings`      |Org-wide policy configuration (Admin only)       |

-----

## 🔐 Permission System

The LAP System uses **dynamic, module-level permissions** instead of fixed roles. Every sidebar menu item, page, button, and API call is controlled by permissions assigned per employee.

### How It Works

```
Admin creates employee
      ↓
Assigns specific permissions
      ↓
Sidebar & pages built dynamically from permissions
      ↓
Backend validates every request against permissions
```

> Even if a user manually types a restricted URL — the backend blocks access.

### All Permissions

<details>
<summary><b>Attendance Permissions</b></summary>

|Permission            |Key                   |Description                                       |
|----------------------|----------------------|--------------------------------------------------|
|View own attendance   |`view_attendance`     |See own attendance calendar, present/absent/late  |
|View team attendance  |`view_team_attendance`|Manager views all reporting employees’ attendance |
|Edit attendance       |`edit_attendance`     |Manually modify records — high risk, salary-linked|
|Approve regularization|`approve_regularize`  |Approve employee attendance correction requests   |
|Export attendance     |`export_attendance`   |Download reports in Excel/CSV/PDF                 |

</details>

<details>
<summary><b>Department Permissions</b></summary>

|Permission       |Key                |Description                                        |
|-----------------|-------------------|---------------------------------------------------|
|View departments |`view_departments` |See department list                                |
|Create department|`create_department`|Add new departments — reflects everywhere instantly|
|Edit department  |`edit_department`  |Modify name, head, description                     |
|Delete department|`delete_department`|Remove department (restricted)                     |

</details>

<details>
<summary><b>Employee Permissions</b></summary>

|Permission         |Key              |Description                            |
|-------------------|-----------------|---------------------------------------|
|View employees     |`view_employees` |See all employee records               |
|Create employee    |`create_employee`|Add new employees with full details    |
|Edit employee      |`edit_employee`  |Modify employee details                |
|Deactivate employee|`delete_employee`|Soft-deactivate (excluded from payroll)|

</details>

<details>
<summary><b>Leave Permissions</b></summary>

|Permission          |Key              |Description                        |
|--------------------|-----------------|-----------------------------------|
|Apply leave         |`apply_leave`    |Submit leave requests              |
|View own leave      |`view_leave`     |See balance, history, status       |
|View all leave      |`view_all_leave` |HR/Admin sees all employees’ leaves|
|Approve/Reject leave|`approve_leave`  |Manage leave approvals             |
|Cancel leave        |`cancel_leave`   |Cancel submitted requests          |
|Configure leave     |`configure_leave`|Manage leave types and policies    |

</details>

<details>
<summary><b>Payroll Permissions</b></summary>

|Permission             |Key               |Description                               |
|-----------------------|------------------|------------------------------------------|
|View payslip           |`view_payslip`    |Download own payslip                      |
|View salary            |`view_salary`     |See salary structure (restricted)         |
|View payroll runs      |`view_payroll`    |See payroll history and status            |
|Configure salary       |`configure_salary`|Manage salary components                  |
|Manage salary structure|`manage_salary`   |Create salary templates                   |
|Process payroll        |`process_payroll` |Generate monthly calculations             |
|Run payroll            |`run_payroll`     |Execute payroll run                       |
|Approve & lock payroll |`approve_payroll` |Final approval — locks payroll permanently|

</details>

<details>
<summary><b>Reports, Settings & User Permissions</b></summary>

|Permission            |Key                 |Description                      |
|----------------------|--------------------|---------------------------------|
|View reports          |`view_reports`      |Access analytics dashboard       |
|Export reports        |`export_reports`    |Download reports                 |
|Manage system settings|`manage_settings`   |Change org-wide policies         |
|Manage permissions    |`manage_permissions`|Grant/revoke access for all users|
|View users            |`view_users`        |See all login accounts           |
|Create user           |`create_user`       |Add login accounts               |
|Edit user             |`edit_user`         |Modify user details              |
|Delete user           |`delete_user`       |Remove login access              |

</details>

### Typical Role Setups

|Role        |Key Permissions                                                                           |
|------------|------------------------------------------------------------------------------------------|
|**Employee**|`view_attendance`, `apply_leave`, `view_leave`, `view_payslip`                            |
|**Manager** |`view_team_attendance`, `approve_leave`, `approve_regularize`                             |
|**HR**      |`edit_attendance`, `create_employee`, `configure_leave`, `process_payroll`, `view_reports`|
|**Admin**   |All permissions including `manage_settings`, `manage_permissions`                         |

-----

## 📅 Attendance Module

### Daily Flow

```
Employee Checks In → Works During Shift → Employee Checks Out
      → System Evaluates Timing Against Policies
      → Status Recorded on Monthly Calendar
```

### Attendance States

|State           |Salary Impact                        |Calendar|
|----------------|-------------------------------------|--------|
|Present         |No deduction                         |✅ Green |
|Absent          |LOP deduction                        |❌ Red   |
|Late            |3 lates = 0.5-day deduction          |🕐 Orange|
|Half-Day        |0.5-day deduction                    |🔶 Amber |
|Missing Checkout|Half-Day or Absent if not regularized|⚠️ Yellow|
|Overtime        |OT pay added to payslip              |⏰ Blue  |
|Weekoff         |Paid, no deduction                   |🔵 Blue  |
|Holiday         |Paid, no deduction                   |🟣 Purple|
|WFH             |Present, no deduction                |🏠 Teal  |
|On Leave        |Paid if approved                     |🌴 Green |

### Attendance Policies

|Policy            |Setting           |Effect                                          |
|------------------|------------------|------------------------------------------------|
|Grace Period      |Minutes (e.g. 15) |Extra time after shift start before marking Late|
|Half-Day Threshold|Hours (e.g. 6)    |Below this → half-day mark                      |
|Auto Absent       |ON / OFF          |Day-end auto-absent if no check-in              |
|Late → LOP Rule   |3 lates           |= 0.5-day deduction in payroll                  |
|OT Multiplier     |Rate (e.g. 1.5x)  |OT Hours × Rate = OT Pay                        |
|Weekend Days      |1 or 2            |Affects calendar and payroll working days       |
|WFH               |Enabled / Disabled|Allows WFH attendance marking                   |


> **Dynamic:** Grace period change → next day check-in. Weekend days change → calendar and payroll update automatically.

### Regularization Flow

```
Employee Submits Request
      ↓
Approver Notified (approve_regularize permission)
      ↓
Approver Reviews → Approve / Reject
      ↓
Attendance Updated → Both Receive Notification
```

-----

## 🌴 Leave Module

### Leave Application Flow

```
Employee Applies Leave
      ↓
Notification → Approver (approve_leave permission)
      ↓
Approver Views Monthly History Popup
(previous approved/rejected leaves for same month shown)
      ↓
Approve / Reject
      ↓
Employee Notified → Calendar & Payroll Updated
```

### Leave Types

|Type                 |Key Feature                                      |
|---------------------|-------------------------------------------------|
|Casual Leave (CL)    |Monthly cap; unused CL expires at month-end      |
|Sick Leave (SL)      |Usually no advance notice required               |
|Earned Leave (EL)    |Advance notice mandatory; hidden during probation|
|Compensatory Leave   |Earned by working on holidays                    |
|LOP Leave            |Always unpaid — salary deduction applied         |
|Half-Day Leave       |0.5-day deduction (if enabled in settings)       |
|Maternity / Paternity|Paid/unpaid configurable in Leave Types          |

### Leave Policy Settings (per leave type)

|Setting            |Description                                          |
|-------------------|-----------------------------------------------------|
|Paid / Unpaid      |Unpaid triggers LOP deduction in payroll             |
|Advance Notice Days|System enforces minimum notice before leave date     |
|Monthly Cap        |Max leaves of this type per month                    |
|Annual Allocation  |Total leaves per year; auto-syncs to employee balance|
|Carry Forward      |Unused leaves roll over to next year if enabled      |
|Low Balance Alert  |Warning shown when balance ≤ 2 days                  |
|Half-Day Enabled   |Toggle half-day application for this leave type      |


> **Dynamic:** Any change in Leave Types (allocation, cap, paid/unpaid) is instantly reflected in all employee balances, the apply-leave form, approval popups, and payroll deductions.

### Approval Rules

|Status         |Salary Impact                    |
|---------------|---------------------------------|
|Approved (paid)|No deduction — counted as present|
|Rejected       |Absent — salary deduction        |
|LOP (unpaid)   |Deduction regardless of approval |
|Half-Day leave |0.5-day deduction                |

-----

## 💰 Payroll Module

### Payroll Status Flow

```
Draft → Processing → Processed → Approved → Paid
```

> Once **Approved**, payroll is locked and cannot be edited. Payslips are final.

### Salary Components

|Component                            |Basis                      |Locked?                         |
|-------------------------------------|---------------------------|--------------------------------|
|Basic Salary                         |Basic% of (Annual CTC ÷ 12)|✅ Locked at structure creation  |
|HRA                                  |HRA% of Basic              |✅ Locked at structure creation  |
|DA                                   |DA% of Basic               |❌ Read live from System Settings|
|Transport / Medical / Special / Other|Configured per structure   |✅ Locked                        |

### Deductions

|Deduction     |Formula                                    |Source                          |
|--------------|-------------------------------------------|--------------------------------|
|PF (Employee) |Basic × 12% × (Present ÷ Working Days)     |Live from System Settings       |
|ESI (Employee)|Gross × 0.75% × (Present ÷ Working Days)   |Live — exempt if Gross > ₹21,000|
|PT            |Slab-based (₹0 / ₹150 / ₹200)              |Live from System Settings       |
|TDS           |10% flat on effective gross (contract only)|Live from System Settings       |
|LOP           |(Gross ÷ Working Days) × LOP Days          |Attendance + Leave data         |

### Payroll Calculation

```
Net Pay = Gross Salary
        + OT Pay (OT Hours × OT Multiplier)
        − LOP Deduction
        − PF (Employee)
        − ESI (Employee)
        − PT
        − TDS (contract only)

Minimum Net Pay = ₹0
```

### Payroll Run Rules

- Payroll can only be run on or after **Day 25** of the month
- A single run processes **all active employees** for that month
- `DA%`, `PF%`, `ESI%`, `TDS%`, `PT Slabs` → read live from System Settings
- `Basic%`, `HRA%` → locked per employee; assign new structure to change
- Approved and locked payroll **cannot be edited**

### Payslip Contains

- Company name and logo
- Employee details (name, designation, department, code)
- Full gross salary breakup (Basic, HRA, DA, Allowances)
- All deductions with individual amounts
- Net salary payable
- Attendance summary (present, absent, late, half-day, weekoff, holiday, OT)
- Leave details and LOP details

-----

## 🔔 Notifications

All notifications are **automatically routed** based on permissions — no manual setup needed.

|Event                             |Who Gets Notified                        |
|----------------------------------|-----------------------------------------|
|Leave application submitted       |User with `approve_leave` permission     |
|Leave approved / rejected         |Employee who applied                     |
|Same-month repeated leave applied |Approver gets full monthly leave history |
|Regularization submitted          |User with `approve_regularize` permission|
|Regularization approved / rejected|Both approver and employee               |


> **Dynamic:** Changing an employee’s reporting manager immediately redirects all future notifications to the new manager.

-----

## 📊 Reports

|Report    |Key Metrics                                     |
|----------|------------------------------------------------|
|Attendance|Total, Present, Absent, Late, On Leave          |
|Leave     |Total Requests, Approved, Pending, Rejected     |
|Payroll   |Gross Total, Net Total, Employee Count, Status  |
|Headcount |Total Active, by Admin / Manager / HR / Employee|


> All reports are generated from live data — any attendance, leave, or payroll change reflects immediately.

-----

## ⚙️ System Settings

Managed by users with `manage_settings` permission. Changes propagate automatically.

|Setting                       |When It Takes Effect                     |
|------------------------------|-----------------------------------------|
|Grace Period                  |Next day’s check-in                      |
|Auto Absent                   |Next day’s end-of-day processing         |
|Weekend Days                  |Next calendar view + next payroll run    |
|DA%, PF%, ESI%, TDS%, PT Slabs|Next payroll run (no reassignment needed)|
|Basic%, HRA%                  |New salary structures only               |
|Leave Allocations             |Instantly synced to all employee balances|
|Company Name / Logo           |Reflected on payslips immediately        |
|WFH Toggle                    |Immediate for all employees              |
|Late → LOP Rule               |Next payroll run                         |
|Probation Period              |New employees — from joining date        |

-----

## 📋 Key Rules

### Attendance

- Present → Full salary
- Absent → LOP deduction
- 3 Late marks in a month → 0.5-day deduction
- Half-Day (below threshold) → 0.5-day deduction
- Missing Checkout (not approved) → Half-Day or Absent
- Holiday / Weekoff → Paid, no deduction
- Payroll only runs on or after **Day 25**

### Leave

- Approved paid leave → Present, no deduction
- Rejected leave → Absent, deduction applies
- LOP (unpaid) → Deduction regardless of approval
- Excess leave beyond balance → LOP
- CL monthly cap reached → no more CL that month
- EL during probation → balance hidden until probation ends

### Payroll

- ESI exempt if gross > ₹21,000/month
- PF, ESI, PT prorated by (Present ÷ Working Days)
- Net Pay minimum = ₹0
- Contract employees → TDS @ 10% flat
- Approved & locked payroll → cannot be edited

-----

## 🚀 Getting Started

### Prerequisites

```bash
node >= 18.x   # or your backend runtime
npm >= 9.x
```

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/lap-system.git
cd lap-system

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Set up your environment variables (see below)

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

Open <http://localhost:3000>

-----


## 🗂 Project Structure

```
lap-system/
├── src/
│   ├── modules/
│   │   ├── employees/       # Employee management
│   │   ├── attendance/      # Check-in/out, regularization
│   │   ├── leave/           # Leave types, apply, approve
│   │   ├── payroll/         # Salary, runs, payslips
│   │   ├── reports/         # Analytics and exports
│   │   ├── notifications/   # Alert routing
│   │   └── settings/        # System & personal settings
│   ├── permissions/         # Dynamic permission engine
│   ├── middleware/          # Auth, permission checks
│   └── utils/               # Helpers, formatters
├── public/
├── .env.example
├── package.json
└── README.md
```

-----

## 🤝 Contributing

1. Fork the repository
1. Create your feature branch — `git checkout -b feature/your-feature`
1. Commit your changes — `git commit -m 'Add: your feature description'`
1. Push to the branch — `git push origin feature/your-feature`
1. Open a Pull Request

-----

## 📄 License

This project is licensed under the MIT License.

-----

<div align="center">

Built with ❤️ by **Future Invo Solutions**

[🚀 Live Demo](https://lap-phi.vercel.app/login) · [📄 Documentation](#)·

</div>
