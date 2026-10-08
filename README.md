# Assessment-to-Intervention Tracking System

This project is designed as a production-oriented school management system for tracking academic assessment results, identifying students who need intervention, and recording follow-up support. It uses a browser-based frontend, a Node/Express backend, and a PostgreSQL database for real daily school use.

## Project structure

```text
INT/
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── .env
│   ├── package.json
│   └── seed.mjs
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

## Default live credentials

For a clean initial deployment, the system includes seeded production-style credentials:

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | `admin@school.edu.ng` | `password` |
| Teacher | `teacher@school.edu.ng` | `password` |

These values are used only as the initial administrative accounts and should be replaced with your real school credentials before opening the system to staff.

This is not a mock demo state; the app expects a real backend service and real database data to be running before it loads school records.

## How to change the school data

The default names and records are stored in the frontend configuration at the top of [frontend/app.js](frontend/app.js).

### Change the school name and admin data

At the top of the file, update this section:

```js
const appConfig = {
  schoolName: "Assessment-to-Intervention Tracking System",
  shortSchoolName: "AIT",
  academicSession: "2025/2026",
  admin: {
    name: "Oduale Samson",
    email: "admin@school.edu.ng",
    password: "password"
  },
  teacher: {
    name: "Ngozi Eze",
    email: "teacher@school.edu.ng",
    password: "password"
  }
};
```

Replace the values with your actual school names and credentials for a real presentation or production use case.

### Change the student names and records

Edit the `state.students` array in [frontend/app.js](frontend/app.js). Each student object looks like this:

```js
{ id: "ST-2025-001", name: "Amaka Nwosu", className: "SSS2", gender: "Female", status: "Active", session }
```

Update:
- `name` to the student's real name
- `id` to the official student ID
- `className` to the correct class
- `gender`, `status`, and `session` if needed

### Change the teachers, subjects, classes, and assessment settings

You can also edit these arrays in the same file:

```js
const subjects = ["Mathematics", "English Language", ...];
const classes = ["SSS1", "SSS2", "SSS3"];
const assessmentTypes = ["Class Test", "Quiz", "Assignment", ...];
const terms = ["First Term", "Second Term", "Third Term"];
```

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

Then seed the initial admin and demo data if needed:

```bash
cd backend
node seed.mjs
```

## Typical workflow

- Add students and classes
- Create academic assessments
- Enter student results
- Flag students who fall below the threshold
- Create intervention plans
- Record follow-up outcomes

## Notes

This is a real working project setup, not a placeholder demo. Replace the default names and records with your actual school information before using it in production or for a classroom workflow.
