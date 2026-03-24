# Requirements Document

## Introduction

A team task management website that allows team members to submit and confirm tasks, enables admins to assign tasks to team members, tracks a point-based scoring system (3 points per completed task, -1.5 points per missed deadline), and provides weekly recaps, a leaderboard, and a general announcements board.

## Glossary

- **Admin**: A privileged user who can create, assign, and manage tasks for team members.
- **Team_Member**: A registered user who can submit tasks, confirm task completion, and earn points.
- **Task**: A unit of work with a description, assignee, deadline, and completion status.
- **Points**: A numeric score awarded or deducted based on task completion. Each completed task awards 3 points; each task not completed before its deadline deducts 1.5 points.
- **Leaderboard**: A ranked list of team members ordered by their total points.
- **Weekly_Recap**: A summary of task completions, points earned/deducted, and team performance for the past 7 days.
- **Announcement**: A message posted by an Admin visible to all team members.
- **Deadline**: The date and time by which a task must be completed to avoid a point deduction.
- **Submission**: The act of a Team_Member creating a new task entry in the system.
- **Confirmation**: The act of a Team_Member marking a task as completed.

## Requirements

### Requirement 1: User Authentication and Roles

**User Story:** As a user, I want to log in with a role-based account, so that I can access features appropriate to my role (admin or team member).

#### Acceptance Criteria

1. THE System SHALL support two roles: Admin and Team_Member.
2. WHEN a user provides valid credentials, THE System SHALL authenticate the user and establish a session.
3. IF a user provides invalid credentials, THEN THE System SHALL return an error message and deny access.
4. WHILE a user session is active, THE System SHALL enforce role-based access control on all protected routes.
5. WHEN a user logs out, THE System SHALL invalidate the session and redirect to the login page.

---

### Requirement 2: Task Submission by Team Members

**User Story:** As a team member, I want to submit a task, so that it can be tracked and assigned points upon completion.

#### Acceptance Criteria

1. WHEN a Team_Member submits a task, THE System SHALL create a Task record with a description, submission timestamp, and status of "pending".
2. IF a Team_Member submits a task with an empty description, THEN THE System SHALL reject the submission and display a validation error.
3. THE System SHALL associate each submitted Task with the submitting Team_Member.
4. WHEN a task is successfully submitted, THE System SHALL display a confirmation message to the Team_Member.

---

### Requirement 3: Task Confirmation by Team Members

**User Story:** As a team member, I want to confirm the completion of a task, so that I receive the associated points.

#### Acceptance Criteria

1. WHEN a Team_Member confirms a Task assigned to them, THE System SHALL update the Task status to "completed" and record the completion timestamp.
2. IF a Team_Member attempts to confirm a Task not assigned to them, THEN THE System SHALL deny the action and return an error.
3. WHEN a Task is confirmed before its Deadline, THE System SHALL award 3 Points to the assigned Team_Member.
4. IF a Task is confirmed after its Deadline, THEN THE System SHALL award 0 Points for that confirmation (the deduction is applied separately at deadline expiry).
5. THE System SHALL prevent a Team_Member from confirming the same Task more than once.

---

### Requirement 4: Task Assignment by Admin

**User Story:** As an admin, I want to assign tasks to team members with a deadline, so that responsibilities are clearly distributed.

#### Acceptance Criteria

1. WHEN an Admin assigns a Task to a Team_Member, THE System SHALL record the assignee and a Deadline on the Task.
2. IF an Admin attempts to assign a Task without specifying a Deadline, THEN THE System SHALL reject the assignment and display a validation error.
3. WHEN an Admin assigns a Task, THE System SHALL notify the assigned Team_Member.
4. THE Admin SHALL be able to reassign a Task to a different Team_Member before the Task is confirmed.
5. WHEN a Task's Deadline passes without confirmation, THE System SHALL deduct 1.5 Points from the assigned Team_Member's score.

---

### Requirement 5: Points System

**User Story:** As a team member, I want my points to be tracked automatically, so that I can see my performance score.

#### Acceptance Criteria

1. THE System SHALL initialize each Team_Member's Points balance to 0 upon account creation.
2. WHEN a Task is confirmed before its Deadline, THE System SHALL add 3 Points to the assigned Team_Member's balance.
3. WHEN a Task's Deadline passes without confirmation, THE System SHALL subtract 1.5 Points from the assigned Team_Member's balance.
4. THE System SHALL maintain an audit log of all point transactions (award and deduction) with timestamps.
5. WHEN a Team_Member views their profile, THE System SHALL display their current Points balance and transaction history.

---

### Requirement 6: Leaderboard

**User Story:** As a team member, I want to view a leaderboard, so that I can see how I rank against my teammates.

#### Acceptance Criteria

1. THE System SHALL display a Leaderboard ranking all Team_Members by their total Points in descending order.
2. WHEN two Team_Members have equal Points, THE System SHALL rank them alphabetically by name.
3. THE Leaderboard SHALL update in real time whenever Points are awarded or deducted.
4. WHEN a Team_Member views the Leaderboard, THE System SHALL highlight their own entry.

---

### Requirement 7: Weekly Recap

**User Story:** As a team member, I want to view a weekly recap, so that I can review team performance over the past week.

#### Acceptance Criteria

1. THE System SHALL generate a Weekly_Recap covering the 7-day period ending at the current date.
2. THE Weekly_Recap SHALL include the total number of Tasks completed, total Points awarded, total Points deducted, and each Team_Member's net Points change for the period.
3. WHEN an Admin views the Weekly_Recap, THE System SHALL display a breakdown per Team_Member.
4. WHEN a Team_Member views the Weekly_Recap, THE System SHALL display the team summary and their own individual breakdown.

---

### Requirement 8: Announcements

**User Story:** As an admin, I want to post announcements, so that I can communicate important information to the entire team.

#### Acceptance Criteria

1. WHEN an Admin creates an Announcement, THE System SHALL store it with the author, content, and creation timestamp.
2. IF an Admin submits an Announcement with empty content, THEN THE System SHALL reject it and display a validation error.
3. THE System SHALL display all Announcements to all authenticated users in reverse chronological order.
4. WHEN an Admin deletes an Announcement, THE System SHALL remove it from the visible list.
5. THE System SHALL restrict Announcement creation and deletion to Admin users only.
