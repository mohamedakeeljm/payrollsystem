# SmartHR Lanka 🇱🇰
### Advanced Enterprise HR & Payroll Management System for Sri Lankan Organizations

SmartHR Lanka is a production-grade, full-stack human resource and payroll management platform engineered specifically for Sri Lankan businesses, enterprises, institutions, and growing companies.

The system features complete end-to-end statutory compliance with official Sri Lankan labor regulations, including **Employees' Provident Fund (EPF 8% / 12%)**, **Employees' Trust Fund (ETF 3%)**, **Inland Revenue Department Advance Personal Income Tax (APIT / PAYE)** progressive tax slabs, daily attendance tracking, multi-tier leave approval ledgers, and atomic payroll snapshotting with PDF payslips.

---

## 🏛️ Key Capabilities & Features

### 1. Sri Lankan Statutory Payroll Engine
- **Decimal-Safe Monetary Arithmetic**: Prevents floating-point errors across all additions, subtractions, and percentages.
- **EPF (Employees' Provident Fund)**: Automatically calculates **8% employee deduction** and **12% employer contribution** on EPF-eligible earnings (Basic + Fixed Allowances / Budgetary Relief).
- **ETF (Employees' Trust Fund)**: Automatically calculates **3% employer contribution**.
- **APIT (Advance Personal Income Tax / PAYE)**: Configurable tax-free monthly exemption relief (LKR 100,000 / month) and progressive Inland Revenue tax brackets (6%, 12%, 18%, 24%, 30%, 36%).
- **Overtime Engine**: Configurable 1.5x normal hourly rate and 2.0x holiday/Sunday rate based on standard monthly work hours (200 hours).
- **No-Pay Deductions**: Exact formula `(Basic Salary / 26) * no_pay_days` seamlessly tied into the leave management system.
- **Atomic Payroll Finalization**: Database transaction lock preventing duplicate processing and preserving immutable snapshots.

### 2. Comprehensive Employee Management
- Complete profile tracking: personal, contact, emergency details, NIC / Passport, EPF number, TIN number.
- Bank disbursement information (Commercial Bank, Sampath, HNB, BOC, etc.) with masked security.
- Automatic unique employee ID generation (`EMP-0001`).
- Soft archival / deactivation to guarantee past payroll and financial records remain permanently linked and accessible.

### 3. Real-Time Attendance & Shift Management
- Daily clock-in & clock-out with grace period tracking and late arrival detection.
- Department shifts (e.g., General Morning Shift 08:30 - 17:30).
- Missing clock-out detection and total work hour calculations in **Asia/Colombo** timezone.
- Auditable manual attendance adjustment workflow with reason tracking and manager review.
- Overtime request and multi-tier approval workflow.

### 4. Configurable Leave Management & Auditable Ledger
- Standard Sri Lankan entitlements: Annual Leave (14d), Casual Leave (7d), Medical/Sick Leave (14d), Maternity (84d), and No-Pay Leave.
- Real-time balance deduction with balance restoration upon request rejection or cancellation.
- Overlap prevention and leave ledger recording every transaction.

### 5. Salary Advances & Employee Loans
- Salary advance and distress loan requests.
- Automatic installment repayment deduction through monthly payroll runs.
- Real-time outstanding balance tracking and transaction history.

### 6. Professional PDF Payslip Generation
- System-generated PDF payslips with organization branding, Sri Lankan Rupee (`LKR`) formatting, itemized earnings and deductions.
- Clear separation of employer-side contributions (EPF 12% + ETF 3%) so employee net pay is never incorrectly debited.
- Role-isolated security: employees can access only their own payslips; payroll managers can access organization-wide payslips.

### 7. Immutable Audit Logs & Role-Based Access Control (RBAC)
- Append-only audit logs capturing actor, role, module, action, timestamp, and sanitized before-and-after state snapshots.
- Redaction of sensitive fields (passwords, bank account digits, tokens) from application logs.

---

## 🏗️ Architecture & Technology Stack

```mermaid
flowchart TD
    Client["React + Vite + TypeScript (Client)\nTailwind CSS, Lucide Icons, Recharts"]
    API["Node.js / Express REST API (v1)\nTypeScript, Zod, Helmet, JWT, Rate Limiter"]
    Engine["Sri Lankan Payroll Calculation Engine\nEPF 8%/12%, ETF 3%, APIT Progressive Tax"]
    Prisma["Prisma ORM (Type-Safe Data Layer)"]
    DB[(Relational Database\nMySQL / SQLite Dev)]

    Client -->|REST API Requests & JWT| API
    API -->|Validation & Security| Engine
    Engine -->|Transactions & Queries| Prisma
    API -->|Audit Logs & Data| Prisma
    Prisma -->|Strict Constraints & Foreign Keys| DB
```

### Stack Components
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts
- **Backend**: Node.js, Express.js, TypeScript, Zod, JWT, bcryptjs, PDFKit, express-rate-limit, Helmet
- **Database**: MySQL 8.0 (with complete Prisma schema, migrations, and Docker Compose) & zero-friction SQLite dev mode
- **Testing**: Vitest & Supertest (Unit and API integration tests)

---

## 🗄️ Database Entity Relationship (ER) Diagram

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ BRANCHES : owns
    ORGANIZATIONS ||--o{ DEPARTMENTS : contains
    ORGANIZATIONS ||--o{ EMPLOYEES : employs
    ORGANIZATIONS ||--o{ USERS : authenticates
    ORGANIZATIONS ||--o{ PAYROLL_RUNS : executes
    ORGANIZATIONS ||--o{ STATUTORY_RULE_SETS : defines

    EMPLOYEES ||--o{ ATTENDANCE_RECORDS : logs
    EMPLOYEES ||--o{ LEAVE_REQUESTS : submits
    EMPLOYEES ||--o{ LEAVE_BALANCES : holds
    EMPLOYEES ||--o{ EMPLOYEE_SALARY_ASSIGNMENTS : receives
    EMPLOYEES ||--o{ EMPLOYEE_LOANS : borrows
    EMPLOYEES ||--o{ PAYSLIPS : receives

    PAYROLL_RUNS ||--|{ PAYROLL_RUN_EMPLOYEES : calculates
    PAYROLL_RUN_EMPLOYEES ||--o{ PAYROLL_EARNINGS : itemizes
    PAYROLL_RUN_EMPLOYEES ||--o{ PAYROLL_DEDUCTIONS : itemizes
    PAYROLL_RUN_EMPLOYEES ||--o{ PAYSLIPS : generates

    USERS ||--o{ USER_ROLES : assigned
    ROLES ||--o{ USER_ROLES : has
```

---

## 👥 User Roles & Permission Matrix

| Module / Action | Super Admin | HR Manager | Payroll Manager | Dept Manager | Employee |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **System Settings & Branches** | ✅ Full | 👁️ View | 👁️ View | ❌ | ❌ |
| **Employee Directory** | ✅ Full | ✅ Full | 👁️ View | 👁️ Dept only | 👁️ Self only |
| **Attendance & Shifts** | ✅ Full | ✅ Full | 👁️ View | ✅ Dept approvals | ✅ Clock In/Out |
| **Leave Approvals** | ✅ Full | ✅ Full | 👁️ View | ✅ Dept approvals | ✅ Apply (Self) |
| **Salary Configurations** | ✅ Full | ❌ | ✅ Full | ❌ | 👁️ Self only |
| **Process Monthly Payroll** | ✅ Full | ❌ | ✅ Full | ❌ | ❌ |
| **Finalize & Lock Payroll** | ✅ Full | ❌ | ✅ Full | ❌ | ❌ |
| **Download Payslips** | ✅ Full | ✅ Full | ✅ Full | 👁️ Self only | 👁️ Self only |
| **Salary Advances & Loans** | ✅ Full | ❌ | ✅ Full | ❌ | ✅ Request |
| **Audit Logs** | ✅ Full | ❌ | ❌ | ❌ | ❌ |

---

## 🔑 Demo Accounts (Quick Login)

All demo accounts are pre-seeded and accessible with the standard password: `Admin@123`

| Role | Email Address | Access Scope |
| :--- | :--- | :--- |
| **Super Admin** | `admin@smarthr.lk` | Complete organization configuration, audit logs, settings |
| **HR Manager** | `hrmanager@smarthr.lk` | Employee records, leave approvals, attendance adjustments |
| **Payroll Manager** | `payroll@smarthr.lk` | Salary assignment, monthly payroll engine, lock & finalize |
| **Dept Manager** | `manager.eng@smarthr.lk` | Engineering team attendance reviews and leave approvals |
| **Employee** | `kasun@smarthr.lk` | Self-service portal: Clock In/Out, apply leave, download payslip |

*(The login screen also features one-click demo pill buttons to instantly populate credentials and test all 5 roles seamlessly!)*

---

## 🚀 Installation & Local Development Setup

### Prerequisites
- Node.js (v18 or higher; tested on v24)
- npm (v9 or higher)

### Option 1: Quick Zero-Configuration Local Start
Run the full-stack system immediately using the pre-seeded SQLite database:

1. **Clone repository & Install dependencies**:
   ```bash
   git clone <repo-url>
   cd "HR Pay"
   npm run install:all
   ```

2. **Generate Database & Seed Data**:
   ```bash
   cd server
   npx prisma generate
   npx prisma db push
   npx tsx prisma/seed.ts
   cd ..
   ```

3. **Start Frontend & Backend Concurrently**:
   ```bash
   npm run dev
   ```
   - **Frontend UI**: http://localhost:5173
   - **Backend API**: http://localhost:5000
   - **API Healthcheck**: http://localhost:5000/api/v1/health

---

### Option 2: Production Docker & MySQL 8 Setup

The system includes production Dockerfiles and a complete `docker-compose.yml` orchestrating MySQL 8, the Node.js backend, and the Nginx-served React frontend.

1. **Switch Prisma datasource to MySQL**:
   ```bash
   # Copy MySQL schema to active schema
   cp server/prisma/schema.mysql.prisma server/prisma/schema.prisma
   ```

2. **Configure Environment Variables**:
   In `server/.env`:
   ```env
   DATABASE_URL="mysql://smarthr_user:smarthr_secure_pass@localhost:3306/smarthr_lanka"
   JWT_SECRET="your_production_secret_key"
   JWT_REFRESH_SECRET="your_production_refresh_secret"
   CLIENT_URL="http://localhost"
   DEFAULT_TIMEZONE="Asia/Colombo"
   DEFAULT_CURRENCY="LKR"
   ```

3. **Launch Docker Compose Stack**:
   ```bash
   docker-compose up --build -d
   ```

4. **Run Migrations & Seed Inside the Container**:
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   docker-compose exec backend npx tsx prisma/seed.ts
   ```

---

## 🧪 Automated Testing

The system includes automated unit and integration tests covering Sri Lankan statutory formulas, marginal APIT brackets, rounding, and REST API access controls.

```bash
cd server
npm test
```

### Test Suite Summary:
```
✓ tests/payroll.test.ts (5 unit tests)
  ✓ correctly rounds values to cents
  ✓ calculates APIT as 0 for income within tax-free relief allowance (<= 100,000 LKR)
  ✓ calculates APIT accurately on first bracket (6%) above exemption threshold
  ✓ calculates standard Sri Lankan EPF and ETF for an employee with basic salary
  ✓ handles No-Pay days deductions correctly

✓ tests/api.test.ts (12 integration tests)
  ✓ GET /api/v1/health returns 200 and healthy status
  ✓ POST /api/v1/auth/login succeeds for Super Admin with valid credentials
  ✓ POST /api/v1/auth/login succeeds for Employee (Kasun Perera)
  ✓ POST /api/v1/auth/login rejects invalid credentials with 401
  ✓ GET /api/v1/auth/me returns current user profile when authenticated
  ✓ GET /api/v1/employees requires authentication
  ✓ GET /api/v1/employees returns employee directory for Super Admin
  ✓ GET /api/v1/organization/departments returns departments
  ✓ GET /api/v1/leave/types returns statutory Sri Lankan leave types
  ✓ GET /api/v1/payroll/periods returns payroll periods
  ✓ GET /api/v1/payroll/preview/:periodId calculates live gross, EPF, APIT, and net pay
  ✓ GET /api/v1/payslips returns finalized payslips

Test Files:  2 passed (2)
Tests:       17 passed (17)
```

---

## 💾 Database Backup & Disaster Recovery

### Creating a MySQL Backup
```bash
docker exec -t smarthr_mysql mysqldump -u smarthr_user -psmarthr_secure_pass smarthr_lanka > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restoring from a Backup
```bash
docker exec -i smarthr_mysql mysql -u smarthr_user -psmarthr_secure_pass smarthr_lanka < backup_file.sql
```

---

## 🔒 Security Best Practices Implemented
1. **Password Hashing**: Strong bcrypt salt rounds for all user credentials.
2. **Access & Refresh Token Rotation**: Short-lived access tokens (1h) and rotatable refresh tokens (7d).
3. **Data Redaction in Audit Trail**: Automatic removal of passwords, bank account numbers, and tokens from all audit state snapshots.
4. **Least-Privilege RBAC**: Verified at API controller and service layers, preventing client-side bypass.
5. **Rate Limiting & Security Headers**: Helmet HTTP headers and IP-scoped rate-limiting on authentication endpoints.
6. **Immutable Financial Snapshots**: Finalized payroll calculations are permanently frozen in relational tables and JSON snapshots so retroactive salary changes never alter historical records.

---

## 📄 License & Compliance Notice
This project is built for **SmartHR Lanka**. Statutory calculation rules conform to the standard guidelines of the Sri Lankan Department of Labour and Inland Revenue Department.
