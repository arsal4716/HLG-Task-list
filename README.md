# HLG Task Management System

A complete, production-ready **internal task management system** for the HLG Team, built on the **MERN stack** (MongoDB, Express, React 19, Node.js) with realtime collaboration via Socket.io.

> Assign work, track time, hit deadlines, and measure performance — all in one internal workspace.

---

## ✨ Features

| Area | Highlights |
| --- | --- |
| **Auth** | JWT access + refresh-token rotation, role-based access (Owner / Manager / Employee), password reset via email |
| **Tasks** | Full CRUD, assign / reassign, duplicate, archive / restore, soft + hard delete, bulk operations (delete / status / priority / assign), checklist, tags |
| **Kanban** | Drag-and-drop board with optimistic updates |
| **Comments** | Text, code blocks, file attachments, @mentions, replies, edit / delete — realtime |
| **Time tracking** | Start / pause / resume / stop with daily / weekly / monthly summaries; auto-syncs `actualHours` |
| **Attachments** | Cloudinary storage (images, PDF, Excel, ZIP, video) with a local-disk fallback |
| **History** | Immutable audit log of every task action (with user, timestamp, IP) |
| **Notifications** | Realtime (Socket.io) + persisted + optional email (assignment, comment, mention, deadline, …) |
| **Dashboards** | Tailored Owner / Manager / Employee views with charts (Recharts) |
| **Calendar** | Monthly deadline calendar with holiday markers |
| **Reports** | Employee, department, completion-trend, late-tasks & performance reports with CSV export |
| **Performance** | Weighted scoring — 40% completion · 30% on-time · 20% quality · 10% attendance |
| **Settings** | Custom departments, holidays, working hours, performance weights |
| **Security** | Helmet, rate limiting, NoSQL-injection sanitization, validation, centralised error handling |
| **UI** | TailwindCSS, dark / light mode, responsive (desktop / tablet / mobile), Framer Motion animations |
| **Automation** | `node-cron` jobs: deadline reminders, overdue alerts, nightly performance recalculation |

---

## 🗂 Project structure

```
HLG-Task-list/
├── backend/
│   ├── config/        # db, cloudinary, constants
│   ├── controllers/   # request handlers
│   ├── cron/          # scheduled jobs
│   ├── helpers/       # tokens, query features, CSV export
│   ├── middleware/    # auth, roles, validation, upload, rate-limit, errors
│   ├── models/        # Mongoose schemas
│   ├── routes/        # REST routes
│   ├── services/      # email, notifications, history, performance, time
│   ├── sockets/       # Socket.io server, auth, handlers
│   ├── utils/         # logger, AppError, catchAsync, seeder
│   ├── app.js         # express app factory
│   └── server.js      # entrypoint (http + sockets + cron)
└── frontend/
    └── src/
        ├── components/  # ui primitives, task & dashboard widgets
        ├── contexts/    # Auth, Theme, Socket
        ├── hooks/       # useDebounce, useTimer
        ├── layouts/     # Sidebar, Navbar, AppLayout
        ├── lib/         # axios client w/ refresh interceptor
        ├── pages/       # route screens
        ├── services/    # API wrappers
        └── utils/       # constants, formatters
```

---

## 🚀 Getting started

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)
- (Optional) Cloudinary account for file uploads, SMTP creds for email

### 1. Backend

```bash
cd backend
cp .env.example .env          # then fill in the values
npm install
npm run seed                  # optional: demo users + tasks
npm run dev                   # starts on http://localhost:5000
```

**Seeded logins** (after `npm run seed`):

| Role | Email | Password |
| --- | --- | --- |
| Owner | `owner@hlg.com` | `Owner@12345` |
| Manager | `manager@hlg.com` | `Manager@123` |
| Employee | `eva@hlg.com` | `Employee@123` |

### 2. Frontend

```bash
cd frontend
cp .env.example .env          # optional — dev proxy works out of the box
npm install
npm run dev                   # starts on http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to the backend, so no CORS setup is required in development.

> **First run without seeding?** The very first account you register becomes the **Owner**.

---

## 🔌 API overview

Base path: `/api`

| Resource | Routes |
| --- | --- |
| Auth | `POST /auth/register·login·refresh·logout·forgot-password`, `PATCH /auth/reset-password/:token·me·change-password`, `GET /auth/me` |
| Users | `GET/POST /users`, `GET/PATCH/DELETE /users/:id`, `PATCH /users/avatar`, `GET /users/assignable` |
| Tasks | `GET/POST /tasks`, `GET/PATCH/DELETE /tasks/:id`, `POST /tasks/bulk`, `PATCH /tasks/:id/assign·archive·restore·move`, `POST /tasks/:id/duplicate`, checklist / attachments / comments / timer sub-routes |
| Comments | `PATCH/DELETE /comments/:id` |
| Time | `GET /timelogs/active·summary`, `PATCH /timelogs/:id/pause·resume·stop` |
| Departments | `GET/POST /departments`, `PATCH/DELETE /departments/:id` |
| Notifications | `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, `DELETE /notifications/:id` |
| Dashboard | `GET /dashboard`, `GET /dashboard/calendar` |
| Reports | `GET /reports/employees·departments·completion·late·performance` (`?format=csv`) |
| Performance | `GET /performance`, `GET /performance/:id`, `POST /performance/recalc-all` |
| Settings | `GET/PATCH /settings`, holidays CRUD |

Every list endpoint supports **pagination** (`page`, `limit`), **sorting** (`sort`), **search** (`search`) and **filtering** (field operators like `status`, `priority`, `dueDate[gte]`).

---

## 🔐 Roles & permissions

| Capability | Owner | Manager | Employee |
| --- | :---: | :---: | :---: |
| Full access / settings | ✅ | — | — |
| Create / assign / edit tasks | ✅ | ✅ | — |
| Reports & performance | ✅ | ✅ | — |
| Manage team | ✅ | ✅ (employees) | — |
| View assigned tasks, update status, comment, upload, track time | ✅ | ✅ | ✅ |

---

## 🛠 Tech stack

**Frontend:** React 19 · React Router · TanStack Query · Axios · React Hook Form · TailwindCSS · Framer Motion · Recharts · Socket.io-client · React Hot Toast · React Icons

**Backend:** Node.js · Express · MongoDB · Mongoose · JWT · Socket.io · Multer · Cloudinary · Nodemailer · node-cron · bcrypt · Helmet · Compression · CORS · express-rate-limit · Morgan

---

## 📦 Environment variables

See [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example) for the full list. Cloudinary and SMTP are optional — the app degrades gracefully (local file storage, logged emails) when they are not configured.

---

## 📄 License

MIT © HLG Team — internal use.
