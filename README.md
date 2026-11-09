# Assessment-to-Intervention Tracking System

A school management application for tracking academic performance, identifying struggling students, and managing intervention workflows. The system combines a lightweight browser-based frontend with a Node.js/Express backend and PostgreSQL data layer to support day-to-day academic monitoring.

## Overview

This project helps schools do the following:

- Manage teacher and administrator accounts
- Register students and assign them to teachers
- Track subjects, topics, and assessment records
- Record student scores for assessments and examinations
- Detect underperformance against a defined threshold
- Create and monitor intervention plans
- Record follow-up scores and outcomes
- Review dashboards for academic support activity

## Core features

### User management
- Administrator setup on first launch
- Secure JWT-based authentication
- Administrator, teacher, and student roles
- Teacher self-registration with administrator approval
- Student self-registration with administrator verification and approval

### Student and class monitoring
- Student registration with Student ID, class, gender, session, and status
- Administrator-managed teacher and student assignments
- Teacher roster includes student counts and class assignments
- Teachers can access only their assigned students and related academic records; administrators retain school-wide access
- Students can view only their own published results and support updates

### Academic data
- Subject catalog with standard senior secondary subjects
- Topic management under each subject
- Assessment creation across terms, sessions, and classes
- Score entry by student and assessment

### Intervention workflow
- Flag students who fall below the academic threshold
- Create intervention plans with reasons, actions, and follow-up dates
- Record follow-up outcomes and support progress
- Track intervention status from active to completed

## Tech stack

- Frontend: Vanilla JavaScript, HTML, CSS
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL via Prisma ORM
- Authentication: JWT
- Runtime: Node.js

## Project structure

```text
INT/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── controllers/
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── validators/
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── package-lock.json
├── frontend/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── README.md
├── .gitignore
└── LICENSE (if present in your environment)
```

## Prerequisites

Before you run the project, make sure you have:

- Node.js 18+ recommended
- PostgreSQL running locally or in a remote environment
- npm installed

## Environment configuration

Create or update `backend/.env` with values similar to the following:

```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/assessment_intervention?schema=public"
JWT_SECRET="your-secret-key"
CLIENT_URL="http://localhost:5500"
```

Notes:
- `DATABASE_URL` must point to a working PostgreSQL database.
- In production, `JWT_SECRET` is required and must be at least 32 characters.
  Keep it private and use the same value across all backend instances.
- `CLIENT_URL` is the frontend origin allowed to call the API. Multiple
  comma-separated origins are supported.

## Database setup

For local development, sync the schema from the backend directory:

```bash
cd backend
npx prisma db push
```

For production, commit schema changes as Prisma migrations and apply them with
`npx prisma migrate deploy`. Vercel Production builds run this command
automatically before compiling the backend; Preview builds do not modify the
database.

## Installation

```bash
cd backend
npm install
```

## Running the app

### Start the backend

```bash
cd backend
npm run dev
```

The server listens on:

```text
http://localhost:5000/api
```

Useful health check:

```bash
curl http://localhost:5000/api/health
```

### Deploy the backend to Vercel

Create a Vercel project for this repository with **Root Directory** set to
`backend`. Vercel detects the Express app exported from `src/app.ts` and routes
requests through it.

Set the project environment variables for the Production environment:

- `DATABASE_URL`: connection string for the production PostgreSQL database
- `JWT_SECRET`: a unique secret of at least 32 characters
- `CLIENT_URL`: the deployed frontend's origin (for example,
  `https://assessment-intervention-frontend.vercel.app`)

Deploy, then check `https://<your-backend-domain>/api/health` and
`https://<your-backend-domain>/api/auth/setup-status`.

### Deploy the frontend to Vercel

Create a second Vercel project connected to this repository with **Root
Directory** set to `frontend`. The frontend calls the production backend by
default; local development on `localhost` continues to use
`http://localhost:5000/api`.

Set `CLIENT_URL` in the backend project to the frontend's production origin,
then redeploy the backend. For local development, open `frontend/index.html`
or serve `frontend/` with a local static web server.

## Account onboarding

On a fresh installation:

1. Start the backend.
2. Open the frontend.
3. Create the initial administrator account with a password of at least 12
   characters.
4. Sign in as the admin.
5. Teachers can register from the sign-in page; their accounts remain pending
   until an administrator approves them in **Teachers**.
6. Administrators assign students to approved teachers when creating or editing
   student records.
7. Students can request portal accounts from the sign-in page using their
   school student ID, name, email, and a password. Requests remain locked until
   an administrator verifies the student's identity and email against school
   records and links the request to the matching active school record. Email
   verification is currently a manual school-admin check; no verification
   email is sent.

Existing teacher assignments are preserved; administrators can assign or
reassign students using the student record editor. New students can remain
unassigned until an administrator selects a teacher. The
student portal displays only that student's published assessment results and
student-facing intervention status; student accounts cannot access staff APIs.

The onboarding migration adds account approval state, the requested student ID,
and a student-account link without deleting existing school data. A separate
migration adds shared PostgreSQL-backed rate-limit buckets for sign-in and
public registration routes. Both migrations are additive and do not delete
existing school records.

### Account recovery

The portal does not currently have a password-reset workflow. Users should
contact the designated system operator, who must verify their identity through
a school-approved channel and arrange recovery through the approved
administrative process. Never ask users to send passwords by email or chat.
Add and test a secure reset workflow before relying on self-service recovery.

### Safe rollout checklist

1. Create a separate non-production PostgreSQL database for Vercel Preview.
   Configure Preview's `DATABASE_URL` to that database; never point Preview at
   the production database.
2. With the Preview database URL loaded in the environment, run
   `npx prisma migrate deploy` from `backend/` to apply the migrations there.
   Preview builds intentionally do not run migrations automatically.
3. Test student and teacher signup, pending-account login rejection, admin
   approval and rejection, student-only data access, and rate limiting (HTTP
   429). Confirm the Preview app uses only test data.
4. Before a production migration, take a database-provider snapshot or create
   a `pg_dump` backup, then verify that the backup can be restored to a
   separate disposable database. For PowerShell, with `DATABASE_URL` set in
   the current session:

   ```powershell
   pg_dump --format=custom --file="assessment-intervention-before-release.dump" "$env:DATABASE_URL"
   ```

5. Only after Preview checks and backup verification, apply migrations to
   production through the normal release workflow. The production build runs
   `prisma migrate deploy` automatically.

Rate limits are shared across serverless instances using PostgreSQL: sign-in
allows 10 attempts per IP per 15 minutes, public registration allows 20 per IP
per hour, and initial admin setup allows 5 attempts per IP per hour. If the
rate-limit table is unavailable, these endpoints fail closed with HTTP 503.

## Typical workflow

- Add teacher accounts
- Add students and assign classes
- Create or configure subject/topic catalogs
- Record assessment scores
- Review students who fall below the threshold
- Create intervention plans
- Record follow-up outcomes and monitor progress

## API overview

The backend exposes a REST API under `/api` with routes for:

- `/auth/setup-status`
- `/auth/setup-admin`
- `/auth/login`
- `/auth/me`
- `/dashboard`
- `/students`
- `/teachers`
- `/subjects`
- `/assessments`
- `/results`
- `/interventions`
- `/follow-ups`

## Development notes

- No seed script is included; the database starts empty unless records are created in the app.
- Existing data is not automatically cleared on setup.
- Use an empty PostgreSQL database for a clean first-run experience.
- For production, replace the default development JWT secret and secure the deployment environment.

## Recommended next improvements

Potential enhancements for future versions include:

- Additional configurable role permissions beyond the assigned-student access policy
- Better reporting and export features
- Bulk student import from CSV
- Assessment analytics dashboards
- Notifications for overdue interventions
- Better validation and audit logs

## License

This project currently uses the repository's default project licensing conventions. If a specific license file is added later, update this section accordingly.
