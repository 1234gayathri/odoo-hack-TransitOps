# TransitOps Fleet Management Platform

TransitOps is a modern, enterprise-grade, and role-based fleet management platform built using **Next.js**, **React**, **TypeScript**, and **PostgreSQL**. The platform serves as a central hub for transport planning, asset utilization, dispatch tracking, driver verification, maintenance scheduling, and financial analytics.

---

## 🚀 Live Demo

**Deployed on Vercel:** [https://odoo-hack-transit-ops-khaki.vercel.app](https://odoo-hack-transit-ops-khaki.vercel.app)

> Click the link above to access the fully deployed, production version of TransitOps. All 6 role-based logins are functional with real-time data from the cloud PostgreSQL database.

---

## Technical Stack & Architecture

- **Frontend**: Next.js 14 (App Router), TailwindCSS, Framer Motion (micro-animations), Recharts (data visualizations), Lucide Icons.
- **Backend**: Next.js API Routes (`/api/*`) connected to a localized PostgreSQL instance (running on port `5435`).
- **Database Logic**: Dynamic seeding, automatic PostgreSQL check/start script (`ensurePostgresRunning`), and SQL-driven metrics aggregation.
- **Access Control**: Role-Based Access Control (RBAC) with unique interfaces and actions tailored to 6 distinct login roles.

---

## Role Modules & Dashboards

The system supports 6 custom login roles, each with designated access scopes and operations:

1. **Super Admin**
   - Unlimited unrestricted access to the entire platform.
   - Core administrative actions: User Management (edit, delete, view profile, active status toggles), Role Management, and System Settings.
   - final approval authority on maintenance records, invoices, and expenses.
   - Ability to broadcast notifications across the platform (to specific roles or system-wide).

2. **Fleet Manager**
   - Coordinates fleet asset health, registration, and utilization.
   - Access to the Vehicles module with abilities to add, edit, retire, and export vehicle logs.
   - Tracks real-time odometer readings and vehicle health indexes.

3. **Dispatcher**
   - Coordinates logistics, schedules trips, and tracks active transits.
   - Core tools: Dispatch Page (assigning drivers and vehicles to scheduled jobs) and Trips Page (Kanban, Table, and Timeline views).
   - Ability to flag completed trips for post-trip maintenance verification.

4. **Safety Officer**
   - Monitors driver verification, safety scores, experience ratings, and active trip history.
   - Core tools: Drivers Page (add, verify license expiration, check safety performance metrics).

5. **Maintenance Manager**
   - Schedules vehicle services, records workshop repairs, and monitors active breakdowns.
   - Core tools: Maintenance Page (logging estimated costs, assigned technicians, and workshop vendors).
   - Uploads completed job invoices and submits actual costs for validation.

6. **Finance Analyst**
   - Monitors operational spending, fuel efficiency metrics, and budget balance sheets.
   - Core tools: Fuel Logs (liters, efficiency, station logs), Expenses Page, and Financial Analytics Reports.

---

## Role-Based Access Control (RBAC) Matrix

Below is a detailed matrix detailing the permission scope each role has across the primary platform modules:

| Module / Feature | Super Admin | Fleet Manager | Dispatcher | Safety Officer | Maintenance Manager | Finance Analyst |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Dashboard** | Full Access | Read-Only | Read-Only | Read-Only | Read-Only | Read-Only |
| **User Management** | Full Access | No Access | No Access | No Access | No Access | No Access |
| **Vehicles** | Full Access | Full Access | Read-Only | Read-Only | Read-Only | No Access |
| **Drivers** | Full Access | Read-Only | Read-Only | Full Access | No Access | No Access |
| **Trips** | Full Access | Read-Only | Full Access | Read-Only | Read-Only | No Access |
| **Dispatch** | Full Access | Read-Only | Full Access | No Access | No Access | No Access |
| **Maintenance** | Full Access | Read-Only | Read-Only | No Access | Full Access | Read-Only |
| **Fuel Logs** | Full Access | Read-Only | No Access | No Access | No Access | Full Access |
| **Expenses** | Full Access | Read-Only | No Access | No Access | No Access | Full Access |
| **Reports** | Full Access | Export-Only | No Access | Export-Only | Export-Only | Full Access |
| **Analytics** | Full Access | Read-Only | No Access | No Access | No Access | Full Access |
| **Settings** | Full Access | Read-Only | Read-Only | Read-Only | Read-Only | Read-Only |

---

## PostgreSQL Database Schema

The database consists of the following relational tables managed dynamically on app startup:

### 1. `users`
- Tracks accounts, authorization levels (`role`), status, and activity.
- Columns: `id`, `name`, `email`, `role`, `avatar`, `status`, `last_active`.

### 2. `vehicles`
- Stores vehicle characteristics, status, and health scores.
- Columns: `id`, `registration`, `vin`, `make`, `model`, `year`, `capacity`, `fuel_type`, `status`, `odometer`, `health_score`, `last_service`, `next_service`, `location`.

### 3. `drivers`
- Tracks credentials, safety indexes, and ratings.
- Columns: `id`, `name`, `email`, `phone`, `license_number`, `license_expiry`, `safety_score`, `experience_years`, `status`, `verified`, `total_trips`, `rating`, `avatar`.

### 4. `trips`
- Schedules logistics, assigning driver name, vehicle, cargo, and destination routes.
- Columns: `id`, `origin`, `destination`, `driver_id`, `driver_name`, `vehicle_id`, `vehicle_reg`, `status`, `departure_time`, `estimated_arrival`, `distance`, `cargo_type`, `priority`.

### 5. `maintenance_records`
- Coordinates workflow actions, invoice uploads, actual costs, and approval states.
- Columns: `id`, `vehicle_id`, `vehicle_reg`, `type`, `description`, `status`, `priority`, `scheduled_date`, `completed_date`, `cost`, `technician`, `invoice_url`, `actual_cost`, `vendor`, `approval_status`, `rejection_comments`.

### 6. `expenses`
- Tracks all approved operational expenses (Fuel, Maintenance, Tolls, Insurance, etc.).
- Columns: `id`, `category`, `description`, `amount`, `date`, `vehicle_id`, `vehicle_reg`, `status`, `submitted_by`.

### 7. `notifications`
- Handles cross-role notifications and broadcast alerts.
- Columns: `id`, `from_role`, `to_role`, `title`, `message`, `type`, `created_at`, `read`.

### 8. `settings`
- Stores system preferences dynamically (workspace language, timezone, theme layout, notification flags).
- Columns: `key` (Primary Key), `value`.

---

## Workflow: Maintenance Invoice Approval

TransitOps implements a strict multi-role approval gate to ensure maintenance expenditures are verified before recording expenses.

```
 [ Dispatcher ]
       │
       ▼ Marks Trip Completed
 [ Trips Page ] ──────────────► Click "Request Maintenance" (Scheduled)
                                          │
                                          ▼
                             [ Maintenance Manager ]
                         • Enters Actual Cost & Vendor
                         • Uploads Simulated Invoice PDF
                         • Clicks "Submit for Approval"
                                          │ (approval_status = 'pending')
                                          ▼
                                   [ Super Admin ]
                         • Reviews Vehicle, Vendor, Cost, PDF
                         ┌────────────────┴────────────────┐
                         │ Approved                        │ Rejected
                         ▼                                 ▼
                 [ Finance Analyst ]             [ Maintenance Manager ]
             • Auto-creates Approved Expense       • Status returned to Scheduled
             • Dashboard Aggregates Updated        • Displays Rejection Comments
```

### 1. Dispatcher (Completed Trip)
- When a trip changes to `completed`, the Dispatcher can click **"Request Maintenance"** from the Trips Details drawer.
- This creates a `scheduled` maintenance entry for that vehicle.

### 2. Maintenance Manager (Submit Invoice)
- The Maintenance Manager picks up the scheduled job and inputs the completion details: **Vendor Name**, **Actual Cost**, and uploads the **Invoice File**.
- Clicking **"Submit for Approval"** sets the `approval_status = 'pending'`. The record remains locked in `in_progress` status.

### 3. Super Admin (Review & Action)
- A **"Pending Approvals"** tab displays all records awaiting review to the Super Admin.
- The Admin reviews the invoice and selects:
  - **Approve**: Moves approval to `approved`, completes the maintenance, frees the vehicle (`available`), and posts the cost directly to the `expenses` table.
  - **Reject**: Prompts the Admin to write feedback. Returns the record to the manager with `rejected` status and displays the rejection comments.

### 4. Finance Analyst & Dashboard Update
- Once approved, the record is logged as an approved expense, which automatically updates the **Expenses page**, the **Finance report summary**, and the dashboard spending charts.

---

## Core API Endpoints Reference

All API routes are implemented inside `app/api/*` and map directly to transactional queries against PostgreSQL:

### 1. Trips API (`/api/trips`)
- **GET**: Fetches all trip logs.
- **POST**: Creates a new trip.
  - *Payload*: `{ origin, destination, driverId, vehicleId, status, departureTime, estimatedArrival, distance, cargoType, priority }`
- **PUT**: Updates existing trip status, drivers, or route coordinates.
- **DELETE**: Removes a trip from database records.

### 2. Maintenance API (`/api/maintenance`)
- **GET**: Returns all maintenance records.
- **POST**: Schedules a job.
- **PUT**: Updates details or handles approvals.
  - *Super Admin Approval payload*: `{ id, approvalStatus: 'approved' }` (transitions job status to completed, resets vehicle to available, and logs transaction to expenses).
  - *Super Admin Rejection payload*: `{ id, approvalStatus: 'rejected', rejectionComments }` (returns job back to scheduled status).
- **DELETE**: Dismisses record from database.

### 3. Expenses API (`/api/expenses`)
- **GET**: Returns all expenses sorted by date.
- **POST**: Inserts custom cost entries.
- **PUT**: Approves or rejects custom ledger files.

### 4. Dashboard API (`/api/dashboard`)
- **GET**: Runs optimized aggregates and returns live KPIs, lists of upcoming actions, and chart dataset variables.

### 5. Settings API (`/api/settings`)
- **GET**: Returns active key-value workspace settings.
- **POST**: Inserts/Updates system configurations.

---

## Local Setup & Run Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL 16 installed locally

### Installation
1. Clone the repository and navigate to the directory:
   ```bash
   git clone https://github.com/1234gayathri/odoo-hack-TransitOps.git
   cd odoo-hack-TransitOps
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Database Initialization
The application will automatically check if PostgreSQL is running on port `5435` and attempt to start the server from `'C:\Program Files\PostgreSQL\16\bin\postgres.exe'` using the configuration folder `d:\Transistops\db_data`.
To manually initialize the tables and seed mock data:
```bash
node test-db2.js
```

### Running the App
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### Verification & Linting
Run typechecks to verify codebase integrity:
```bash
npm run typecheck
```
