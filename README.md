# Assessment-to-Intervention Tracking System

This project is designed as a production-oriented school management system for tracking academic assessment results, identifying students who need intervention, and recording follow-up support. It uses a browser-based frontend, a Node/Express backend, and a PostgreSQL database for real daily school use.

## Project structure

```text
INT/
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── .env
│   └── package.json
├── frontend/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── README.md
└── .gitignore
```

## Run the project

### 1) Install backend dependencies

```bash
cd backend
npm install
```

### 2) Start the backend

```bash
cd backend
npm run dev
```

The API runs on:

```text
http://localhost:5000/api
```

### 3) Open the frontend

Open the `frontend/index.html` file in a browser, or run it with a local web server such as Live Server in VS Code.

The app loads records from the backend. A fresh database has no users, teachers, students, assessments, or results. On first launch, create the initial administrator account; the administrator can then add teacher accounts and students.

## Add school records

On a fresh installation, open the frontend with the backend running and create the first administrator account. Sign in as that administrator, then add teacher accounts and students from their respective pages. New students are assigned to a least-loaded teacher, with random selection when loads are tied. Adding a teacher redistributes the existing students randomly and evenly across the teacher roster; the teacher list shows each assigned-student count.

## Backend configuration

The backend uses environment variables in [backend/.env](backend/.env). Update these values if your database host, port, or JWT secret changes:

```env
PORT=5000
DATABASE_URL="postgresql://postgres:your-password@localhost:5432/assessment_intervention?schema=public"
JWT_SECRET="your-secret-key"
CLIENT_URL="http://localhost:5500"
```

## Database setup

If the database is not created yet, run:

```bash
cd backend
npx prisma db push
```

No seed command is used. The database remains empty until records are created through the application.

## Typical workflow

- Add students and classes
- Create academic assessments
- Enter student results
- Flag students who fall below the threshold
- Create intervention plans
- Record follow-up outcomes

## Notes

Existing database records are not deleted by these setup steps. Use an empty database for a clean first-run setup.
