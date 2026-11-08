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
- Teacher and admin roles
- Teacher load balancing when new teachers are created

### Student and class monitoring
- Student registration with Student ID, class, gender, session, and status
- Automatic assignment to the least-loaded teacher
- Teacher roster includes student counts and class assignments

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
- `JWT_SECRET` should be unique and kept private in production.
- `CLIENT_URL` is used for CORS access from the frontend.

## Database setup

From the backend directory:

```bash
cd backend
npx prisma db push
```

This syncs the Prisma schema with PostgreSQL. If the database does not yet exist, create it first in PostgreSQL, then run the command.

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

Create a Vercel project for this repository and set its **Root Directory** to
`backend`. The backend exposes its Express app through `backend/api/[...path].ts`
so Vercel can invoke it as a serverless function; do not use `npm start` as the
Vercel function entry point.

Set the project environment variables for the Production environment:

- `DATABASE_URL`: connection string for the production PostgreSQL database
- `JWT_SECRET`: a long, unique secret
- `CLIENT_URL`: the deployed frontend's origin, if it is hosted separately

Deploy, then check `https://<your-backend-domain>/api/health`. It should return
`{"status":"ok","service":"assessment-intervention-api"}`. If it still returns
a Vercel `FUNCTION_INVOCATION_FAILED`, inspect the failed deployment's Function
Logs; missing or invalid environment variables and database connectivity errors
will be shown there.

### Open the frontend

Open `frontend/index.html` directly in the browser, or serve the frontend with a local static web server such as Live Server in VS Code.

## First run / first admin setup

On a fresh installation:

1. Start the backend.
2. Open the frontend.
3. Create the initial administrator account.
4. Sign in as the admin.
5. Add teacher accounts and students using the app.

The system will automatically assign new students to the least-loaded teacher. When teachers are added, student assignments are rebalanced to keep teacher workloads as even as possible.

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

- Role-based UI restrictions for teachers vs. administrators
- Better reporting and export features
- Bulk student import from CSV
- Assessment analytics dashboards
- Notifications for overdue interventions
- Better validation and audit logs

## License

This project currently uses the repository's default project licensing conventions. If a specific license file is added later, update this section accordingly.
