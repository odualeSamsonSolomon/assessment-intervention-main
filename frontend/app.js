const subjects = ["Mathematics", "English Language", "Economics", "Biology", "Chemistry", "Physics", "Government", "Literature in English", "Geography", "Computer Studies", "Agricultural Science", "Civic Education", "Financial Accounting", "Commerce"];
const classes = ["SSS1", "SSS2", "SSS3"];
const assessmentTypes = ["Class Test", "Quiz", "Assignment", "Mid-Term Test", "School Examination"];
const terms = ["First Term", "Second Term", "Third Term"];
const session = "2025/2026";
const threshold = 60;

const state = {
  role: "admin",
  user: { name: "Oduale Samson", role: "Super Admin", initials: "OS" },
  students: [
    { id: "ST-2025-001", name: "Amaka Nwosu", className: "SSS2", gender: "Female", status: "Active", session },
    { id: "ST-2025-002", name: "Ibrahim Musa", className: "SSS3", gender: "Male", status: "Active", session },
    { id: "ST-2025-003", name: "Blessing Eze", className: "SSS1", gender: "Female", status: "Active", session },
    { id: "ST-2025-004", name: "Tunde Adeyemi", className: "SSS2", gender: "Male", status: "Active", session },
    { id: "ST-2025-005", name: "Favour Okoro", className: "SSS3", gender: "Female", status: "Active", session },
    { id: "ST-2025-006", name: "Yusuf Abdullahi", className: "SSS1", gender: "Male", status: "Active", session },
    { id: "ST-2025-007", name: "Chisom Okafor", className: "SSS1", gender: "Female", status: "Active", session },
    { id: "ST-2025-008", name: "Daniel Adebayo", className: "SSS2", gender: "Male", status: "Active", session },
    { id: "ST-2025-009", name: "Hauwa Suleiman", className: "SSS3", gender: "Female", status: "Active", session },
    { id: "ST-2025-010", name: "Emeka Nnamani", className: "SSS3", gender: "Male", status: "Active", session },
    { id: "ST-2025-011", name: "Zainab Ibrahim", className: "SSS1", gender: "Female", status: "Active", session },
    { id: "ST-2025-012", name: "Oluwaseun Balogun", className: "SSS2", gender: "Male", status: "Active", session },
    { id: "ST-2025-013", name: "Esther Udo", className: "SSS3", gender: "Female", status: "Active", session },
    { id: "ST-2025-014", name: "Michael Eze", className: "SSS2", gender: "Male", status: "Active", session },
    { id: "ST-2025-015", name: "Fatima Garba", className: "SSS1", gender: "Female", status: "Active", session },
    { id: "ST-2025-016", name: "Nnamdi Obi", className: "SSS3", gender: "Male", status: "Active", session },
    { id: "ST-2025-017", name: "Peace Adekunle", className: "SSS2", gender: "Female", status: "Active", session }
  ],
  assessments: [
    { id: "AS-001", name: "Algebra Class Test", type: "Class Test", subject: "Mathematics", className: "SSS2", session, term: "First Term", date: "2025-10-14", max: 20, status: "Published" },
    { id: "AS-002", name: "Organic Chemistry Quiz", type: "Quiz", subject: "Chemistry", className: "SSS3", session, term: "First Term", date: "2025-10-18", max: 25, status: "Published" },
    { id: "AS-003", name: "Comprehension Assignment", type: "Assignment", subject: "English Language", className: "SSS1", session, term: "First Term", date: "2025-10-21", max: 20, status: "Published" },
    { id: "AS-004", name: "First Term Mid-Term Test", type: "Mid-Term Test", subject: "Economics", className: "SSS2", session, term: "First Term", date: "2025-11-03", max: 50, status: "Draft" }
  ],
  results: [
    { id: "RS-001", assessmentId: "AS-001", studentId: "ST-2025-001", score: 8 },
    { id: "RS-002", assessmentId: "AS-001", studentId: "ST-2025-004", score: 15 },
    { id: "RS-003", assessmentId: "AS-002", studentId: "ST-2025-002", score: 11 },
    { id: "RS-004", assessmentId: "AS-002", studentId: "ST-2025-005", score: 21 },
    { id: "RS-005", assessmentId: "AS-003", studentId: "ST-2025-003", score: 16 },
    { id: "RS-006", assessmentId: "AS-003", studentId: "ST-2025-006", score: 12 }
  ],
  interventions: [
    { id: "IN-001", studentId: "ST-2025-001", subject: "Mathematics", topic: "Quadratic Equations", assessmentId: "AS-001", previous: 40, reason: "Low assessment score", action: "One-on-one explanation", teacher: "Chinedu Okafor", start: "2025-10-16", followUp: "2025-11-08", status: "Follow-up Due", notes: "Review factorisation and completing the square." },
    { id: "IN-002", studentId: "ST-2025-002", subject: "Chemistry", topic: "Organic Compounds", assessmentId: "AS-002", previous: 44, reason: "Difficulty understanding a topic", action: "Topic re-teaching", teacher: "Chinedu Okafor", start: "2025-10-20", followUp: "2025-11-12", status: "Active", notes: "Use structure diagrams during revision." },
    { id: "IN-003", studentId: "ST-2025-003", subject: "English Language", topic: "Comprehension", assessmentId: "AS-003", previous: 80, reason: "Needs additional practice", action: "Practice exercises", teacher: "Chinedu Okafor", start: "2025-10-23", followUp: "2025-11-06", status: "Completed", notes: "Student improved after guided practice.", followUpScore: 90, outcome: "Improved" }
  ],
  followUps: [
    { interventionId: "IN-003", score: 90, outcome: "Improved", date: "2025-11-06" }
  ],
  directoryAdds: { teachers: [], classes: [], subjects: [] }
};
let authView = "login";
const demoAccounts = {
  "admin@school.edu.ng": { role: "admin", password: "password", user: { name: "Oduale Samson", role: "Super Admin", initials: "OS" } },
  "ngozi@school.edu.ng": { role: "teacher", password: "password", user: { name: "Ngozi Eze", role: "Teacher", initials: "NE" } }
};
const accountStorageKey = "ait-demo-accounts";
const getAllAccounts = () => {
  try {
    const raw = localStorage.getItem(accountStorageKey);
    const stored = raw ? JSON.parse(raw) : {};
    return { ...demoAccounts, ...(stored || {}) };
  } catch (error) {
    return { ...demoAccounts };
  }
};
const persistAccounts = (accounts) => {
  try {
    localStorage.setItem(accountStorageKey, JSON.stringify(accounts));
  } catch (error) {
    console.warn("Could not save accounts to localStorage.", error);
  }
};

const app = document.getElementById("app");
const toast = document.getElementById("toast");
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
const fmtDate = (date) => date ? new Date(`${date}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—";
const studentById = (id) => state.students.find((student) => student.id === id);
const assessmentById = (id) => state.assessments.find((assessment) => assessment.id === id);
const interventionById = (id) => state.interventions.find((item) => item.id === id);
const percent = (score, max) => max ? Math.round((Number(score) / Number(max)) * 100) : 0;
const statusFor = (value) => value < threshold ? "Needs Intervention" : "Satisfactory";
const badge = (text) => {
  const map = { "Active": "green", "Published": "green", "Completed": "green", "Satisfactory": "green", "Improved": "green", "Follow-up Due": "amber", "Draft": "gray", "Needs Intervention": "red", "Needs Further Support": "red", "No Significant Improvement": "amber" };
  return `<span class="badge badge-${map[text] || "blue"}">${esc(text)}</span>`;
};
const initials = (name) => name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
const pageName = () => (location.hash.replace("#/", "").split("/")[0].split("?")[0] || "dashboard");
const pageParam = () => location.hash.replace("#/", "").split("/")[1];
const go = (path) => { location.hash = `#/${path}`; };
const showToast = (message) => { toast.textContent = message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2800); };
function routeFromElement(element) {
  const route = element.dataset.route;
  if (route === "student-details") go(`student-details/${element.dataset.id}`);
  else if (route === "record-scores") go(`record-scores/${element.dataset.id}`);
  else if (route === "create-intervention" && element.dataset.student) go(`create-intervention?student=${element.dataset.student}`);
  else go(route);
}
function bindGeneratedActions(root) {
  root.querySelectorAll("[data-route]").forEach((element) => element.addEventListener("click", () => routeFromElement(element)));
  root.querySelectorAll("[data-action]").forEach((element) => element.addEventListener("click", () => handleAction(element.dataset.action, element)));
}

function selectOptions(items, selected = "", includeAll = false) {
  return `${includeAll ? '<option value="">All</option>' : '<option value="">Select...</option>'}${items.map((item) => `<option ${item === selected ? "selected" : ""} value="${esc(item)}">${esc(item)}</option>`).join("")}`;
}

function registerView() {
  return `<main class="login-shell"><section class="login-card">
    <div class="brand"><div class="brand-mark">A</div><div><h1>Assessment-to-Intervention<br>Tracking System</h1><p>Internal academic support workspace</p></div></div>
    <h2>Register Teacher</h2><p class="intro">Create a teacher account for the school portal.</p>
    <form id="teacher-register-form"><div class="field"><label for="register-name">Full Name</label><input id="register-name" name="name" required placeholder="e.g. Amina Bello"></div>
      <div class="field"><label for="register-email">School Email</label><input id="register-email" name="email" required type="email" placeholder="teacher@school.edu.ng"></div>
      <div class="field"><label for="register-password">Password</label><div class="password-field"><input id="register-password" name="password" required type="password" placeholder="Create password"><button class="password-toggle" type="button" data-action="toggle-password" aria-label="Show password" title="Show password">👁</button></div></div>
      <div class="field"><label for="register-subject">Subject Area</label><input id="register-subject" name="subject" required placeholder="e.g. Mathematics"></div>
      <div class="field"><label for="register-classes">Assigned Classes</label><input id="register-classes" name="classes" placeholder="e.g. SSS1, SSS2"></div>
      <button class="btn btn-primary btn-block" type="submit">Create Teacher Account <span>→</span></button>
    </form>
    <p class="login-back"><button class="text-link" type="button" data-action="back-to-login">← Back to sign in</button></p>
  </section></main>`;
}

function loginView() {
  if (authView === "forgot") {
    return `<main class="login-shell"><section class="login-card">
      <div class="brand"><div class="brand-mark">A</div><div><h1>Assessment-to-Intervention<br>Tracking System</h1><p>Internal academic support workspace</p></div></div>
      <h2>Reset your password</h2><p class="intro">Enter the email address linked to your account and we will send a password reset link.</p>
      <form id="forgot-password-form"><div class="field"><label for="reset-email">Username or Email</label><input id="reset-email" name="email" required type="email" placeholder="you@school.edu.ng"></div>
        <button class="btn btn-primary btn-block" type="submit">Send Reset Link <span>→</span></button>
      </form>
      <p class="login-back"><button class="text-link" type="button" data-action="back-to-login">← Back to sign in</button></p>
    </section></main>`;
  }
  if (authView === "register") return registerView();
  return `<main class="login-shell"><section class="login-card">
    <div class="brand"><div class="brand-mark">A</div><div><h1>Assessment-to-Intervention<br>Tracking System</h1><p>Internal academic support workspace</p></div></div>
    <h2>Welcome back</h2><p class="intro">Sign in to continue to your school workspace.</p>
    <form id="login-form"><div class="field"><label for="login-email">Username or Email</label><input id="login-email" required type="email" placeholder="you@school.edu.ng" value="admin@school.edu.ng"></div>
      <div class="field"><label for="login-password">Password</label><div class="password-field"><input id="login-password" required type="password" placeholder="Enter your password" value="password"><button class="password-toggle" type="button" data-action="toggle-password" aria-label="Show password" title="Show password">👁</button></div></div>
      <div class="login-help"><span>Use your assigned school account</span><button class="text-link" type="button" data-action="show-register">Register a teacher</button></div>
      <button class="btn btn-primary btn-block" type="submit">Sign In <span>→</span></button>
    </form>
    <p class="login-back"><button class="text-link" type="button" data-action="forgot-password">Forgot password?</button></p>
  </section></main>`;
}

const navForRole = () => state.role === "admin"
  ? [{ id: "dashboard", label: "Dashboard", icon: "⌂" }, { id: "students", label: "Students", icon: "♙" }, { id: "teachers", label: "Teachers", icon: "♧" }, { id: "classes", label: "Classes", icon: "▦" }, { id: "subjects", label: "Subjects & Topics", icon: "◈" }, { id: "assessments", label: "Assessments", icon: "✓" }, { id: "results", label: "Results", icon: "▤" }, { id: "interventions", label: "Interventions", icon: "✦" }, { id: "follow-up", label: "Follow-Up", icon: "↗" }, { id: "reports", label: "Reports", icon: "▥" }]
  : [{ id: "dashboard", label: "Dashboard", icon: "⌂" }, { id: "students", label: "Students", icon: "♙" }, { id: "assessments", label: "Assessments", icon: "✓" }, { id: "results", label: "Results", icon: "▤" }, { id: "interventions", label: "Interventions", icon: "✦" }, { id: "follow-up", label: "Follow-Up", icon: "↗" }, { id: "reports", label: "Reports", icon: "▥" }];

function shell(content) {
  const nav = navForRole();
  const active = pageName();
  return `<div class="app-shell"><aside class="sidebar">
    <div class="brand"><div class="brand-mark">A</div><div><h1>Assessment-to-<br>Intervention</h1><p>Tracking System</p></div></div>
    <div class="nav-label">Workspace</div><nav class="nav">${nav.map((item) => `<button class="${active === item.id ? "active" : ""}" data-route="${item.id}"><span class="nav-icon">${item.icon}</span>${item.label}</button>`).join("")}</nav>
    <div class="sidebar-footer">Internal assessments only<br><span>Academic Session ${session}</span></div>
  </aside><main class="main"><header class="topbar"><div><h2>${pageTitle(active)}</h2><div class="breadcrumb">Home / ${pageTitle(active)}</div></div><div class="user-menu"><div class="user-copy"><strong>${state.user.name}</strong><span>${state.user.role} · ${session}</span></div><div class="avatar">${state.user.initials}</div><button class="btn btn-secondary btn-sm" data-action="sign-out">Sign out</button></div></header><section class="content">${content}</section></main></div>`;
}

function pageTitle(page) {
  return ({ dashboard: `${state.role === "admin" ? "Super Admin" : "Teacher"} Dashboard`, students: "Students", "student-details": "Student Details", assessments: "Assessments", "create-assessment": "Create Assessment", "record-scores": "Record Scores", results: "Results & Performance", interventions: "Interventions", "create-intervention": "Create Intervention", "follow-up": "Follow-Up & Improvement", reports: "Reports", teachers: "Teachers", classes: "Classes", subjects: "Subjects & Topics" })[page] || "Dashboard";
}

function statCards(items) {
  return `<div class="stats-grid">${items.map((item) => `<button class="stat-card stat-card-button" data-route="${item.route || "dashboard"}"><div class="stat-top"><span class="stat-label">${item.label}</span><span class="stat-icon">${item.icon || "•"}</span></div><div class="stat-value">${item.value}</div><div class="stat-note">${item.note || ""}</div></button>`).join("")}</div>`;
}

function dashboardView() {
  const needs = state.results.filter((result) => statusFor(percent(result.score, assessmentById(result.assessmentId)?.max)) === "Needs Intervention");
  const active = state.interventions.filter((item) => item.status === "Active");
  const completed = state.interventions.filter((item) => item.status === "Completed");
  const cards = state.role === "admin"
    ? [{ label: "Total Students", value: state.students.length, icon: "♙", route: "students", note: "Across 3 classes" }, { label: "Total Teachers", value: 8, icon: "♧", route: "teachers", note: "4 subject areas" }, { label: "Total Classes", value: 3, icon: "▦", route: "classes", note: "SSS1 – SSS3" }, { label: "Assessments Recorded", value: state.assessments.length, icon: "✓", route: "assessments", note: "This academic session" }, { label: "Needing Intervention", value: needs.length, icon: "!", route: "results", note: "Below threshold" }, { label: "Active Interventions", value: active.length, icon: "✦", route: "interventions", note: "Requires attention" }]
    : [{ label: "Total Students", value: state.students.length, icon: "♙", route: "students", note: "Assigned students" }, { label: "Assessments Recorded", value: state.assessments.length, icon: "✓", route: "assessments", note: "This academic session" }, { label: "Needing Intervention", value: needs.length, icon: "!", route: "results", note: "Below threshold" }, { label: "Active Interventions", value: active.length, icon: "✦", route: "interventions", note: "Requires attention" }, { label: "Completed Interventions", value: completed.length, icon: "✓", route: "follow-up", note: "This term" }, { label: "Showing Improvement", value: state.followUps.filter((f) => f.outcome === "Improved").length, icon: "↗", route: "follow-up", note: "After follow-up" }];
  return `${statCards(cards)}<div class="grid-2"><section class="card"><div class="card-header"><div><h3>Students Needing Intervention</h3><p>Results below the configurable ${threshold}% threshold</p></div><button class="section-link" data-route="results">View all results →</button></div><div class="table-wrap">${needs.length ? `<table><thead><tr><th>Student</th><th>Class</th><th>Subject</th><th>Percentage</th><th>Reason</th><th>Action</th></tr></thead><tbody>${needs.slice(0, 5).map((result) => { const student = studentById(result.studentId); const assessment = assessmentById(result.assessmentId); const pct = percent(result.score, assessment.max); return `<tr><td><span class="primary-text">${student.name}</span><br><span class="muted">${student.id}</span></td><td>${student.className}</td><td>${assessment.subject}</td><td>${badge(`${pct}%`)}</td><td>Low assessment score</td><td><button class="link-action" data-route="student-details" data-id="${student.id}">Review</button></td></tr>`; }).join("")}</tbody></table>` : emptyState("No students need intervention", "All recorded results meet the current threshold.")}</div></section>
    <section class="card"><div class="card-header"><div><h3>Intervention Overview</h3><p>Current support activity</p></div></div><div class="card-body"><div class="overview-list"><div class="overview-row"><span>Active Interventions</span><strong>${active.length}</strong></div><div class="overview-row"><span>Follow-up Due</span><strong>${state.interventions.filter((item) => item.status === "Follow-up Due").length}</strong></div><div class="overview-row"><span>Completed Interventions</span><strong>${completed.length}</strong></div><div class="overview-row"><span>Students Showing Improvement</span><strong>${state.followUps.filter((f) => f.outcome === "Improved").length}</strong></div></div></div></section></div>
    <div class="grid-2" style="margin-top:20px"><section class="card"><div class="card-header"><div><h3>Active Interventions</h3><p>Support actions in progress</p></div><button class="section-link" data-route="interventions">View all →</button></div><div class="table-wrap"><table><thead><tr><th>Student</th><th>Subject</th><th>Action taken</th><th>Follow-up</th><th>Status</th></tr></thead><tbody>${state.interventions.filter((item) => item.status !== "Completed").map((item) => { const student = studentById(item.studentId); return `<tr><td class="primary-text">${student.name}</td><td>${item.subject}</td><td>${item.action}</td><td>${fmtDate(item.followUp)}</td><td>${badge(item.status)}</td></tr>`; }).join("")}</tbody></table></div></section>
    <section class="card"><div class="card-header"><div><h3>${state.role === "admin" ? "Recent Activity" : "Quick Actions"}</h3><p>${state.role === "admin" ? "Latest updates in the workspace" : "Common tasks for your classes"}</p></div></div><div class="card-body">${state.role === "admin" ? `<div class="activity-list">${["Assessment recorded for SSS2 Mathematics", "Student result updated for Amaka Nwosu", "Intervention created for Ibrahim Musa", "Follow-up result recorded for Blessing Eze"].map((item, index) => `<div class="activity"><span class="activity-dot">${["✓", "↗", "✦", "•"][index]}</span><div><p>${item}</p><small>${index + 1} day${index ? "s" : ""} ago</small></div></div>`).join("")}</div>` : `<div class="quick-actions"><button data-route="students">♙ &nbsp; View Students</button><button data-route="create-assessment">＋ &nbsp; Create Assessment</button><button data-route="results">▤ &nbsp; Review Results</button><button data-route="create-intervention">✦ &nbsp; Create Intervention</button></div>`}</div></section></div>`;
}

function emptyState(title, text, icon = "⌁") { return `<div class="empty-state"><div class="empty-icon">${icon}</div><strong>${title}</strong><span>${text}</span></div>`; }
function pageHeader(title, description, action) { return `<div class="page-heading"><div><h1>${title}</h1><p>${description}</p></div><div class="actions">${action || printButton()}</div></div>`; }
function printButton(label = "Print") { return `<button class="btn btn-secondary" data-action="print-page">▣ ${label}</button>`; }

function studentsView() {
  return `${pageHeader("Students", "View and manage students enrolled in internal assessment tracking.", state.role === "admin" ? '<button class="btn btn-primary" data-action="add-student">＋ Add Student</button>' : "")}<section class="card"><div class="filter-bar"><input class="search-input" id="student-search" placeholder="Search by student name or ID"><select id="student-class">${selectOptions(classes, "", true)}</select><select id="student-status">${selectOptions(["Active", "Inactive"], "", true)}</select><button class="btn btn-secondary btn-sm" data-action="clear-filters">Clear</button></div><div class="table-wrap" id="students-table"></div></section>`;
}
function renderStudentsTable() {
  const search = (document.getElementById("student-search")?.value || "").toLowerCase();
  const classFilter = document.getElementById("student-class")?.value || "";
  const status = document.getElementById("student-status")?.value || "";
  const rows = state.students.filter((s) => (!search || `${s.name} ${s.id}`.toLowerCase().includes(search)) && (!classFilter || s.className === classFilter) && (!status || s.status === status));
  document.getElementById("students-table").innerHTML = rows.length ? `<table><thead><tr><th>Student ID</th><th>Student Name</th><th>Class</th><th>Academic Session</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows.map((student) => `<tr><td class="primary-text">${student.id}</td><td>${student.name}</td><td>${student.className}</td><td>${student.session}</td><td>${badge(student.status)}</td><td><button class="link-action" data-route="student-details" data-id="${student.id}">View</button>${state.role === "admin" ? `<button class="link-action" data-action="edit-student" data-id="${student.id}">Edit</button>` : ""}</td></tr>`).join("")}</tbody></table>` : emptyState(search || classFilter || status ? "No search results" : "No students found", search || classFilter || status ? "Try changing or clearing your filters." : "Students will appear here after they are added.");
  bindGeneratedActions(document.getElementById("students-table"));
}

function studentDetailsView() {
  const student = studentById(pageParam());
  if (!student) return `${pageHeader("Student Details", "The requested student could not be found.", '<button class="btn btn-secondary" data-route="students">← Back to Students</button>')}${emptyState("Student not found", "Return to Students and select a valid student.")}`;
  const results = state.results.filter((r) => r.studentId === student.id);
  const studentInterventions = state.interventions.filter((i) => i.studentId === student.id);
  const average = results.length ? Math.round(results.reduce((sum, result) => sum + percent(result.score, assessmentById(result.assessmentId).max), 0) / results.length) : 0;
    return `<div class="page-heading"><div><button class="link-action" data-route="students">← Back to Students</button><h1 style="margin-top:12px">Student Details</h1></div><div class="actions">${printButton("Print Result")}${state.role === "admin" ? '<button class="btn btn-secondary" data-action="edit-student">Edit Student</button>' : ""}</div></div><section class="card"><div class="detail-hero"><div class="person"><div class="person-avatar">${initials(student.name)}</div><div><h2>${student.name}</h2><p>${student.id} · ${student.className} · ${student.session}</p></div></div>${badge(student.status)}</div><div class="card-body"><div class="info-grid"><div class="info-item"><span>Full Name</span><strong>${student.name}</strong></div><div class="info-item"><span>Student ID</span><strong>${student.id}</strong></div><div class="info-item"><span>Class</span><strong>${student.className}</strong></div><div class="info-item"><span>Gender</span><strong>${student.gender}</strong></div><div class="info-item"><span>Academic Session</span><strong>${student.session}</strong></div></div></div></section><div class="grid-2" style="margin-top:20px"><section class="card"><div class="card-header"><div><h3>Academic Performance Summary</h3><p>Based on recorded internal assessments</p></div></div><div class="card-body"><div class="report-summary"><div class="report-number"><span>Assessments</span><strong>${results.length}</strong></div><div class="report-number"><span>Average Percentage</span><strong>${average}%</strong></div><div class="report-number"><span>Subjects Needing Attention</span><strong>${new Set(results.filter((r) => percent(r.score, assessmentById(r.assessmentId).max) < threshold).map((r) => assessmentById(r.assessmentId).subject)).size}</strong></div></div></div></section><section class="card"><div class="card-header"><div><h3>Current Intervention Status</h3><p>Support tracking</p></div></div><div class="card-body">${studentInterventions.length ? studentInterventions.map((item) => `<div class="overview-row"><span>${item.subject} · ${item.topic}</span>${badge(item.status)}</div>`).join("") : emptyState("No intervention", "No active support record for this student.")}</div></section></div><section class="card" style="margin-top:20px"><div class="card-header"><div><h3>Recent Assessment Results</h3><p>Scores and performance status</p></div></div><div class="table-wrap"><table><thead><tr><th>Assessment</th><th>Subject</th><th>Type</th><th>Date</th><th>Score</th><th>Percentage</th><th>Status</th></tr></thead><tbody>${results.length ? results.map((result) => { const assessment = assessmentById(result.assessmentId); const pct = percent(result.score, assessment.max); return `<tr><td class="primary-text">${assessment.name}</td><td>${assessment.subject}</td><td>${assessment.type}</td><td>${fmtDate(assessment.date)}</td><td>${result.score} / ${assessment.max}</td><td>${pct}%</td><td>${badge(statusFor(pct))}</td></tr>`; }).join("") : `<tr><td colspan="7">${emptyState("No results recorded", "Assessment results will appear here once scores are saved.")}</td></tr>`}</tbody></table></div></section>${studentInterventions.length ? `<section class="card" style="margin-top:20px"><div class="card-header"><div><h3>Intervention Summary</h3><p>Action taken and follow-up plan</p></div></div><div class="table-wrap"><table><thead><tr><th>Subject</th><th>Topic</th><th>Reason</th><th>Action Taken</th><th>Start Date</th><th>Follow-Up Date</th><th>Status</th></tr></thead><tbody>${studentInterventions.map((item) => `<tr><td>${item.subject}</td><td>${item.topic}</td><td>${item.reason}</td><td>${item.action}</td><td>${fmtDate(item.start)}</td><td>${fmtDate(item.followUp)}</td><td>${badge(item.status)}</td></tr>`).join("")}</tbody></table></div></section>` : ""}`;
}

function assessmentsView() {
  return `${pageHeader("Assessments", "Create and manage internal assessments for assigned classes and subjects.", '<button class="btn btn-primary" data-route="create-assessment">＋ Create Assessment</button>')}<section class="card"><div class="filter-bar"><input class="search-input" id="assessment-search" placeholder="Search assessment name or subject"><select id="assessment-type">${selectOptions(assessmentTypes, "", true)}</select><select id="assessment-class">${selectOptions(classes, "", true)}</select><select id="assessment-status">${selectOptions(["Published", "Draft"], "", true)}</select><button class="btn btn-secondary btn-sm" data-action="clear-filters">Clear</button></div><div class="table-wrap" id="assessments-table"></div></section>`;
}
function renderAssessmentsTable() {
  const search = (document.getElementById("assessment-search")?.value || "").toLowerCase();
  const type = document.getElementById("assessment-type")?.value || "", className = document.getElementById("assessment-class")?.value || "", status = document.getElementById("assessment-status")?.value || "";
  const rows = state.assessments.filter((a) => (!search || `${a.name} ${a.subject}`.toLowerCase().includes(search)) && (!type || a.type === type) && (!className || a.className === className) && (!status || a.status === status));
  document.getElementById("assessments-table").innerHTML = rows.length ? `<table><thead><tr><th>Assessment Name</th><th>Type</th><th>Subject</th><th>Class</th><th>Session</th><th>Term</th><th>Date</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows.map((a) => `<tr><td class="primary-text">${a.name}</td><td>${a.type}</td><td>${a.subject}</td><td>${a.className}</td><td>${a.session}</td><td>${a.term}</td><td>${fmtDate(a.date)}</td><td>${badge(a.status)}</td><td><button class="link-action" data-route="record-scores" data-id="${a.id}">Record Scores</button><button class="link-action" data-action="view-assessment" data-id="${a.id}">View</button></td></tr>`).join("")}</tbody></table>` : emptyState(search || type || className || status ? "No search results" : "No assessments found", "Try changing or clearing your filters.");
  bindGeneratedActions(document.getElementById("assessments-table"));
}

function createAssessmentView() {
  return `${pageHeader("Create Assessment", "Set up an internal assessment before recording student scores.", '<button class="btn btn-secondary" data-route="assessments">Cancel</button>')}<section class="card form-card"><form id="assessment-form"><div class="form-grid"><div class="field"><label>Assessment Name *</label><input name="name" required placeholder="e.g. Algebra Class Test"></div><div class="field"><label>Assessment Type *</label><select name="type" required>${selectOptions(assessmentTypes)}</select></div><div class="field"><label>Subject *</label><select name="subject" required>${selectOptions(subjects)}</select></div><div class="field"><label>Class *</label><select name="className" required>${selectOptions(classes)}</select></div><div class="field"><label>Academic Session *</label><select name="session" required>${selectOptions([session], session)}</select></div><div class="field"><label>Term *</label><select name="term" required>${selectOptions(terms)}</select></div><div class="field"><label>Assessment Date *</label><input name="date" type="date" required></div><div class="field"><label>Maximum Score *</label><input name="max" type="number" min="1" required placeholder="e.g. 50"></div></div><div class="form-actions"><button class="btn btn-primary" type="submit">Save Assessment</button><button class="btn btn-secondary" type="button" data-route="assessments">Cancel</button></div></form></section>`;
}

function recordScoresView() {
  const assessment = assessmentById(pageParam());
  if (!assessment) return `${pageHeader("Record Scores", "Assessment not found.", '<button class="btn btn-secondary" data-route="assessments">← Back to Assessments</button>')}${emptyState("Assessment not found", "Select an assessment from the Assessments page.")}`;
  const roster = state.students.filter((student) => student.className === assessment.className);
  return `${pageHeader("Record Scores", "Enter valid scores. Percentages are calculated automatically.", '<button class="btn btn-secondary" data-route="assessments">← Back to Assessments</button>')}<div class="notice"><strong>Assessment:</strong> ${assessment.name} · ${assessment.subject} · ${assessment.className} · Maximum score: ${assessment.max}. Students below ${threshold}% will be marked as needing intervention.</div><section class="card"><div class="card-header"><div><h3>${assessment.name}</h3><p>${assessment.type} · ${assessment.term} · ${fmtDate(assessment.date)}</p></div><span class="badge badge-blue">${assessment.max} marks</span></div>${roster.length ? `<form id="scores-form"><div class="table-wrap"><table><thead><tr><th>Student ID</th><th>Student Name</th><th>Score / ${assessment.max}</th><th>Percentage</th><th>Performance Status</th></tr></thead><tbody>${roster.map((student) => { const previous = state.results.find((r) => r.studentId === student.id && r.assessmentId === assessment.id); const score = previous?.score ?? ""; return `<tr><td class="primary-text">${student.id}</td><td>${student.name}</td><td><input class="score-input" name="${student.id}" type="number" min="0" max="${assessment.max}" step="0.5" value="${score}" data-max="${assessment.max}"></td><td class="score-percent" data-student="${student.id}">${score === "" ? "—" : `${percent(score, assessment.max)}%`}</td><td class="score-status" data-student="${student.id}">${score === "" ? "—" : badge(statusFor(percent(score, assessment.max)))}</td></tr>`; }).join("")}</tbody></table></div><div class="form-actions" style="padding:20px"><button class="btn btn-primary" type="submit">Save Scores</button><button class="btn btn-secondary" type="button" data-route="assessments">Cancel</button></div></form>` : emptyState("No students in this class", "Add students to this class before recording scores.")}</section>`;
}

function resultsView() {
  return `${pageHeader("Results & Performance", "Review assessment results and identify students who may need support.", printButton("Print Results"))}<section class="card"><div class="filter-bar"><input class="search-input" id="results-search" placeholder="Search student, ID, subject or assessment"><select id="results-class">${selectOptions(classes, "", true)}</select><select id="results-subject">${selectOptions(subjects, "", true)}</select><select id="results-status"><option value="">All statuses</option><option>Needs Intervention</option><option>Satisfactory</option></select><button class="btn btn-secondary btn-sm" data-action="clear-filters">Clear</button></div><div id="results-content"></div></section>`;
}
function renderResults() {
  const search = (document.getElementById("results-search")?.value || "").toLowerCase(), className = document.getElementById("results-class")?.value || "", subject = document.getElementById("results-subject")?.value || "", status = document.getElementById("results-status")?.value || "";
  const rows = state.results.map((result) => ({ result, student: studentById(result.studentId), assessment: assessmentById(result.assessmentId), pct: percent(result.score, assessmentById(result.assessmentId).max) })).filter((item) => (!search || `${item.student.name} ${item.student.id} ${item.assessment.subject} ${item.assessment.name}`.toLowerCase().includes(search)) && (!className || item.student.className === className) && (!subject || item.assessment.subject === subject) && (!status || statusFor(item.pct) === status));
  const all = state.results.map((r) => percent(r.score, assessmentById(r.assessmentId).max));
  document.getElementById("results-content").innerHTML = `<div class="card-body"><div class="report-summary"><div class="report-number"><span>Total Results</span><strong>${state.results.length}</strong></div><div class="report-number"><span>Average Percentage</span><strong>${all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : 0}%</strong></div><div class="report-number"><span>Needing Intervention</span><strong>${all.filter((value) => value < threshold).length}</strong></div></div></div>${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Student</th><th>Class</th><th>Subject</th><th>Assessment</th><th>Score</th><th>Percentage</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows.map(({ result, student, assessment, pct }) => `<tr><td><span class="primary-text">${student.name}</span><br><span class="muted">${student.id}</span></td><td>${student.className}</td><td>${assessment.subject}</td><td>${assessment.name}</td><td>${result.score} / ${assessment.max}</td><td>${pct}%</td><td>${badge(statusFor(pct))}</td><td><button class="link-action" data-route="student-details" data-id="${student.id}">View Student</button>${pct < threshold ? `<button class="link-action" data-route="create-intervention" data-student="${student.id}" data-assessment="${assessment.id}">Identify</button>` : ""}</td></tr>`).join("")}</tbody></table></div>` : emptyState(search || className || subject || status ? "No filter results" : "No results recorded", search || className || subject || status ? "Try changing or clearing your filters." : "Results will appear after scores are recorded.")}`;
  bindGeneratedActions(document.getElementById("results-content"));
}

function interventionsView() {
  return `${pageHeader("Interventions", "Track academic support actions from low result to outcome.", '<button class="btn btn-primary" data-route="create-intervention">＋ Create Intervention</button>')}<section class="card"><div class="filter-bar"><input class="search-input" id="intervention-search" placeholder="Search student, ID, subject or topic"><select id="intervention-class">${selectOptions(classes, "", true)}</select><select id="intervention-status">${selectOptions(["Active", "Follow-up Due", "Completed"], "", true)}</select><select id="intervention-subject">${selectOptions(subjects, "", true)}</select><button class="btn btn-secondary btn-sm" data-action="clear-filters">Clear</button></div><div id="interventions-content"></div></section>`;
}
function renderInterventions() {
  const search = (document.getElementById("intervention-search")?.value || "").toLowerCase(), className = document.getElementById("intervention-class")?.value || "", status = document.getElementById("intervention-status")?.value || "", subject = document.getElementById("intervention-subject")?.value || "";
  const rows = state.interventions.filter((item) => { const student = studentById(item.studentId); return (!search || `${student.name} ${student.id} ${item.subject} ${item.topic}`.toLowerCase().includes(search)) && (!className || student.className === className) && (!status || item.status === status) && (!subject || item.subject === subject); });
  document.getElementById("interventions-content").innerHTML = rows.length ? `<div class="table-wrap"><table><thead><tr><th>Student</th><th>Class</th><th>Subject</th><th>Topic</th><th>Action Taken</th><th>Follow-Up</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows.map((item) => { const student = studentById(item.studentId); return `<tr><td><span class="primary-text">${student.name}</span><br><span class="muted">${student.id}</span></td><td>${student.className}</td><td>${item.subject}</td><td>${item.topic}</td><td>${item.action}</td><td>${fmtDate(item.followUp)}</td><td>${badge(item.status)}</td><td>${item.status !== "Completed" ? `<button class="link-action" data-route="follow-up" data-id="${item.id}">Follow-Up</button>` : ""}<button class="link-action" data-route="student-details" data-id="${student.id}">View</button></td></tr>`; }).join("")}</tbody></table></div>` : emptyState(search || className || status || subject ? "No filter results" : "No interventions found", "Try changing or clearing your filters.");
  bindGeneratedActions(document.getElementById("interventions-content"));
}

function createInterventionView() {
  const selectedStudent = new URLSearchParams(location.hash.split("?")[1] || "").get("student") || "";
  return `${pageHeader("Create Intervention", "Record the action that will support a student’s weak area.", '<button class="btn btn-secondary" data-route="interventions">Cancel</button>')}<section class="card form-card"><form id="intervention-form"><div class="form-grid"><div class="field"><label>Student *</label><select name="studentId" required>${selectOptions(state.students.map((s) => `${s.id} — ${s.name}`), selectedStudent ? `${selectedStudent} — ${studentById(selectedStudent)?.name}` : "")}</select></div><div class="field"><label>Subject *</label><select name="subject" required>${selectOptions(subjects)}</select></div><div class="field"><label>Topic *</label><input name="topic" required placeholder="e.g. Quadratic Equations"></div><div class="field"><label>Triggering Assessment Result</label><select name="assessmentId">${selectOptions(state.assessments.map((a) => `${a.id} — ${a.name}`))}</select></div><div class="field"><label>Previous Percentage</label><input name="previous" type="number" min="0" max="100" placeholder="e.g. 40"></div><div class="field"><label>Reason for Intervention *</label><select name="reason" required>${selectOptions(["Low assessment score", "Difficulty understanding a topic", "Repeated poor performance", "Weak understanding of a subject area", "Needs additional practice"])}</select></div><div class="field full"><label>Actual Action Taken *</label><select name="action" required>${selectOptions(["Extra lesson", "One-on-one explanation", "Practice exercises", "Revision session", "Additional assignment", "Topic re-teaching", "Peer support"])}</select></div><div class="field"><label>Assigned Teacher *</label><input name="teacher" required value="${state.user.name}"></div><div class="field"><label>Status *</label><select name="status" required>${selectOptions(["Active", "Follow-up Due", "Completed"], "Active")}</select></div><div class="field"><label>Start Date *</label><input name="start" type="date" required></div><div class="field"><label>Follow-Up Date *</label><input name="followUp" type="date" required></div><div class="field full"><label>Notes</label><textarea name="notes" placeholder="Add a short note about the support plan"></textarea></div></div><div class="form-actions"><button class="btn btn-primary" type="submit">Save Intervention</button><button class="btn btn-secondary" type="button" data-route="interventions">Cancel</button></div></form></section>`;
}

function followUpView() {
  return `${pageHeader("Follow-Up & Improvement", "Record follow-up assessment results and compare them with the previous percentage.", "")}<section class="card"><div class="filter-bar"><input class="search-input" id="follow-search" placeholder="Search student, ID, subject or topic"><select id="follow-status">${selectOptions(["Active", "Follow-up Due", "Completed"], "", true)}</select><select id="follow-outcome">${selectOptions(["Improved", "Needs Further Support", "No Significant Improvement"], "", true)}</select><button class="btn btn-secondary btn-sm" data-action="clear-filters">Clear</button></div><div id="follow-content"></div></section>`;
}
function renderFollowUps() {
  const search = (document.getElementById("follow-search")?.value || "").toLowerCase(), status = document.getElementById("follow-status")?.value || "", outcome = document.getElementById("follow-outcome")?.value || "";
  const rows = state.interventions.filter((item) => { const student = studentById(item.studentId); const follow = state.followUps.find((f) => f.interventionId === item.id); return (!search || `${student.name} ${student.id} ${item.subject} ${item.topic}`.toLowerCase().includes(search)) && (!status || item.status === status) && (!outcome || follow?.outcome === outcome); });
  document.getElementById("follow-content").innerHTML = rows.length ? `<div class="table-wrap"><table><thead><tr><th>Student</th><th>Class</th><th>Subject</th><th>Topic</th><th>Previous</th><th>Follow-Up</th><th>Improvement</th><th>Outcome</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows.map((item) => { const student = studentById(item.studentId), follow = state.followUps.find((f) => f.interventionId === item.id), improvement = follow ? follow.score - item.previous : null; return `<tr><td><span class="primary-text">${student.name}</span><br><span class="muted">${student.id}</span></td><td>${student.className}</td><td>${item.subject}</td><td>${item.topic}</td><td>${item.previous}%</td><td>${follow ? `${follow.score}%` : "—"}</td><td>${improvement === null ? "—" : `<strong style="color:${improvement >= 0 ? "var(--green)" : "var(--red)"}">${improvement > 0 ? "+" : ""}${improvement} percentage points</strong>`}</td><td>${follow ? badge(follow.outcome) : "—"}</td><td>${badge(item.status)}</td><td>${item.status !== "Completed" ? `<button class="link-action" data-action="record-follow-up" data-id="${item.id}">Record</button>` : ""}<button class="link-action" data-route="student-details" data-id="${student.id}">View</button></td></tr>`; }).join("")}</tbody></table></div>` : emptyState(search || status || outcome ? "No filter results" : "No follow-up records", "Follow-up information will appear after an intervention is reviewed.");
  bindGeneratedActions(document.getElementById("follow-content"));
}

function reportsView() {
  const avg = state.results.length ? Math.round(state.results.reduce((sum, r) => sum + percent(r.score, assessmentById(r.assessmentId).max), 0) / state.results.length) : 0;
  return `${pageHeader("Reports", "Simple reports for performance, intervention activity, and improvement.", "")}<div class="report-stack"><section class="card report-filters"><div class="card-header"><div><h3>Report Filters</h3><p>Apply filters to review a focused report view.</p></div><div class="actions"><button class="btn btn-primary btn-sm" data-action="apply-report">Apply Filters</button><button class="btn btn-secondary btn-sm" data-action="clear-filters">Clear Filters</button></div></div><div class="card-body"><div class="form-grid"><div class="field"><label>Academic Session</label><select>${selectOptions([session], session)}</select></div><div class="field"><label>Term</label><select>${selectOptions(terms, "", true)}</select></div><div class="field"><label>Class</label><select>${selectOptions(classes, "", true)}</select></div><div class="field"><label>Subject</label><select>${selectOptions(subjects, "", true)}</select></div><div class="field"><label>Assessment Type</label><select>${selectOptions(assessmentTypes, "", true)}</select></div></div></div></section><section class="card"><div class="card-header"><div><h3>Student Performance</h3><p>Average result across recorded assessments</p></div><button class="section-link" data-route="results">View Details →</button></div><div class="card-body"><div class="report-summary"><div class="report-number"><span>Results Recorded</span><strong>${state.results.length}</strong></div><div class="report-number"><span>Average Percentage</span><strong>${avg}%</strong></div><div class="report-number"><span>Needs Intervention</span><strong>${state.results.filter((r) => percent(r.score, assessmentById(r.assessmentId).max) < threshold).length}</strong></div></div></div></section><div class="grid-2"><section class="card"><div class="card-header"><div><h3>Students Needing Intervention</h3><p>Performance below ${threshold}%</p></div></div><div class="table-wrap"><table><thead><tr><th>Student</th><th>Subject</th><th>Topic</th><th>Percentage</th><th>Status</th></tr></thead><tbody>${state.interventions.map((item) => { const student = studentById(item.studentId); return `<tr><td class="primary-text">${student.name}</td><td>${item.subject}</td><td>${item.topic}</td><td>${item.previous}%</td><td>${badge(item.status)}</td></tr>`; }).join("")}</tbody></table></div></section><section class="card"><div class="card-header"><div><h3>Improvement After Intervention</h3><p>Follow-up percentage comparison</p></div></div><div class="table-wrap"><table><thead><tr><th>Student</th><th>Previous</th><th>Follow-Up</th><th>Improvement</th></tr></thead><tbody>${state.followUps.map((follow) => { const item = interventionById(follow.interventionId); const student = studentById(item.studentId); const improvement = follow.score - item.previous; return `<tr><td class="primary-text">${student.name}</td><td>${item.previous}%</td><td>${follow.score}%</td><td style="color:var(--green);font-weight:700">+${improvement} pts</td></tr>`; }).join("")}</tbody></table></div></section></div><section class="card"><div class="card-header"><div><h3>Intervention Summary</h3><p>Current support activity</p></div></div><div class="card-body"><div class="overview-list"><div class="overview-row"><span>Active Interventions</span><strong>${state.interventions.filter((i) => i.status === "Active").length}</strong></div><div class="overview-row"><span>Follow-up Due</span><strong>${state.interventions.filter((i) => i.status === "Follow-up Due").length}</strong></div><div class="overview-row"><span>Completed Interventions</span><strong>${state.interventions.filter((i) => i.status === "Completed").length}</strong></div></div></div></section></div>`;
}

function simpleDirectoryView(type) {
  const baseData = type === "teachers" ? [["Amina Bello", "Super Admin", "School-wide", "All classes"], ["Ngozi Eze", "Teacher", "English Language", "SSS1, SSS2"], ["Musa Ibrahim", "Teacher", "Economics, Government", "SSS2, SSS3"], ["Chinedu Okafor", "Teacher", "Mathematics, Chemistry", "SSS1, SSS2, SSS3"]] : type === "classes" ? classes.map((item, index) => [item, `${index + 1} class groups`, "2025/2026", String(state.students.filter((student) => student.className === item).length)]) : subjects.slice(0, 8).map((item, index) => [item, `${index + 1} topics`, index % 2 ? "Ngozi Eze" : "Chinedu Okafor", "Active"]);
  const data = baseData.concat(state.directoryAdds[type]);
  const headers = type === "teachers" ? ["Name", "Role", "Subjects", "Assigned Classes"] : type === "classes" ? ["Class", "Groups", "Academic Session", "Students"] : ["Subject", "Topics", "Subject Lead", "Status"];
  return `${pageHeader(type === "teachers" ? "Teachers" : type === "classes" ? "Classes" : "Subjects & Topics", "Manage the academic structure used by assessments and interventions.", `<button class="btn btn-primary" data-action="add-directory" data-directory="${type}">＋ Add ${type === "teachers" ? "Teacher" : type === "classes" ? "Class" : "Subject"}</button>`)}<section class="card"><div class="filter-bar"><input class="search-input" id="directory-search" placeholder="Search ${type === "teachers" ? "teachers" : type === "classes" ? "classes" : "subjects"}..."><button class="btn btn-secondary btn-sm" data-action="clear-directory">Clear</button></div><div class="table-wrap"><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}<th>Action</th></tr></thead><tbody>${data.map((row) => `<tr>${row.map((cell, index) => `<td class="${index === 0 ? "primary-text" : ""}">${cell}</td>`).join("")}<td><button class="link-action" data-action="view-directory" data-directory="${type}" data-name="${esc(row[0])}">View</button><button class="link-action" data-action="edit-directory" data-directory="${type}" data-name="${esc(row[0])}">Edit</button></td></tr>`).join("")}</tbody></table></div></section>`;
}

function render() {
  if (!sessionStorage.getItem("ait-auth")) { app.innerHTML = loginView(); return; }
  const page = pageName();
  if (state.role === "teacher" && ["teachers", "classes", "subjects"].includes(page)) {
    go("dashboard");
    return;
  }
  let content;
  if (page === "dashboard") content = dashboardView();
  else if (page === "students") content = studentsView();
  else if (page === "student-details") content = studentDetailsView();
  else if (page === "assessments") content = assessmentsView();
  else if (page === "create-assessment") content = createAssessmentView();
  else if (page === "record-scores") content = recordScoresView();
  else if (page === "results") content = resultsView();
  else if (page === "interventions") content = interventionsView();
  else if (page === "create-intervention") content = createInterventionView();
  else if (page === "follow-up") content = followUpView();
  else if (page === "reports") content = reportsView();
  else if (["teachers", "classes", "subjects"].includes(page)) content = simpleDirectoryView(page);
  else { go("dashboard"); return; }
  app.innerHTML = shell(content);
  bindPage();
}

function bindPage() {
  const page = pageName();
  document.querySelectorAll("[data-route]").forEach((element) => element.addEventListener("click", () => {
    const route = element.dataset.route;
    if (route === "student-details") go(`student-details/${element.dataset.id}`);
    else if (route === "record-scores") go(`record-scores/${element.dataset.id}`);
    else if (route === "create-intervention" && element.dataset.student) go(`create-intervention?student=${element.dataset.student}`);
    else go(route);
  }));
  document.querySelectorAll("[data-action]").forEach((element) => element.addEventListener("click", () => handleAction(element.dataset.action, element)));
  if (page === "students") { ["student-search", "student-class", "student-status"].forEach((id) => document.getElementById(id)?.addEventListener("input", renderStudentsTable)); renderStudentsTable(); }
  if (page === "assessments") { ["assessment-search", "assessment-type", "assessment-class", "assessment-status"].forEach((id) => document.getElementById(id)?.addEventListener("input", renderAssessmentsTable)); renderAssessmentsTable(); }
  if (page === "results") { ["results-search", "results-class", "results-subject", "results-status"].forEach((id) => document.getElementById(id)?.addEventListener("input", renderResults)); renderResults(); }
  if (page === "interventions") { ["intervention-search", "intervention-class", "intervention-status", "intervention-subject"].forEach((id) => document.getElementById(id)?.addEventListener("input", renderInterventions)); renderInterventions(); }
  if (page === "follow-up") { ["follow-search", "follow-status", "follow-outcome"].forEach((id) => document.getElementById(id)?.addEventListener("input", renderFollowUps)); renderFollowUps(); }
  if (["teachers", "classes", "subjects"].includes(page)) {
    document.getElementById("directory-search")?.addEventListener("input", (event) => {
      const query = event.target.value.toLowerCase();
      document.querySelectorAll("#directory-search + button, #directory-search").forEach(() => {});
      document.querySelectorAll(".table-wrap tbody tr").forEach((row) => { row.hidden = !row.textContent.toLowerCase().includes(query); });
    });
  }
  document.getElementById("assessment-form")?.addEventListener("submit", saveAssessment);
  document.getElementById("scores-form")?.addEventListener("submit", saveScores);
  document.getElementById("intervention-form")?.addEventListener("submit", saveIntervention);
  document.querySelectorAll(".score-input").forEach((input) => input.addEventListener("input", updateScoreRow));
}

function handleAction(action, element) {
  if (action === "sign-out") { sessionStorage.removeItem("ait-auth"); sessionStorage.removeItem("ait-role"); authView = "login"; render(); }
  if (action === "print-page") { window.print(); }
  if (action === "toggle-password") {
    const passwordInput = document.getElementById("login-password") || document.getElementById("register-password");
    if (!passwordInput) return;
    const visible = passwordInput.type === "text";
    passwordInput.type = visible ? "password" : "text";
    element.textContent = "👁";
    element.classList.toggle("is-visible", !visible);
    element.setAttribute("aria-label", visible ? "Show password" : "Hide password");
    element.title = visible ? "Show password" : "Hide password";
  }
  if (state.role === "teacher" && ["add-student", "edit-student", "add-directory", "edit-directory"].includes(action)) return showToast("This feature is available to Super Admins only.");
  if (action === "clear-filters") { document.querySelectorAll(".filter-bar input").forEach((input) => { input.value = ""; }); document.querySelectorAll(".filter-bar select, .report-filters select").forEach((select) => { select.value = ""; }); bindPage(); }
  if (action === "add-student") openStudentModal();
  if (action === "edit-student") openStudentModal(studentById(element.dataset.id || pageParam()));
  if (action === "view-assessment") { const a = assessmentById(element.dataset.id); showToast(`${a.name} · ${a.subject} · ${a.max} marks`); }
  if (action === "record-follow-up") openFollowUpModal(interventionById(element.dataset.id));
  if (action === "not-available") showToast("This demo keeps this directory read-only.");
  if (action === "add-directory") openDirectoryModal(element.dataset.directory);
  if (action === "edit-directory") openDirectoryModal(element.dataset.directory, element.dataset.name);
  if (action === "view-directory") showToast(`${element.dataset.name} details opened.`);
  if (action === "clear-directory") { const input = document.getElementById("directory-search"); if (input) input.value = ""; document.querySelectorAll(".table-wrap tbody tr").forEach((row) => { row.hidden = false; }); }
  if (action === "apply-report") showToast("Report filters applied.");
  if (action === "show-register") { authView = "register"; render(); }
  if (action === "forgot-password") { authView = "forgot"; render(); }
  if (action === "back-to-login") { authView = "login"; render(); }
}

function saveAssessment(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  if (!data.name || !data.type || !data.subject || !data.className || !data.date || Number(data.max) <= 0) return showToast("Please complete all required fields.");
  state.assessments.push({ id: `AS-${String(state.assessments.length + 1).padStart(3, "0")}`, ...data, max: Number(data.max), status: "Draft" });
  showToast("Assessment saved successfully."); go("assessments");
}
function saveScores(event) {
  event.preventDefault();
  const assessment = assessmentById(pageParam()), data = Object.fromEntries(new FormData(event.target));
  const roster = state.students.filter((student) => student.className === assessment.className);
  for (const student of roster) { const raw = data[student.id]; if (raw === "" || raw === undefined || Number(raw) < 0 || Number(raw) > assessment.max || Number.isNaN(Number(raw))) return showToast(`Enter a valid score for ${student.name}.`); }
  roster.forEach((student) => { const existing = state.results.find((result) => result.studentId === student.id && result.assessmentId === assessment.id); if (existing) existing.score = Number(data[student.id]); else state.results.push({ id: `RS-${String(state.results.length + 1).padStart(3, "0")}`, assessmentId: assessment.id, studentId: student.id, score: Number(data[student.id]) }); });
  assessment.status = "Published"; showToast("Scores saved successfully."); go("results");
}
function saveIntervention(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  const studentId = data.studentId.split(" ")[0];
  if (!data.studentId || !data.subject || !data.topic || !data.reason || !data.action || !data.teacher || !data.start || !data.followUp) return showToast("Please complete all required fields.");
  if (data.followUp < data.start) return showToast("Follow-Up Date cannot be earlier than Start Date.");
  state.interventions.push({ id: `IN-${String(state.interventions.length + 1).padStart(3, "0")}`, ...data, studentId, previous: Number(data.previous) || 0 });
  showToast("Intervention created successfully."); go("interventions");
}
function updateScoreRow(event) {
  const input = event.target, value = input.value, max = Number(input.dataset.max), pctCell = document.querySelector(`.score-percent[data-student="${input.name}"]`), statusCell = document.querySelector(`.score-status[data-student="${input.name}"]`);
  input.classList.toggle("invalid", value !== "" && (Number(value) < 0 || Number(value) > max));
  pctCell.textContent = value === "" ? "—" : `${percent(value, max)}%`; statusCell.innerHTML = value === "" ? "—" : badge(statusFor(percent(value, max)));
}

function openDirectoryModal(type, existingName = "") {
  const labels = { teachers: ["Teacher", "Full Name", "Subject Area", "Assigned Classes"], classes: ["Class", "Class Name", "Academic Session", "Student capacity"], subjects: ["Subject", "Subject Name", "Subject Lead", "Topic count"] };
  const [singular, nameLabel, detailLabel, extraLabel] = labels[type];
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `<div class="modal"><div class="modal-header"><h3>${existingName ? "Edit" : "Add"} ${singular}</h3><button class="modal-close" data-close>×</button></div><div class="modal-body"><form id="directory-form"><div class="field"><label>${nameLabel} *</label><input name="name" required value="${esc(existingName)}"></div><div class="field"><label>${detailLabel} *</label><input name="detail" required placeholder="${type === "teachers" ? "e.g. Mathematics, Physics" : type === "classes" ? "e.g. SSS2" : "e.g. Amina Bello"}"></div><div class="field"><label>${extraLabel}</label><input name="extra" placeholder="${type === "teachers" ? "e.g. SSS1, SSS2" : type === "classes" ? "e.g. 40" : "e.g. 8"}"></div><div class="form-actions"><button class="btn btn-primary" type="submit">Save ${singular}</button><button class="btn btn-secondary" type="button" data-close>Cancel</button></div></form></div></div>`;
  document.body.appendChild(modal);
  modal.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => modal.remove()));
  modal.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    if (existingName) {
      const item = state.directoryAdds[type].find((entry) => entry[0] === existingName);
      if (item) { item[0] = data.name; item[1] = data.detail; item[2] = data.extra || item[2]; }
      else {
        const row = type === "teachers" ? [data.name, "Teacher", data.detail, data.extra || "Assigned classes pending"] : type === "classes" ? [data.name, "1 class group", session, data.extra || "0"] : [data.name, data.extra || "0 topics", data.detail, "Active"];
        state.directoryAdds[type].push(row);
      }
      showToast(`${singular} updated successfully.`);
    } else {
      const row = type === "teachers" ? [data.name, "Teacher", data.detail, data.extra || "Assigned classes pending"] : type === "classes" ? [data.name, "1 class group", session, data.extra || "0"] : [data.name, data.extra || "0 topics", data.detail, "Active"];
      state.directoryAdds[type].push(row);
      showToast(`${singular} added successfully.`);
    }
    modal.remove();
    render();
  });
}

function openStudentModal(student = null) {
  const modal = document.createElement("div"); modal.className = "modal-backdrop"; modal.innerHTML = `<div class="modal"><div class="modal-header"><h3>${student ? "Edit Student" : "Add Student"}</h3><button class="modal-close" data-close>×</button></div><div class="modal-body"><form id="student-modal-form"><div class="form-grid"><div class="field"><label>Student ID *</label><input name="id" required value="${student?.id || `ST-2025-00${state.students.length + 1}`}" ${student ? "readonly" : ""}></div><div class="field"><label>Full Name *</label><input name="name" required value="${student?.name || ""}"></div><div class="field"><label>Class *</label><select name="className" required>${selectOptions(classes, student?.className)}</select></div><div class="field"><label>Academic Session *</label><select name="session" required>${selectOptions([session], student?.session || session)}</select></div><div class="field"><label>Gender</label><select name="gender">${selectOptions(["Female", "Male"], student?.gender || "")}</select></div><div class="field"><label>Status</label><select name="status">${selectOptions(["Active", "Inactive"], student?.status || "Active")}</select></div></div><div class="form-actions"><button class="btn btn-primary" type="submit">Save Student</button><button class="btn btn-secondary" type="button" data-close>Cancel</button></div></form></div></div>`; document.body.appendChild(modal); modal.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => modal.remove())); modal.querySelector("form").addEventListener("submit", (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)); if (student) Object.assign(student, data); else state.students.push(data); modal.remove(); render(); showToast(student ? "Student updated successfully." : "Student added successfully."); });
}
function openFollowUpModal(intervention) {
  const student = studentById(intervention.studentId), modal = document.createElement("div"); modal.className = "modal-backdrop"; modal.innerHTML = `<div class="modal"><div class="modal-header"><h3>Record Follow-Up</h3><button class="modal-close" data-close>×</button></div><div class="modal-body"><div class="notice"><strong>${student.name}</strong> · ${intervention.subject} · Previous percentage: ${intervention.previous}%</div><form id="follow-modal-form"><div class="field"><label>Follow-Up Percentage *</label><input name="score" type="number" min="0" max="100" required placeholder="Enter percentage"></div><div class="field"><label>Outcome *</label><select name="outcome" required>${selectOptions(["Improved", "Needs Further Support", "No Significant Improvement"])}</select></div><div class="field"><label>Follow-Up Date *</label><input name="date" type="date" required></div><div class="form-actions"><button class="btn btn-primary" type="submit">Save Follow-Up</button><button class="btn btn-secondary" type="button" data-close>Cancel</button></div></form></div></div>`; document.body.appendChild(modal); modal.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => modal.remove())); modal.querySelector("form").addEventListener("submit", (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)); const score = Number(data.score); if (score < 0 || score > 100) return showToast("Enter a percentage between 0 and 100."); state.followUps = state.followUps.filter((item) => item.interventionId !== intervention.id); state.followUps.push({ interventionId: intervention.id, score, outcome: data.outcome, date: data.date }); intervention.status = "Completed"; intervention.followUpScore = score; intervention.outcome = data.outcome; modal.remove(); render(); showToast("Follow-up result saved successfully."); });
}

window.addEventListener("hashchange", render);
document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (target && !sessionStorage.getItem("ait-auth")) handleAction(target.dataset.action, target);
});
document.addEventListener("submit", (event) => {
  if (event.target.id === "login-form") {
    event.preventDefault();
    const email = event.target.querySelector("#login-email").value.trim().toLowerCase();
    const password = event.target.querySelector("#login-password").value;
    const accounts = getAllAccounts();
    const account = accounts[email];
    if (!account) return showToast("Use a registered school email address.");
    if (account.password !== password) return showToast("Incorrect password. Please try again.");
    state.role = account.role;
    state.user = account.user;
    sessionStorage.setItem("ait-auth", "true");
    sessionStorage.setItem("ait-role", state.role);
    go("dashboard");
    render();
  }
  if (event.target.id === "teacher-register-form") {
    event.preventDefault();
    const form = event.target;
    const name = form.querySelector("#register-name").value.trim();
    const email = form.querySelector("#register-email").value.trim().toLowerCase();
    const password = form.querySelector("#register-password").value;
    const subject = form.querySelector("#register-subject").value.trim();
    const classesValue = form.querySelector("#register-classes").value.trim();
    const accounts = getAllAccounts();
    if (!name || !email || !password || !subject) return showToast("Please complete all required teacher details.");
    if (accounts[email]) return showToast("That email is already registered.");
    accounts[email] = {
      role: "teacher",
      password,
      user: { name, role: "Teacher", initials: initials(name) }
    };
    persistAccounts(accounts);
    if (!state.directoryAdds.teachers) state.directoryAdds.teachers = [];
    state.directoryAdds.teachers.push([name, "Teacher", subject, classesValue || "Assigned classes pending"]);
    authView = "login";
    form.reset();
    showToast("Teacher account created successfully.");
    render();
  }
  if (event.target.id === "forgot-password-form") {
    event.preventDefault();
    const email = event.target.querySelector("#reset-email").value.trim();
    if (!email) return showToast("Enter your username or email address.");
    showToast(`If an account exists for ${email}, a reset link has been sent.`);
    event.target.reset();
  }
});
if (sessionStorage.getItem("ait-auth")) {
  const accounts = getAllAccounts();
  state.role = sessionStorage.getItem("ait-role") === "teacher" ? "teacher" : "admin";
  const currentUser = Object.values(accounts).find((account) => account.role === state.role);
  state.user = currentUser ? currentUser.user : { name: "Oduale Samson", role: "Super Admin", initials: "OS" };
}
render();
