const appConfig = {
  schoolName: "Assessment-to-Intervention Tracking System",
  shortSchoolName: "AIT",
  academicSession: "2025/2026",
  assessmentThreshold: 60
};

const classes = ["SSS1", "SSS2", "SSS3"];
let subjects = [];
const assessmentTypes = ["Class Test", "Quiz", "Assignment", "Mid-Term Test", "School Examination"];
const terms = ["First Term", "Second Term", "Third Term"];
const session = appConfig.academicSession;
const threshold = appConfig.assessmentThreshold;

const state = {
  role: "admin",
  user: { name: "", role: "Super Admin", initials: "SA" },
  students: [],
  assessments: [],
  results: [],
  interventions: [],
  followUps: [],
  users: [],
  subjects: [],
  reportFilters: { session: "", term: "", className: "", subject: "", type: "" }
};
let authView = "login";
let needsAdminSetup = null;
let setupStatusError = false;
let rosterRefreshTimer = null;
const API_BASE = "http://localhost:5000/api";
const apiRequest = async (path, options = {}) => {
  const token = sessionStorage.getItem("ait-token");
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || "Request failed.");
  }
  return response.status === 204 ? null : response.json();
};
const checkSetupStatus = async () => {
  try {
    const setup = await apiRequest("/auth/setup-status");
    needsAdminSetup = Boolean(setup.needsAdminSetup);
    setupStatusError = false;
  } catch (error) {
    needsAdminSetup = null;
    setupStatusError = true;
    console.warn("Could not check initial setup status:", error);
  }
  render();
};
const normalizeRole = (role) => String(role || "").toUpperCase() === "ADMIN" ? "admin" : "teacher";
const fallbackUser = { name: "Authenticated User", role: "Super Admin", initials: "AU" };
const mapStudent = (student) => ({
  id: student.studentId || student.id,
  dbId: student.id,
  name: student.name,
  className: student.className,
  teacherId: student.teacherId || null,
  teacherName: student.teacher?.name || "Unassigned",
  gender: student.gender || "Not specified",
  status: student.status || "Active",
  session: student.session || session
});
const loadRealData = async () => {
  if (!sessionStorage.getItem("ait-token")) return;
  try {
    let data = await apiRequest("/dashboard");
    if (String(data.user?.role || "").toUpperCase() === "ADMIN" && !data.subjects?.length) {
      try {
        await apiRequest("/subjects/standard", { method: "POST" });
        data = await apiRequest("/dashboard");
      } catch (error) {
        console.warn("Could not load the standard subject catalog:", error);
      }
    }
    state.role = normalizeRole(data.user?.role || state.role || "admin");
    state.user = data.user ? {
      id: data.user.id,
      name: data.user.name,
      role: state.role === "admin" ? "Super Admin" : "Teacher",
      initials: initials(data.user.name)
    } : fallbackUser;
    state.students = Array.isArray(data.students) ? data.students.map(mapStudent) : [];
    state.assessments = Array.isArray(data.assessments) ? data.assessments.map((assessment) => ({
      id: assessment.id,
      name: assessment.name,
      type: assessment.type,
      subject: assessment.subject,
      className: assessment.className,
      session: assessment.session,
      term: assessment.term,
      date: assessment.date ? assessment.date.slice(0, 10) : "",
      max: assessment.maxScore,
      status: assessment.status || "Draft"
    })) : [];
    state.results = Array.isArray(data.results) ? data.results.map((result) => ({
      id: result.id,
      assessmentId: result.assessmentId,
      studentId: result.student?.studentId || result.studentId,
      score: Number(result.score)
    })) : [];
    state.interventions = Array.isArray(data.interventions) ? data.interventions.map((item) => ({
      id: item.id,
      studentId: item.student?.studentId || item.studentId,
      subject: item.subject,
      topic: item.topic,
      assessmentId: item.assessmentId,
      previous: Number(item.previous || 0),
      reason: item.reason,
      action: item.action,
      teacher: item.teacher ? item.teacher.name || "Teacher" : "Teacher",
      start: item.start ? item.start.slice(0, 10) : "",
      followUp: item.followUp ? item.followUp.slice(0, 10) : "",
      status: item.status || "Active",
      notes: item.notes || "",
      followUpScore: item.followUpScore,
      outcome: item.outcome || ""
    })) : [];
    state.followUps = Array.isArray(data.followUps) ? data.followUps.map((follow) => ({
      interventionId: follow.interventionId,
      score: Number(follow.score),
      outcome: follow.outcome,
      date: follow.date ? follow.date.slice(0, 10) : ""
    })) : [];
    state.users = Array.isArray(data.users) ? data.users : [];
    state.subjects = Array.isArray(data.subjects) ? data.subjects : [];
    subjects = state.subjects.map((subject) => subject.name);
    if (!sessionStorage.getItem("ait-auth")) sessionStorage.setItem("ait-auth", "true");
    render();
  } catch (error) {
    console.warn("Could not hydrate dashboard from API:", error);
    sessionStorage.removeItem("ait-token");
    sessionStorage.removeItem("ait-auth");
    sessionStorage.removeItem("ait-role");
    state.role = "admin";
    state.user = { name: "", role: "Super Admin", initials: "SA" };
    state.students = [];
    state.assessments = [];
    state.results = [];
    state.interventions = [];
    state.followUps = [];
    state.users = [];
    state.subjects = [];
    subjects = [];
    showToast("School backend is unavailable. Start the API service to load live data.");
    render();
  }
};

const app = document.getElementById("app");
const toast = document.getElementById("toast");
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
const fmtDate = (date) => date ? new Date(`${date}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—";
const studentById = (id) => state.students.find((student) => student.id === id || student.dbId === id);
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
const pageParam = () => {
  const value = location.hash.replace("#/", "").split("/")[1] || "";
  try { return decodeURIComponent(value); } catch { return value; }
};
const go = (path) => { location.hash = `#/${path}`; };
const showToast = (message) => { toast.textContent = message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2800); };
function routeFromElement(element) {
  const route = element.dataset.route;
  if (route === "student-details") go(`student-details/${encodeURIComponent(element.dataset.id)}`);
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

function setupAdminView() {
  return `<main class="login-shell"><section class="login-card">
    <div class="brand"><div class="brand-mark">A</div><div><h1>Assessment-to-Intervention<br>Tracking System</h1><p>Internal academic support workspace</p></div></div>
    <h2>Set up administrator</h2><p class="intro">Create the first administrator account to start managing school records.</p>
    <form id="setup-admin-form"><div class="field"><label for="setup-name">Full Name</label><input id="setup-name" name="name" required></div>
      <div class="field"><label for="setup-email">School Email</label><input id="setup-email" name="email" required type="email"></div>
      <div class="field"><label for="setup-password">Password</label><div class="password-field"><input id="setup-password" name="password" required type="password"><button class="password-toggle" type="button" data-action="toggle-password" aria-label="Show password" title="Show password">👁</button></div></div>
      <button class="btn btn-primary btn-block" type="submit">Create Administrator <span>→</span></button>
    </form>
  </section></main>`;
}

function loginView() {
  if (setupStatusError) {
    return `<main class="login-shell"><section class="login-card"><div class="brand"><div class="brand-mark">A</div><div><h1>Assessment-to-Intervention<br>Tracking System</h1><p>Internal academic support workspace</p></div></div><h2>Backend unavailable</h2><p class="intro">Connect to the school backend to check administrator setup.</p><button class="btn btn-primary btn-block" type="button" data-action="retry-setup-status">Retry connection</button></section></main>`;
  }
  if (authView === "forgot") {
    return `<main class="login-shell"><section class="login-card">
      <div class="brand"><div class="brand-mark">A</div><div><h1>Assessment-to-Intervention<br>Tracking System</h1><p>Internal academic support workspace</p></div></div>
      <h2>Password help</h2><p class="intro">Self-service password reset is not configured. Contact your school administrator to reset your account password.</p>
      <p class="login-back"><button class="text-link" type="button" data-action="back-to-login">← Back to sign in</button></p>
    </section></main>`;
  }
  if (needsAdminSetup) return setupAdminView();
  return `<main class="login-shell"><section class="login-card">
    <div class="brand"><div class="brand-mark">A</div><div><h1>Assessment-to-Intervention<br>Tracking System</h1><p>Internal academic support workspace</p></div></div>
    <h2>Welcome back</h2><p class="intro">Sign in to continue to your school workspace.</p>
    <form id="login-form"><div class="field"><label for="login-email">Username or Email</label><input id="login-email" required type="email" placeholder="you@school.edu.ng"></div>
      <div class="field"><label for="login-password">Password</label><div class="password-field"><input id="login-password" required type="password" placeholder="Enter your password"><button class="password-toggle" type="button" data-action="toggle-password" aria-label="Show password" title="Show password">👁</button></div></div>
      <div class="login-help"><span>Use your assigned school account</span></div>
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
    ? [{ label: "Total Students", value: state.students.length, icon: "♙", route: "students", note: "Enrolled students" }, { label: "Total Teachers", value: state.users.filter((user) => user.role === "TEACHER").length, icon: "♧", route: "teachers", note: "Teacher accounts" }, { label: "Total Classes", value: new Set(state.students.map((student) => student.className)).size, icon: "▦", route: "classes", note: "Classes represented" }, { label: "Assessments Recorded", value: state.assessments.length, icon: "✓", route: "assessments", note: "This academic session" }, { label: "Needing Intervention", value: needs.length, icon: "!", route: "results", note: "Below threshold" }, { label: "Active Interventions", value: active.length, icon: "✦", route: "interventions", note: "Requires attention" }]
    : [{ label: "Total Students", value: state.students.length, icon: "♙", route: "students", note: "Assigned students" }, { label: "Assessments Recorded", value: state.assessments.length, icon: "✓", route: "assessments", note: "This academic session" }, { label: "Needing Intervention", value: needs.length, icon: "!", route: "results", note: "Below threshold" }, { label: "Active Interventions", value: active.length, icon: "✦", route: "interventions", note: "Requires attention" }, { label: "Completed Interventions", value: completed.length, icon: "✓", route: "follow-up", note: "This term" }, { label: "Showing Improvement", value: state.followUps.filter((f) => f.outcome === "Improved").length, icon: "↗", route: "follow-up", note: "After follow-up" }];
  return `${statCards(cards)}<div class="grid-2"><section class="card"><div class="card-header"><div><h3>Students Needing Intervention</h3><p>Results below the configurable ${threshold}% threshold</p></div><button class="section-link" data-route="results">View all results →</button></div><div class="table-wrap">${needs.length ? `<table><thead><tr><th>Student</th><th>Class</th><th>Subject</th><th>Percentage</th><th>Reason</th><th>Action</th></tr></thead><tbody>${needs.slice(0, 5).map((result) => { const student = studentById(result.studentId); const assessment = assessmentById(result.assessmentId); const pct = percent(result.score, assessment.max); return `<tr><td><span class="primary-text">${student.name}</span><br><span class="muted">${student.id}</span></td><td>${student.className}</td><td>${assessment.subject}</td><td>${badge(`${pct}%`)}</td><td>Low assessment score</td><td><button class="link-action" data-route="student-details" data-id="${student.id}">Review</button></td></tr>`; }).join("")}</tbody></table>` : emptyState("No students need intervention", "All recorded results meet the current threshold.")}</div></section>
    <section class="card"><div class="card-header"><div><h3>Intervention Overview</h3><p>Current support activity</p></div></div><div class="card-body"><div class="overview-list"><div class="overview-row"><span>Active Interventions</span><strong>${active.length}</strong></div><div class="overview-row"><span>Follow-up Due</span><strong>${state.interventions.filter((item) => item.status === "Follow-up Due").length}</strong></div><div class="overview-row"><span>Completed Interventions</span><strong>${completed.length}</strong></div><div class="overview-row"><span>Students Showing Improvement</span><strong>${state.followUps.filter((f) => f.outcome === "Improved").length}</strong></div></div></div></section></div>
    <div class="grid-2" style="margin-top:20px"><section class="card"><div class="card-header"><div><h3>Active Interventions</h3><p>Support actions in progress</p></div><button class="section-link" data-route="interventions">View all →</button></div><div class="table-wrap"><table><thead><tr><th>Student</th><th>Subject</th><th>Action taken</th><th>Follow-up</th><th>Status</th></tr></thead><tbody>${state.interventions.filter((item) => item.status !== "Completed").map((item) => { const student = studentById(item.studentId); return `<tr><td class="primary-text">${student.name}</td><td>${item.subject}</td><td>${item.action}</td><td>${fmtDate(item.followUp)}</td><td>${badge(item.status)}</td></tr>`; }).join("")}</tbody></table></div></section>
    <section class="card"><div class="card-header"><div><h3>${state.role === "admin" ? "School Records" : "Quick Actions"}</h3><p>${state.role === "admin" ? "Manage the records in this workspace" : "Common tasks for your classes"}</p></div></div><div class="card-body">${state.role === "admin" ? emptyState("No activity feed", "An activity feed is not configured.") : `<div class="quick-actions"><button data-route="students">♙ &nbsp; View Students</button><button data-route="create-assessment">＋ &nbsp; Create Assessment</button><button data-route="results">▤ &nbsp; Review Results</button><button data-route="create-intervention">✦ &nbsp; Create Intervention</button></div>`}</div></section></div>`;
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
  document.getElementById("students-table").innerHTML = rows.length ? `<table><thead><tr><th>Student ID</th><th>Student Name</th><th>Class</th><th>Assigned Teacher</th><th>Academic Session</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows.map((student) => `<tr><td class="primary-text">${esc(student.id)}</td><td>${esc(student.name)}</td><td>${esc(student.className)}</td><td>${esc(student.teacherName)}</td><td>${esc(student.session)}</td><td>${badge(student.status)}</td><td><button class="link-action" data-route="student-details" data-id="${esc(student.id)}">View</button></td></tr>`).join("")}</tbody></table>` : emptyState(search || classFilter || status ? "No search results" : "No students found", search || classFilter || status ? "Try changing or clearing your filters." : "Students will appear here after they are added.");
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
  return `${pageHeader("Create Assessment", "Set up an internal assessment before recording student scores.", '<button class="btn btn-secondary" data-route="assessments">Cancel</button>')}${state.subjects.length ? `<section class="card form-card"><form id="assessment-form"><div class="form-grid"><div class="field"><label>Assessment Name *</label><input name="name" required placeholder="e.g. Algebra Class Test"></div><div class="field"><label>Assessment Type *</label><select name="type" required>${selectOptions(assessmentTypes)}</select></div><div class="field"><label>Subject *</label><select name="subject" required>${selectOptions(state.subjects.map((subject) => subject.name))}</select></div><div class="field"><label>Class *</label><select name="className" required>${selectOptions(classes)}</select></div><div class="field"><label>Academic Session *</label><select name="session" required>${selectOptions([session], session)}</select></div><div class="field"><label>Term *</label><select name="term" required>${selectOptions(terms)}</select></div><div class="field"><label>Assessment Date *</label><input name="date" type="date" required></div><div class="field"><label>Maximum Score *</label><input name="max" type="number" min="1" required placeholder="e.g. 50"></div></div><div class="form-actions"><button class="btn btn-primary" type="submit">Save Assessment</button><button class="btn btn-secondary" type="button" data-route="assessments">Cancel</button></div></form></section>` : `<section class="card"><div class="card-body">${emptyState("Add a subject first", "Assessments need a subject. Add one here, then continue with the assessment.", "◈")}<div class="form-actions"><button class="btn btn-primary" type="button" data-action="add-subject">＋ Add Subject</button><button class="btn btn-secondary" type="button" data-route="assessments">Cancel</button></div></div></section>`}`;
}

function recordScoresView() {
  const assessment = assessmentById(pageParam());
  if (!assessment) return `${pageHeader("Record Scores", "Assessment not found.", '<button class="btn btn-secondary" data-route="assessments">← Back to Assessments</button>')}${emptyState("Assessment not found", "Select an assessment from the Assessments page.")}`;
  const roster = state.students.filter((student) => student.className === assessment.className);
  return `${pageHeader("Record Scores", "Enter valid scores. Percentages are calculated automatically.", '<button class="btn btn-secondary" data-route="assessments">← Back to Assessments</button>')}<div class="notice"><strong>Assessment:</strong> ${assessment.name} · ${assessment.subject} · ${assessment.className} · Maximum score: ${assessment.max}. Students below ${threshold}% will be marked as needing intervention.</div><section class="card"><div class="card-header"><div><h3>${assessment.name}</h3><p>${assessment.type} · ${assessment.term} · ${fmtDate(assessment.date)}</p></div><span class="badge badge-blue">${assessment.max} marks</span></div>${roster.length ? `<form id="scores-form"><div class="table-wrap"><table><thead><tr><th>Student ID</th><th>Student Name</th><th>Score / ${assessment.max}</th><th>Percentage</th><th>Performance Status</th></tr></thead><tbody>${roster.map((student) => { const previous = state.results.find((r) => r.studentId === student.id && r.assessmentId === assessment.id); const score = previous?.score ?? ""; return `<tr><td class="primary-text">${student.id}</td><td>${student.name}</td><td><input class="score-input" name="${student.id}" type="number" min="0" max="${assessment.max}" step="0.5" value="${score}" data-max="${assessment.max}"></td><td class="score-percent" data-student="${student.id}">${score === "" ? "—" : `${percent(score, assessment.max)}%`}</td><td class="score-status" data-student="${student.id}">${score === "" ? "—" : badge(statusFor(percent(score, assessment.max)))}</td></tr>`; }).join("")}</tbody></table></div><div class="form-actions" style="padding:20px"><button class="btn btn-primary" type="submit">Save Scores</button><button class="btn btn-secondary" type="button" data-route="assessments">Cancel</button></div></form>` : emptyState("No students in this class", "Add students to this class before recording scores.")}</section>`;
}

function resultsView() {
  return `${pageHeader("Results & Performance", "Review assessment results and identify students who may need support.", printButton("Print Results"))}<section class="card"><div class="filter-bar"><input class="search-input" id="results-search" placeholder="Search student, ID, subject or assessment"><select id="results-class">${selectOptions(classes, "", true)}</select><select id="results-subject">${selectOptions(state.subjects.map((subject) => subject.name), "", true)}</select><select id="results-status"><option value="">All statuses</option><option>Needs Intervention</option><option>Satisfactory</option></select><button class="btn btn-secondary btn-sm" data-action="clear-filters">Clear</button></div><div id="results-content"></div></section>`;
}
function renderResults() {
  const search = (document.getElementById("results-search")?.value || "").toLowerCase(), className = document.getElementById("results-class")?.value || "", subject = document.getElementById("results-subject")?.value || "", status = document.getElementById("results-status")?.value || "";
  const rows = state.results.map((result) => ({ result, student: studentById(result.studentId), assessment: assessmentById(result.assessmentId), pct: percent(result.score, assessmentById(result.assessmentId).max) })).filter((item) => (!search || `${item.student.name} ${item.student.id} ${item.assessment.subject} ${item.assessment.name}`.toLowerCase().includes(search)) && (!className || item.student.className === className) && (!subject || item.assessment.subject === subject) && (!status || statusFor(item.pct) === status));
  const awaitingFirstResult = !status ? state.students.filter((student) => !state.results.some((result) => result.studentId === student.id) && (!search || `${student.name} ${student.id}`.toLowerCase().includes(search)) && (!className || student.className === className)) : [];
  const all = state.results.map((r) => percent(r.score, assessmentById(r.assessmentId).max));
  document.getElementById("results-content").innerHTML = `<div class="card-body"><div class="report-summary"><div class="report-number"><span>Total Results</span><strong>${state.results.length}</strong></div><div class="report-number"><span>Average Percentage</span><strong>${all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : 0}%</strong></div><div class="report-number"><span>Needing Intervention</span><strong>${all.filter((value) => value < threshold).length}</strong></div></div></div>${awaitingFirstResult.length ? `<div class="card-header"><div><h3>Students Awaiting First Result</h3><p>${awaitingFirstResult.length} student${awaitingFirstResult.length === 1 ? "" : "s"} with no recorded scores</p></div></div><div class="table-wrap"><table><thead><tr><th>Student ID</th><th>Student Name</th><th>Class</th><th>Academic Session</th><th>Actions</th></tr></thead><tbody>${awaitingFirstResult.map((student) => `<tr><td class="primary-text">${esc(student.id)}</td><td>${esc(student.name)}</td><td>${esc(student.className)}</td><td>${esc(student.session)}</td><td><button class="link-action" data-route="student-details" data-id="${esc(student.id)}">View Student</button><button class="link-action" data-action="record-student-result" data-id="${esc(student.id)}">Record Result</button></td></tr>`).join("")}</tbody></table></div>` : ""}${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Student</th><th>Class</th><th>Subject</th><th>Assessment</th><th>Score</th><th>Percentage</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows.map(({ result, student, assessment, pct }) => `<tr><td><span class="primary-text">${student.name}</span><br><span class="muted">${student.id}</span></td><td>${student.className}</td><td>${assessment.subject}</td><td>${assessment.name}</td><td>${result.score} / ${assessment.max}</td><td>${pct}%</td><td>${badge(statusFor(pct))}</td><td><button class="link-action" data-route="student-details" data-id="${student.id}">View Student</button>${pct < threshold ? `<button class="link-action" data-route="create-intervention" data-student="${student.id}" data-assessment="${assessment.id}">Identify</button>` : ""}</td></tr>`).join("")}</tbody></table></div>` : emptyState(search || className || subject || status ? "No filter results" : "No results recorded", search || className || subject || status ? "Try changing or clearing your filters." : "Results will appear after scores are recorded.")}`;
  bindGeneratedActions(document.getElementById("results-content"));
}

function openStudentResultModal(studentId) {
  const student = studentById(studentId);
  if (!student) return showToast("Student not found. Refresh the page and try again.");
  const assessments = state.assessments.filter((assessment) => assessment.className === student.className);
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  const assessmentOptions = assessments.map((assessment) => `<option value="${esc(assessment.id)}">${esc(assessment.name)} · ${esc(assessment.subject)} · ${esc(assessment.term)}</option>`).join("");
  modal.innerHTML = `<div class="modal"><div class="modal-header"><h3>Record Result</h3><button class="modal-close" data-close>×</button></div><div class="modal-body"><div class="notice"><strong>${esc(student.name)}</strong> · ${esc(student.id)} · ${esc(student.className)}</div>${assessments.length ? `<form id="student-result-form"><div class="field"><label>Assessment *</label><select name="assessmentId" required>${assessmentOptions}</select></div><div class="field"><label>Score *</label><input name="score" type="number" min="0" max="${assessments[0].max}" step="0.5" required></div><div class="form-actions"><button class="btn btn-primary" type="submit">Save Result</button><button class="btn btn-secondary" type="button" data-close>Cancel</button></div></form>` : `<div class="empty-state"><strong>No assessment for ${esc(student.className)}</strong><span>Create an assessment for this class before entering a score.</span><button class="btn btn-primary" type="button" data-create-assessment>Create Assessment</button></div>`}</div></div>`;
  document.body.appendChild(modal);
  modal.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => modal.remove()));
  modal.querySelector("[data-create-assessment]")?.addEventListener("click", () => {
    modal.remove();
    go("create-assessment");
  });
  const form = modal.querySelector("#student-result-form");
  if (!form) return;
  const assessmentSelect = form.querySelector('[name="assessmentId"]');
  const scoreInput = form.querySelector('[name="score"]');
  assessmentSelect.addEventListener("change", () => {
    scoreInput.max = String(assessmentById(assessmentSelect.value).max);
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const assessment = assessmentById(assessmentSelect.value);
    const score = Number(scoreInput.value);
    if (!assessment || !Number.isFinite(score) || score < 0 || score > assessment.max) {
      return showToast(`Enter a score between 0 and ${assessment?.max ?? "the assessment maximum"}.`);
    }
    try {
      await apiRequest("/results", {
        method: "POST",
        body: JSON.stringify({ assessmentId: assessment.id, scores: [{ studentId: student.dbId, score }] }),
      });
      await loadRealData();
      modal.remove();
      showToast("Student result saved successfully.");
    } catch (error) {
      showToast(error.message || "Unable to save student result.");
    }
  });
}

function interventionsView() {
  return `${pageHeader("Interventions", "Track academic support actions from low result to outcome.", '<button class="btn btn-primary" data-route="create-intervention">＋ Create Intervention</button>')}<section class="card"><div class="filter-bar"><input class="search-input" id="intervention-search" placeholder="Search student, ID, subject or topic"><select id="intervention-class">${selectOptions(classes, "", true)}</select><select id="intervention-status">${selectOptions(["Active", "Follow-up Due", "Completed"], "", true)}</select><select id="intervention-subject">${selectOptions(state.subjects.map((subject) => subject.name), "", true)}</select><button class="btn btn-secondary btn-sm" data-action="clear-filters">Clear</button></div><div id="interventions-content"></div></section>`;
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

function legacyReportsView() {
  const avg = state.results.length ? Math.round(state.results.reduce((sum, r) => sum + percent(r.score, assessmentById(r.assessmentId).max), 0) / state.results.length) : 0;
  return `${pageHeader("Reports", "Simple reports for performance, intervention activity, and improvement.", "")}<div class="report-stack"><section class="card report-filters"><div class="card-header"><div><h3>Report Filters</h3><p>Apply filters to review a focused report view.</p></div><div class="actions"><button class="btn btn-primary btn-sm" data-action="apply-report">Apply Filters</button><button class="btn btn-secondary btn-sm" data-action="clear-filters">Clear Filters</button></div></div><div class="card-body"><div class="form-grid"><div class="field"><label>Academic Session</label><select>${selectOptions([session], session)}</select></div><div class="field"><label>Term</label><select>${selectOptions(terms, "", true)}</select></div><div class="field"><label>Class</label><select>${selectOptions(classes, "", true)}</select></div><div class="field"><label>Subject</label><select>${selectOptions(subjects, "", true)}</select></div><div class="field"><label>Assessment Type</label><select>${selectOptions(assessmentTypes, "", true)}</select></div></div></div></section><section class="card"><div class="card-header"><div><h3>Student Performance</h3><p>Average result across recorded assessments</p></div><button class="section-link" data-route="results">View Details →</button></div><div class="card-body"><div class="report-summary"><div class="report-number"><span>Results Recorded</span><strong>${state.results.length}</strong></div><div class="report-number"><span>Average Percentage</span><strong>${avg}%</strong></div><div class="report-number"><span>Needs Intervention</span><strong>${state.results.filter((r) => percent(r.score, assessmentById(r.assessmentId).max) < threshold).length}</strong></div></div></div></section><div class="grid-2"><section class="card"><div class="card-header"><div><h3>Students Needing Intervention</h3><p>Performance below ${threshold}%</p></div></div><div class="table-wrap"><table><thead><tr><th>Student</th><th>Subject</th><th>Topic</th><th>Percentage</th><th>Status</th></tr></thead><tbody>${state.interventions.map((item) => { const student = studentById(item.studentId); return `<tr><td class="primary-text">${student.name}</td><td>${item.subject}</td><td>${item.topic}</td><td>${item.previous}%</td><td>${badge(item.status)}</td></tr>`; }).join("")}</tbody></table></div></section><section class="card"><div class="card-header"><div><h3>Improvement After Intervention</h3><p>Follow-up percentage comparison</p></div></div><div class="table-wrap"><table><thead><tr><th>Student</th><th>Previous</th><th>Follow-Up</th><th>Improvement</th></tr></thead><tbody>${state.followUps.map((follow) => { const item = interventionById(follow.interventionId); const student = studentById(item.studentId); const improvement = follow.score - item.previous; return `<tr><td class="primary-text">${student.name}</td><td>${item.previous}%</td><td>${follow.score}%</td><td style="color:var(--green);font-weight:700">+${improvement} pts</td></tr>`; }).join("")}</tbody></table></div></section></div><section class="card"><div class="card-header"><div><h3>Intervention Summary</h3><p>Current support activity</p></div></div><div class="card-body"><div class="overview-list"><div class="overview-row"><span>Active Interventions</span><strong>${state.interventions.filter((i) => i.status === "Active").length}</strong></div><div class="overview-row"><span>Follow-up Due</span><strong>${state.interventions.filter((i) => i.status === "Follow-up Due").length}</strong></div><div class="overview-row"><span>Completed Interventions</span><strong>${state.interventions.filter((i) => i.status === "Completed").length}</strong></div></div></div></section></div>`;
}

function reportsView() {
  const sessions = [...new Set(state.assessments.map((assessment) => assessment.session).filter(Boolean))];
  const filters = state.reportFilters;
  return `${pageHeader("Reports", "Review assessment outcomes using the selected academic filters.", printButton("Print Report"))}<section class="card report-filters"><div class="card-header"><div><h3>Report Filters</h3><p>Choose criteria, then apply the filters to the report.</p></div><div class="actions"><button class="btn btn-primary btn-sm" data-action="apply-report">Apply Filters</button><button class="btn btn-secondary btn-sm" data-action="clear-filters">Clear Filters</button></div></div><div class="card-body"><div class="form-grid"><div class="field"><label>Academic Session</label><select id="report-session">${selectOptions(sessions, filters.session, true)}</select></div><div class="field"><label>Term</label><select id="report-term">${selectOptions(terms, filters.term, true)}</select></div><div class="field"><label>Class</label><select id="report-class">${selectOptions(classes, filters.className, true)}</select></div><div class="field"><label>Subject</label><select id="report-subject">${selectOptions(subjects, filters.subject, true)}</select></div><div class="field"><label>Assessment Type</label><select id="report-type">${selectOptions(assessmentTypes, filters.type, true)}</select></div></div></div></section><div id="report-results">${reportResultsView()}</div>`;
}

function reportResultsView() {
  const filters = state.reportFilters;
  const rows = state.results.map((result) => {
    const student = studentById(result.studentId);
    const assessment = assessmentById(result.assessmentId);
    return student && assessment ? { result, student, assessment, percentage: percent(result.score, assessment.max) } : null;
  }).filter((row) => row
    && (!filters.session || row.assessment.session === filters.session)
    && (!filters.term || row.assessment.term === filters.term)
    && (!filters.className || row.student.className === filters.className)
    && (!filters.subject || row.assessment.subject === filters.subject)
    && (!filters.type || row.assessment.type === filters.type));
  const average = rows.length ? Math.round(rows.reduce((total, row) => total + row.percentage, 0) / rows.length) : 0;
  const needsSupport = rows.filter((row) => row.percentage < threshold).length;
  return `<section class="card"><div class="card-body"><div class="report-summary"><div class="report-number"><span>Results</span><strong>${rows.length}</strong></div><div class="report-number"><span>Average</span><strong>${average}%</strong></div><div class="report-number"><span>Needs Intervention</span><strong>${needsSupport}</strong></div></div></div>${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Student</th><th>Class</th><th>Subject</th><th>Assessment</th><th>Score</th><th>Percentage</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows.map(({ result, student, assessment, percentage }) => `<tr><td><span class="primary-text">${esc(student.name)}</span><br><span class="muted">${esc(student.id)}</span></td><td>${esc(student.className)}</td><td>${esc(assessment.subject)}</td><td>${esc(assessment.name)}</td><td>${result.score} / ${assessment.max}</td><td>${percentage}%</td><td>${badge(statusFor(percentage))}</td><td><button class="link-action" data-route="student-details" data-id="${esc(student.id)}">View Student</button></td></tr>`).join("")}</tbody></table></div>` : emptyState("No matching results", "Change the filters or record results for the selected criteria.")}</section>`;
}

function simpleDirectoryView(type) {
  const isTeachers = type === "teachers";
  const isSubjects = type === "subjects";
  const data = isTeachers
    ? state.users.filter((user) => user.role === "TEACHER").map((user) => [user.name, user.email, user.subject || "", user.classes || "", String(state.students.filter((student) => student.teacherId === user.id).length)])
    : type === "classes"
      ? classes.map((item) => [item, String(state.students.filter((student) => student.className === item).length)])
      : state.subjects.map((subject) => [subject.name, String(subject.topics.length), subject.id]);
  const headers = isTeachers ? ["Name", "Email", "Subject", "Assigned Classes", "Assigned Students"] : type === "classes" ? ["Class", "Students"] : ["Subject", "Topics", "Actions"];
  const title = isTeachers ? "Teachers" : type === "classes" ? "Classes" : "Subjects & Topics";
  const action = isTeachers ? '<button class="btn btn-primary" data-action="add-directory" data-directory="teachers">＋ Add Teacher</button>' : isSubjects ? '<button class="btn btn-primary" data-action="add-subject">＋ Add Subject</button>' : "";
  const rows = isSubjects
    ? data.map(([name, count, id]) => `<tr><td class="primary-text">${esc(name)}</td><td>${count}</td><td><button class="link-action" data-action="manage-topics" data-id="${id}">Manage Topics</button><button class="link-action" data-action="edit-subject" data-id="${id}">Edit</button><button class="link-action" data-action="delete-subject" data-id="${id}">Delete</button></td></tr>`).join("")
    : data.map((row) => `<tr>${row.map((cell, index) => `<td class="${index === 0 ? "primary-text" : ""}">${esc(cell)}</td>`).join("")}</tr>`).join("");
  return `${pageHeader(title, isTeachers ? "Manage teacher accounts and class assignments." : isSubjects ? "Manage curriculum subjects and their topics." : "Classes represented by enrolled students.", action)}<section class="card"><div class="filter-bar"><input class="search-input" id="directory-search" placeholder="Search ${isTeachers ? "teachers" : type === "classes" ? "classes" : "subjects"}..."><button class="btn btn-secondary btn-sm" data-action="clear-directory">Clear</button></div><div class="table-wrap"><table><thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead><tbody>${data.length ? rows : `<tr><td colspan="${headers.length}">No ${isTeachers ? "teachers have been added" : isSubjects ? "subjects have been added" : "classes have students"} yet.</td></tr>`}</tbody></table></div></section>`;
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
  if (page === "subjects") {
    const actions = document.querySelector(".page-heading .actions");
    if (actions && !actions.querySelector('[data-action="add-standard-subjects"]')) {
      const button = document.createElement("button");
      button.className = "btn btn-secondary";
      button.type = "button";
      button.dataset.action = "add-standard-subjects";
      button.textContent = "Import Standard Subjects";
      button.addEventListener("click", () => addStandardSubjects());
      actions.prepend(button);
    }
  }
  if (page === "create-assessment" && !state.subjects.length) {
    const emptyStateActions = document.querySelector(".content .card-body .form-actions");
    if (emptyStateActions && !emptyStateActions.querySelector('[data-action="add-standard-subjects"]')) {
      const button = document.createElement("button");
      button.className = "btn btn-primary";
      button.type = "button";
      button.dataset.action = "add-standard-subjects";
      button.textContent = "＋ Add Standard Subjects";
      button.addEventListener("click", () => addStandardSubjects());
      emptyStateActions.prepend(button);
    }
  }
  if (rosterRefreshTimer) clearInterval(rosterRefreshTimer);
  rosterRefreshTimer = null;
  if (page === "record-scores" && sessionStorage.getItem("ait-token")) {
    rosterRefreshTimer = setInterval(async () => {
      try {
        const latestStudents = await apiRequest("/students");
        if (pageName() !== "record-scores" || !Array.isArray(latestStudents)) return;
        const nextStudents = latestStudents.map(mapStudent);
        if (JSON.stringify(nextStudents) !== JSON.stringify(state.students)) {
          state.students = nextStudents;
          render();
        }
      } catch (error) {
        console.warn("Could not refresh the score-entry roster:", error);
      }
    }, 8000);
  }
  document.querySelectorAll("[data-route]").forEach((element) => element.addEventListener("click", () => {
    const route = element.dataset.route;
    if (route === "student-details") go(`student-details/${encodeURIComponent(element.dataset.id)}`);
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
  const interventionForm = document.getElementById("intervention-form");
  interventionForm?.addEventListener("submit", saveIntervention);
  if (interventionForm) {
    const subjectSelect = interventionForm.querySelector('[name="subject"]');
    const topicInput = interventionForm.querySelector('[name="topic"]');
    const teacherInput = interventionForm.querySelector('[name="teacher"]');
    const teachers = state.users.filter((user) => user.role === "TEACHER");
    const selectedTeacherId = state.role === "teacher" ? state.user.id : teachers[0]?.id;
    teacherInput.outerHTML = `<select name="teacher" required>${teachers.map((teacher) => `<option value="${esc(teacher.id)}" ${teacher.id === selectedTeacherId ? "selected" : ""}>${esc(teacher.name)}</option>`).join("")}</select>`;
    const topicList = document.createElement("datalist");
    topicList.id = "intervention-topic-suggestions";
    topicInput.setAttribute("list", topicList.id);
    interventionForm.append(topicList);
    const updateTopics = () => {
      const selectedSubject = state.subjects.find((subject) => subject.name === subjectSelect.value);
      topicList.innerHTML = (selectedSubject?.topics || []).map((topic) => `<option value="${esc(topic.name)}"></option>`).join("");
    };
    subjectSelect.addEventListener("change", updateTopics);
    updateTopics();
  }
  document.querySelectorAll(".score-input").forEach((input) => input.addEventListener("input", updateScoreRow));
}

function handleAction(action, element) {
  if (action === "sign-out") {
    if (rosterRefreshTimer) clearInterval(rosterRefreshTimer);
    rosterRefreshTimer = null;
    sessionStorage.removeItem("ait-auth");
    sessionStorage.removeItem("ait-role");
    sessionStorage.removeItem("ait-token");
    authView = "login";
    render();
  } else if (action === "retry-setup-status") {
    checkSetupStatus();
  } else if (action === "print-page") {
    window.print();
  } else if (action === "toggle-password") {
    const passwordInput = document.getElementById("login-password") || document.getElementById("setup-password");
    if (!passwordInput) return;
    const visible = passwordInput.type === "text";
    passwordInput.type = visible ? "password" : "text";
    element.textContent = "👁";
    element.classList.toggle("is-visible", !visible);
    element.setAttribute("aria-label", visible ? "Show password" : "Hide password");
    element.title = visible ? "Show password" : "Hide password";
  } else if (action === "forgot-password") {
    authView = "forgot";
    render();
  } else if (action === "back-to-login") {
    authView = "login";
    render();
  } else if (state.role === "teacher" && ["add-student", "edit-student", "add-directory", "add-subject", "add-standard-subjects", "edit-subject", "delete-subject", "manage-topics"].includes(action)) {
    return showToast("This feature is available to Super Admins only.");
  } else if (action === "clear-filters") {
    document.querySelectorAll(".filter-bar input").forEach((input) => { input.value = ""; });
    document.querySelectorAll(".filter-bar select, .report-filters select").forEach((select) => { select.value = ""; });
    state.reportFilters = { session: "", term: "", className: "", subject: "", type: "" };
    if (pageName() === "students") renderStudentsTable();
    if (pageName() === "assessments") renderAssessmentsTable();
    if (pageName() === "results") renderResults();
    if (pageName() === "interventions") renderInterventions();
    if (pageName() === "follow-up") renderFollowUps();
    if (pageName() === "reports") {
      const reportResults = document.getElementById("report-results");
      reportResults.innerHTML = reportResultsView();
      bindGeneratedActions(reportResults);
    }
  } else if (action === "add-student") {
    openStudentModal();
  } else if (action === "edit-student") {
    openStudentModal(studentById(element.dataset.id || pageParam()));
  } else if (action === "view-assessment") {
    openAssessmentModal(element.dataset.id);
  } else if (action === "record-student-result") {
    openStudentResultModal(element.dataset.id);
  } else if (action === "add-directory") {
    openDirectoryModal(element.dataset.directory);
  } else if (action === "add-subject") {
    openSubjectModal();
  } else if (action === "add-standard-subjects") {
    addStandardSubjects();
  } else if (action === "manage-topics") {
    openTopicsModal(element.dataset.id);
  } else if (action === "edit-subject") {
    openSubjectModal(state.subjects.find((subject) => subject.id === element.dataset.id));
  } else if (action === "delete-subject") {
    deleteSubject(element.dataset.id);
  } else if (action === "record-follow-up") {
    openFollowUpModal(interventionById(element.dataset.id));
  } else if (action === "clear-directory") {
    const input = document.getElementById("directory-search");
    if (input) input.value = "";
    document.querySelectorAll(".table-wrap tbody tr").forEach((row) => { row.hidden = false; });
  } else if (action === "apply-report") {
    state.reportFilters = {
      session: document.getElementById("report-session").value,
      term: document.getElementById("report-term").value,
      className: document.getElementById("report-class").value,
      subject: document.getElementById("report-subject").value,
      type: document.getElementById("report-type").value,
    };
    const reportResults = document.getElementById("report-results");
    reportResults.innerHTML = reportResultsView();
    bindGeneratedActions(reportResults);
    showToast("Report filters applied.");
  }
}

async function saveAssessment(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  if (!data.name || !data.type || !data.subject || !data.className || !data.date || Number(data.max) <= 0) return showToast("Please complete all required fields.");
  if (sessionStorage.getItem("ait-token")) {
    try {
      const payload = { ...data, maxScore: Number(data.max), status: "Draft" };
      await apiRequest("/assessments", { method: "POST", body: JSON.stringify(payload) });
      await loadRealData();
      showToast("Assessment saved successfully.");
      go("assessments");
      return;
    } catch (error) {
      showToast(error.message || "Unable to save assessment.");
      return;
    }
  }
  state.assessments.push({ id: `AS-${String(state.assessments.length + 1).padStart(3, "0")}`, ...data, max: Number(data.max), status: "Draft" });
  showToast("Assessment saved successfully."); go("assessments");
}
async function saveScores(event) {
  event.preventDefault();
  const assessment = assessmentById(pageParam()), data = Object.fromEntries(new FormData(event.target));
  const roster = state.students.filter((student) => student.className === assessment.className);
  for (const student of roster) { const raw = data[student.id]; if (raw === "" || raw === undefined || Number(raw) < 0 || Number(raw) > assessment.max || Number.isNaN(Number(raw))) return showToast(`Enter a valid score for ${student.name}.`); }
  if (sessionStorage.getItem("ait-token")) {
    try {
      const payload = {
        assessmentId: assessment.id,
        scores: roster.map((student) => ({ studentId: student.dbId, score: Number(data[student.id]) }))
      };
      await apiRequest("/results", { method: "POST", body: JSON.stringify(payload) });
      await loadRealData();
      showToast("Scores saved successfully.");
      go("results");
      return;
    } catch (error) {
      showToast(error.message || "Unable to save results.");
      return;
    }
  }
  roster.forEach((student) => { const existing = state.results.find((result) => result.studentId === student.id && result.assessmentId === assessment.id); if (existing) existing.score = Number(data[student.id]); else state.results.push({ id: `RS-${String(state.results.length + 1).padStart(3, "0")}`, assessmentId: assessment.id, studentId: student.id, score: Number(data[student.id]) }); });
  assessment.status = "Published"; showToast("Scores saved successfully."); go("results");
}
async function saveIntervention(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  const studentId = data.studentId.split(" ")[0];
  if (!data.studentId || !data.subject || !data.topic || !data.reason || !data.action || !data.teacher || !data.start || !data.followUp) return showToast("Please complete all required fields.");
  if (data.followUp < data.start) return showToast("Follow-Up Date cannot be earlier than Start Date.");
  if (sessionStorage.getItem("ait-token")) {
    try {
      await apiRequest("/interventions", {
        method: "POST",
        body: JSON.stringify({
          studentId: studentById(studentId)?.dbId || studentId,
          subject: data.subject,
          topic: data.topic,
          assessmentId: data.assessmentId || null,
          previous: Number(data.previous) || 0,
          reason: data.reason,
          action: data.action,
          teacherId: data.teacher,
          startDate: data.start,
          followUpDate: data.followUp,
          status: data.status || "Active",
          notes: data.notes || ""
        })
      });
      await loadRealData();
      showToast("Intervention created successfully.");
      go("interventions");
      return;
    } catch (error) {
      showToast(error.message || "Unable to create intervention.");
      return;
    }
  }
  state.interventions.push({ id: `IN-${String(state.interventions.length + 1).padStart(3, "0")}`, ...data, studentId, previous: Number(data.previous) || 0 });
  showToast("Intervention created successfully."); go("interventions");
}
function updateScoreRow(event) {
  const input = event.target, value = input.value, max = Number(input.dataset.max), pctCell = document.querySelector(`.score-percent[data-student="${input.name}"]`), statusCell = document.querySelector(`.score-status[data-student="${input.name}"]`);
  input.classList.toggle("invalid", value !== "" && (Number(value) < 0 || Number(value) > max));
  pctCell.textContent = value === "" ? "—" : `${percent(value, max)}%`; statusCell.innerHTML = value === "" ? "—" : badge(statusFor(percent(value, max)));
}

function openDirectoryModal(type, existingName = "") {
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `<div class="modal"><div class="modal-header"><h3>Add Teacher</h3><button class="modal-close" data-close>×</button></div><div class="modal-body"><form id="directory-form"><div class="field"><label>Full Name *</label><input name="name" required></div><div class="field"><label>School Email *</label><input name="email" type="email" required></div><div class="field"><label>Temporary Password *</label><input name="password" type="password" required minlength="8"></div><div class="field"><label>Subject Area *</label><input name="subject" required></div><div class="field"><label>Assigned Classes</label><input name="classes" placeholder="e.g. SSS1, SSS2"></div><div class="form-actions"><button class="btn btn-primary" type="submit">Create Teacher Account</button><button class="btn btn-secondary" type="button" data-close>Cancel</button></div></form></div></div>`;
  document.body.appendChild(modal);
  modal.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => modal.remove()));
  modal.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    try {
      await apiRequest("/teachers", { method: "POST", body: JSON.stringify(data) });
      await loadRealData();
      modal.remove();
      showToast("Teacher account created successfully.");
    } catch (error) {
      showToast(error.message || "Unable to create teacher account.");
    }
  });
}

function openSubjectModal(subject = null) {
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `<div class="modal"><div class="modal-header"><h3>${subject ? "Edit Subject" : "Add Subject"}</h3><button class="modal-close" data-close>×</button></div><div class="modal-body"><form><div class="field"><label>Subject Name *</label><input name="name" required maxlength="100" value="${esc(subject?.name || "")}" placeholder="e.g. Mathematics"></div><div class="form-actions"><button class="btn btn-primary" type="submit">${subject ? "Save Changes" : "Add Subject"}</button><button class="btn btn-secondary" type="button" data-close>Cancel</button></div></form></div></div>`;
  document.body.appendChild(modal);
  modal.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => modal.remove()));
  modal.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    try {
      await apiRequest(subject ? `/subjects/${encodeURIComponent(subject.id)}` : "/subjects", {
        method: subject ? "PUT" : "POST",
        body: JSON.stringify(data),
      });
      await loadRealData();
      modal.remove();
      showToast(subject ? "Subject updated." : "Subject added.");
    } catch (error) {
      showToast(error.message || "Unable to save subject.");
    }
  });
}

function openTopicEditor(subjectId, topic = null, onSaved = () => {}) {
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `<div class="modal"><div class="modal-header"><h3>${topic ? "Edit Topic" : "Add Topic"}</h3><button class="modal-close" data-close>×</button></div><div class="modal-body"><form><div class="field"><label>Topic Name *</label><input name="name" required maxlength="100" value="${esc(topic?.name || "")}" placeholder="e.g. Fractions"></div><div class="form-actions"><button class="btn btn-primary" type="submit">${topic ? "Save Changes" : "Add Topic"}</button><button class="btn btn-secondary" type="button" data-close>Cancel</button></div></form></div></div>`;
  document.body.appendChild(modal);
  modal.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => modal.remove()));
  modal.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    try {
      await apiRequest(topic ? `/topics/${encodeURIComponent(topic.id)}` : `/subjects/${encodeURIComponent(subjectId)}/topics`, {
        method: topic ? "PUT" : "POST",
        body: JSON.stringify(data),
      });
      await loadRealData();
      modal.remove();
      onSaved();
    } catch (error) {
      showToast(error.message || "Unable to save topic.");
    }
  });
}

function openTopicsModal(subjectId) {
  const subject = state.subjects.find((entry) => entry.id === subjectId);
  if (!subject) return showToast("Subject not found. Refresh the page and try again.");
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `<div class="modal"><div class="modal-header"><h3>${esc(subject.name)} Topics</h3><button class="modal-close" data-close>×</button></div><div class="modal-body"><div class="table-wrap" data-topic-list></div><div class="form-actions"><button class="btn btn-primary" type="button" data-action="add-topic">＋ Add Topic</button><button class="btn btn-secondary" type="button" data-close>Done</button></div></div></div>`;
  document.body.appendChild(modal);
  modal.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => modal.remove()));

  const refresh = () => {
    const currentSubject = state.subjects.find((entry) => entry.id === subjectId);
    const list = modal.querySelector("[data-topic-list]");
    if (!currentSubject || !list) return;
    list.innerHTML = currentSubject.topics.length
      ? `<table><thead><tr><th>Topic</th><th>Actions</th></tr></thead><tbody>${currentSubject.topics.map((topic) => `<tr><td>${esc(topic.name)}</td><td><button class="link-action" data-edit-topic="${esc(topic.id)}">Edit</button><button class="link-action" data-delete-topic="${esc(topic.id)}">Delete</button></td></tr>`).join("")}</tbody></table>`
      : emptyState("No topics yet", "Add the topics taught in this subject.");
    list.querySelectorAll("[data-edit-topic]").forEach((button) => button.addEventListener("click", () => {
      const selectedTopic = currentSubject.topics.find((entry) => entry.id === button.dataset.editTopic);
      openTopicEditor(subjectId, selectedTopic, refresh);
    }));
    list.querySelectorAll("[data-delete-topic]").forEach((button) => button.addEventListener("click", async () => {
      const selectedTopic = currentSubject.topics.find((entry) => entry.id === button.dataset.deleteTopic);
      if (!selectedTopic || !window.confirm(`Delete topic "${selectedTopic.name}"?`)) return;
      try {
        await apiRequest(`/topics/${encodeURIComponent(selectedTopic.id)}`, { method: "DELETE" });
        await loadRealData();
        refresh();
        showToast("Topic deleted.");
      } catch (error) {
        showToast(error.message || "Unable to delete topic.");
      }
    }));
  };

  modal.querySelector('[data-action="add-topic"]').addEventListener("click", () => openTopicEditor(subjectId, null, refresh));
  refresh();
}

async function deleteSubject(subjectId) {
  const subject = state.subjects.find((entry) => entry.id === subjectId);
  if (!subject || !window.confirm(`Delete subject "${subject.name}" and its topics?`)) return;
  try {
    await apiRequest(`/subjects/${encodeURIComponent(subject.id)}`, { method: "DELETE" });
    await loadRealData();
    showToast("Subject deleted.");
  } catch (error) {
    showToast(error.message || "Unable to delete subject.");
  }
}

async function addStandardSubjects() {
  try {
    const result = await apiRequest("/subjects/standard", { method: "POST" });
    await loadRealData();
    showToast(result.added ? `Added ${result.added} senior-secondary subjects.` : "All standard subjects are already in the catalog.");
  } catch (error) {
    showToast(error.message || "Unable to import standard subjects.");
  }
}

function openAssessmentModal(assessmentId) {
  const assessment = assessmentById(assessmentId);
  if (!assessment) return showToast("Assessment not found.");
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `<div class="modal"><div class="modal-header"><h3>${esc(assessment.name)}</h3><button class="modal-close" data-close>×</button></div><div class="modal-body"><div class="info-grid"><div class="info-item"><span>Type</span><strong>${esc(assessment.type)}</strong></div><div class="info-item"><span>Subject</span><strong>${esc(assessment.subject)}</strong></div><div class="info-item"><span>Class</span><strong>${esc(assessment.className)}</strong></div><div class="info-item"><span>Session and Term</span><strong>${esc(assessment.session)} · ${esc(assessment.term)}</strong></div><div class="info-item"><span>Date</span><strong>${fmtDate(assessment.date)}</strong></div><div class="info-item"><span>Maximum Score</span><strong>${assessment.max}</strong></div><div class="info-item"><span>Status</span><strong>${esc(assessment.status)}</strong></div></div><div class="form-actions"><button class="btn btn-primary" type="button" data-record-scores>Record Scores</button><button class="btn btn-secondary" type="button" data-close>Close</button></div></div></div>`;
  document.body.appendChild(modal);
  modal.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => modal.remove()));
  modal.querySelector("[data-record-scores]").addEventListener("click", () => {
    modal.remove();
    go(`record-scores/${encodeURIComponent(assessment.id)}`);
  });
}

function openStudentModal(student = null) {
  const modal = document.createElement("div"); modal.className = "modal-backdrop"; modal.innerHTML = `<div class="modal"><div class="modal-header"><h3>${student ? "Edit Student" : "Add Student"}</h3><button class="modal-close" data-close>×</button></div><div class="modal-body"><form id="student-modal-form"><div class="form-grid"><div class="field"><label>Student ID *</label><input name="studentId" required value="${esc(student?.id || "")}" ${student ? "readonly" : ""}></div><div class="field"><label>Full Name *</label><input name="name" required value="${esc(student?.name || "")}"></div><div class="field"><label>Class *</label><select name="className" required>${selectOptions(classes, student?.className || "")}</select></div><div class="field"><label>Academic Session *</label><input name="session" required value="${esc(student?.session || session)}"></div><div class="field"><label>Gender</label><select name="gender">${selectOptions(["Female", "Male"], student?.gender || "")}</select></div><div class="field"><label>Status</label><select name="status">${selectOptions(["Active", "Inactive"], student?.status || "Active")}</select></div></div><div class="form-actions"><button class="btn btn-primary" type="submit">Save Student</button><button class="btn btn-secondary" type="button" data-close>Cancel</button></div></form></div></div>`; document.body.appendChild(modal); modal.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => modal.remove())); modal.querySelector("form").addEventListener("submit", async (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)); try { const endpoint = student ? `/students/${encodeURIComponent(student.id)}` : "/students"; await apiRequest(endpoint, { method: student ? "PUT" : "POST", body: JSON.stringify(data) }); await loadRealData(); modal.remove(); go("students"); showToast(student ? "Student updated successfully." : "Student added successfully."); } catch (error) { showToast(error.message || `Unable to ${student ? "update" : "add"} student.`); } });
}
function openFollowUpModal(intervention) {
  const student = studentById(intervention.studentId);
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `<div class="modal"><div class="modal-header"><h3>Record Follow-Up</h3><button class="modal-close" data-close>×</button></div><div class="modal-body"><div class="notice"><strong>${esc(student?.name || "Student")}</strong> · ${esc(intervention.subject)} · Previous percentage: ${intervention.previous}%</div><form id="follow-modal-form"><div class="field"><label>Follow-Up Percentage *</label><input name="score" type="number" min="0" max="100" step="0.5" required placeholder="Enter percentage"></div><div class="field"><label>Outcome *</label><select name="outcome" required>${selectOptions(["Improved", "Needs Further Support", "No Significant Improvement"])}</select></div><div class="field"><label>Follow-Up Date *</label><input name="date" type="date" required></div><div class="form-actions"><button class="btn btn-primary" type="submit">Save Follow-Up</button><button class="btn btn-secondary" type="button" data-close>Cancel</button></div></form></div></div>`;
  document.body.appendChild(modal);
  modal.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => modal.remove()));
  modal.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    const score = Number(data.score);
    if (!Number.isFinite(score) || score < 0 || score > 100) return showToast("Enter a percentage between 0 and 100.");
    try {
      await apiRequest("/follow-ups", {
        method: "POST",
        body: JSON.stringify({ interventionId: intervention.id, score, outcome: data.outcome, date: data.date }),
      });
      await loadRealData();
      modal.remove();
      showToast("Follow-up result saved successfully.");
    } catch (error) {
      showToast(error.message || "Unable to save follow-up result.");
    }
  });
}

window.addEventListener("hashchange", render);
document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (target && !sessionStorage.getItem("ait-auth")) handleAction(target.dataset.action, target);
});
document.addEventListener("submit", async (event) => {
  if (event.target.id === "setup-admin-form") {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    try {
      const response = await apiRequest("/auth/setup-admin", { method: "POST", body: JSON.stringify(data) });
      needsAdminSetup = false;
      state.role = "admin";
      state.user = { name: response.user.name, role: "Super Admin", initials: initials(response.user.name) };
      sessionStorage.setItem("ait-auth", "true");
      sessionStorage.setItem("ait-role", "admin");
      sessionStorage.setItem("ait-token", response.token);
      go("dashboard");
      await loadRealData();
    } catch (error) {
      showToast(error.message || "Unable to create administrator account.");
    }
  }
  if (event.target.id === "login-form") {
    event.preventDefault();
    const email = event.target.querySelector("#login-email").value.trim().toLowerCase();
    const password = event.target.querySelector("#login-password").value;
    if (!email || !password) return showToast("Enter your email and password.");
    try {
      const response = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      const user = response.user;
      state.role = normalizeRole(user.role);
      state.user = {
        name: user.name,
        role: state.role === "admin" ? "Super Admin" : "Teacher",
        initials: initials(user.name)
      };
      sessionStorage.setItem("ait-auth", "true");
      sessionStorage.setItem("ait-role", state.role);
      sessionStorage.setItem("ait-token", response.token);
      go("dashboard");
      await loadRealData();
      render();
    } catch (error) {
      showToast(error.message || "Unable to sign in.");
    }
  }
  if (event.target.id === "forgot-password-form") {
    event.preventDefault();
    const email = event.target.querySelector("#reset-email").value.trim();
    if (!email) return showToast("Enter your username or email address.");
    showToast(`If an account exists for ${email}, a reset link has been sent.`);
    event.target.reset();
  }
});
if (sessionStorage.getItem("ait-auth") && sessionStorage.getItem("ait-token")) {
  state.role = sessionStorage.getItem("ait-role") === "teacher" ? "teacher" : "admin";
  state.user = { name: "Loading profile...", role: state.role === "admin" ? "Super Admin" : "Teacher", initials: "LD" };
  loadRealData();
} else {
  render();
  checkSetupStatus();
}
