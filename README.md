# Assessment-to-Intervention Tracking System

A school assessment tracking frontend for recording student results, identifying students who need support, and following up on interventions.

## Project Structure

```text
assessment-intervention-main/
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── backend/
│   └── .gitkeep
└── README.md
```

The `frontend` folder contains the current browser-based demo. The `backend` folder is reserved for the future API, authentication, and database implementation.

## Run the Frontend

No installation is required for the current demo.

1. Clone the repository:

   ```bash
   git clone https://github.com/odualeSamsonSolomon/assessment-intervention-main.git
   cd assessment-intervention-main
   ```

2. Open `frontend/index.html` in a browser.

   In VS Code, you can also use the Live Server extension and open the frontend folder.

## Demo Accounts

The frontend currently uses simulated authentication:

| Email | Workspace |
| --- | --- |
| `admin@school.edu.ng` | Super Admin |
| `teacher@school.edu.ng` | Teacher |

Use any password for the demo. The backend should later replace this with real password validation and database-backed roles.

## Main Workflows

### Super Admin

- View the school dashboard
- Manage students, teachers, classes, and subjects
- Create assessments
- Record student scores
- Review performance and intervention needs
- Print results and reports

### Teacher

- View assigned teaching workflows
- Review students and assessment results
- Record assessments and scores
- Create interventions
- Record follow-up outcomes
- Access reports without Super Admin directory controls

## Working With the Repository

Before making changes:

```bash
git pull origin main
```

After making and testing changes:

```bash
git add .
git commit -m "Describe the change"
git push origin main
```

Please keep frontend changes inside `frontend/` and backend work inside `backend/`.

## Future Backend Work

The planned backend should provide:

- Secure email and password authentication
- Database-backed users and roles
- Teacher class and subject assignments
- Persistent students, assessments, results, and interventions
- API endpoints consumed by the frontend
- Server-side authorization for Super Admin and Teacher permissions

The current frontend is a presentation prototype and does not provide production security or persistent storage.
