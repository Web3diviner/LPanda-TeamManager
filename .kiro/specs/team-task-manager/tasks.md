# Implementation Plan: Team Task Manager

## Overview

Incremental implementation of the team task manager: project setup → database + auth → task lifecycle → points system → leaderboard → weekly recap → announcements → frontend → wiring.

## Tasks

- [x] 1. Project setup and structure
  - Initialize a monorepo with `backend/` (Express + TypeScript) and `frontend/` (React + TypeScript + Vite)
  - Install core dependencies: `express`, `pg`, `bcrypt`, `jsonwebtoken`, `node-cron`, `zod` for backend; `react`, `react-router-dom`, `axios` for frontend
  - Install test dependencies: `jest`, `ts-jest`, `supertest`, `fast-check`
  - Create `backend/src/db.ts` with a PostgreSQL connection pool
  - _Requirements: 1.1_

- [x] 2. Database schema and migrations
  - [x] 2.1 Write SQL migration files for all four tables: `users`, `tasks`, `point_transactions`, `announcements`
    - Include all constraints, defaults, and CHECK constraints as defined in the data models
    - _Requirements: 1.1, 2.1, 4.1, 5.1, 8.1_
  - [ ]* 2.2 Write a property test for new user initialization
    - **Property 1 (partial): New user points balance is 0**
    - **Validates: Requirements 5.1**

- [x] 3. Authentication
  - [x] 3.1 Implement `POST /auth/login` — validate credentials with bcrypt, return a signed JWT in an HTTP-only cookie
    - _Requirements: 1.2, 1.3_
  - [x] 3.2 Implement `POST /auth/logout` — clear the JWT cookie
    - _Requirements: 1.5_
  - [x] 3.3 Implement `authMiddleware` — verify JWT, attach user to request; reject with 401 if missing/invalid
    - _Requirements: 1.4_
  - [x] 3.4 Implement `requireAdmin` middleware — reject with 403 if role is not 'admin'
    - _Requirements: 1.4, 8.5_
  - [ ]* 3.5 Write unit tests for auth middleware
    - Test valid JWT, expired JWT, missing JWT, wrong role
    - _Requirements: 1.2, 1.3, 1.4_
  - [ ]* 3.6 Write property test for role-based access enforcement
    - **Property 8: For any admin-only endpoint, Team_Member sessions must receive 403 with no data mutation**
    - **Validates: Requirements 1.4, 8.5**

- [x] 4. Task submission and assignment
  - [x] 4.1 Implement `POST /tasks` — Team Member submits a task; validate non-empty description; create record with status 'pending'
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 4.2 Implement `PATCH /tasks/:id/assign` — Admin assigns task to a member with a deadline; validate deadline presence; update status to 'assigned'
    - _Requirements: 4.1, 4.2, 4.4_
  - [x] 4.3 Implement `GET /tasks` — return tasks filtered by role (admin sees all, member sees their own)
    - _Requirements: 2.3_
  - [ ]* 4.4 Write unit tests for task submission validation
    - Test empty description rejection, whitespace-only description rejection, successful submission shape
    - _Requirements: 2.1, 2.2_
  - [ ]* 4.5 Write unit tests for task assignment validation
    - Test missing deadline rejection, reassignment of unconfirmed task, admin-only enforcement
    - _Requirements: 4.1, 4.2, 4.4_
  - [ ]* 4.6 Write property test for task submission
    - **Property: For any valid description, the created task has status 'pending' and submitted_by equals the requesting user**
    - **Validates: Requirements 2.1, 2.3**

- [x] 5. Task confirmation and points awarding
  - [x] 5.1 Implement `PATCH /tasks/:id/confirm` — Team Member confirms their assigned task; check assignee match; check not already confirmed; set status to 'completed', record completed_at
    - _Requirements: 3.1, 3.2, 3.5_
  - [x] 5.2 Implement `PointsService.award(userId, taskId)` — insert a +3.0 transaction and increment `users.points` atomically in a DB transaction
    - _Requirements: 3.3, 5.2_
  - [x] 5.3 Call `PointsService.award` from the confirm handler only when `completed_at < deadline`
    - _Requirements: 3.3, 3.4_
  - [ ]* 5.4 Write property test for completion awarding
    - **Property 2: For any task confirmed before deadline, transaction delta == +3.0**
    - **Validates: Requirements 3.3, 5.2**
  - [ ]* 5.5 Write proper
  ty test for no duplicate confirmations
    - **Property 4: Confirming the same task twice must not produce a second point transaction**
    - **Validates: Requirements 3.5**
  - [ ]* 5.6 Write unit tests for confirm endpoint
    - Test wrong assignee (403), already confirmed (409), confirmed after deadline (0 points)
    - _Requirements: 3.2, 3.4, 3.5_

- [x] 6. Deadline scheduler and point deductions
  - [x] 6.1 Implement `DeadlineScheduler` using `node-cron` — runs every minute; queries tasks with status 'assigned' and deadline < now(); for each, calls `PointsService.deduct` and sets status to 'missed'
    - _Requirements: 4.5, 5.3_
  - [x] 6.2 Implement `PointsService.deduct(userId, taskId)` — insert a -1.5 transaction and decrement `users.points` atomically
    - _Requirements: 4.5, 5.3_
  - [ ]* 6.3 Write property test for missed deadline deduction
    - **Property 3: For any task with expired deadline, transaction delta == -1.5**
    - **Validates: Requirements 4.5, 5.3**
  - [ ]* 6.4 Write unit tests for scheduler idempotency
    - Test that running the scheduler twice on the same missed task does not create a second deduction
    - _Requirements: 4.5_

- [x] 7. Points balance and audit log
  - [x] 7.1 Implement `GET /points/me` — return the current user's `points` balance and all their `point_transactions` ordered by `created_at` desc
    - _Requirements: 5.4, 5.5_
  - [ ]* 7.2 Write property test for points balance consistency
    - **Property 1: For any user, users.points == SUM(point_transactions.delta) for that user**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 8. Leaderboard
  - [x] 8.1 Implement `GET /points/leaderboard` — query all users ordered by `points DESC, name ASC`
    - _Requirements: 6.1, 6.2, 6.3_
  - [ ]* 8.2 Write property test for leaderboard sort invariant
    - **Property 5: For any snapshot of user points, adjacent pairs satisfy a.points >= b.points; ties broken by a.name <= b.name**
    - **Validates: Requirements 6.1, 6.2**

- [x] 9. Weekly recap
  - [x] 9.1 Implement `GET /recap/weekly` — aggregate `point_transactions` from the past 7 days; return total completed tasks, total points awarded, total points deducted, and per-member net change; admin gets full breakdown, member gets team summary + own row
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [ ]* 9.2 Write property test for weekly recap consistency
    - **Property 6: For any 7-day window, recap totals must equal the sum of transactions in that window**
    - **Validates: Requirements 7.2**

- [x] 10. Checkpoint — backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Announcements
  - [x] 11.1 Implement `GET /announcements` — return all announcements ordered by `created_at DESC`
    - _Requirements: 8.3_
  - [x] 11.2 Implement `POST /announcements` — Admin only; validate non-empty content; insert record with author_id and timestamp
    - _Requirements: 8.1, 8.2, 8.5_
  - [x] 11.3 Implement `DELETE /announcements/:id` — Admin only; remove the record
    - _Requirements: 8.4, 8.5_
  - [ ]* 11.4 Write property test for announcement ordering
    - **Property 7: For any set of announcements, GET /announcements returns them with created_at descending**
    - **Validates: Requirements 8.3**
  - [ ]* 11.5 Write unit tests for announcement validation
    - Test empty content rejection, non-admin creation attempt (403), deletion by non-admin (403)
    - _Requirements: 8.2, 8.5_

- [x] 12. Frontend — auth and layout
  - [x] 12.1 Create `LoginPage` component with email/password form; call `POST /auth/login`; redirect to dashboard on success; display error on failure
    - _Requirements: 1.2, 1.3_
  - [x] 12.2 Create `AuthContext` and `ProtectedRoute` — wrap app routes; redirect unauthenticated users to login
    - _Requirements: 1.4_
  - [x] 12.3 Create shared `Layout` component with navigation links (Dashboard, Leaderboard, Recap, Profile) and a logout button
    - _Requirements: 1.5_

- [x] 13. Frontend — tasks
  - [x] 13.1 Create `TaskList` component — fetch `GET /tasks` and display tasks with status badges; show Confirm button for assigned tasks belonging to the current user
    - _Requirements: 2.3, 3.1_
  - [x] 13.2 Create `TaskForm` component — input for description, submit calls `POST /tasks`; show success/error feedback
    - _Requirements: 2.1, 2.4_
  - [x] 13.3 Create `TaskAssignModal` component (admin only) — select assignee from user list, pick deadline, call `PATCH /tasks/:id/assign`
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 14. Frontend — points, leaderboard, recap, announcements
  - [x] 14.1 Create `ProfilePage` — fetch `GET /points/me`; display points balance and transaction history table
    - _Requirements: 5.5_
  - [x] 14.2 Create `Leaderboard` component — fetch `GET /points/leaderboard`; render ranked list; highlight current user's row
    - _Requirements: 6.1, 6.4_
  - [x] 14.3 Create `WeeklyRecap` component — fetch `GET /recap/weekly`; render team summary table and individual breakdown
    - _Requirements: 7.3, 7.4_
  - [x] 14.4 Create `AnnouncementBoard` component — fetch `GET /announcements`; render list; show create form and delete buttons for admins
    - _Requirements: 8.3, 8.4, 8.5_

- [x] 15. Wiring and integration
  - [x] 15.1 Wire all frontend components into the React Router routes; ensure role-based rendering (admin-only UI elements hidden for members)
    - _Requirements: 1.4, 4.3_
  - [x] 15.2 Add notification display in the frontend — show a toast/banner when a task is assigned to the current user (poll `GET /tasks` or use server-sent events)
    - _Requirements: 4.3_

- [x] 16. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with a minimum of 100 iterations each
- Unit tests use Jest + Supertest for HTTP-layer integration tests
- The scheduler (task 6) must be idempotent — tasks already marked 'missed' must be skipped
