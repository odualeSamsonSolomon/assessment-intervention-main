import { Router } from 'express';
import { approveStudent, approveTeacher, createTeacher, getCurrentUser, getPendingStudents, getPendingTeachers, getSetupStatus, loginUser, registerStudent, rejectStudent, rejectTeacher, registerTeacher, setupAdmin } from '../controllers/auth.controller.js';
import { addStandardSubjects, createAssessment, createIntervention, createStudent, createSubject, createTopic, deleteSubject, deleteTopic, getAssessments, getDashboardData, getInterventions, getResults, getStudentDashboard, getStudents, getSubjects, saveFollowUp, saveScores, updateStudent, updateSubject, updateTopic } from '../controllers/data.controller.js';
import { requireAdmin, requireAuth, requireStaff } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';

const router = Router();
const loginRateLimit = rateLimit({
  key: 'login',
  limit: 10,
  windowMs: 15 * 60 * 1000,
  message: 'Too many sign-in attempts. Please try again after the limit resets.',
});
const registrationRateLimit = rateLimit({
  key: 'registration',
  limit: 20,
  windowMs: 60 * 60 * 1000,
  message: 'Too many registration requests. Please try again after the limit resets.',
});
const adminSetupRateLimit = rateLimit({
  key: 'admin-setup',
  limit: 5,
  windowMs: 60 * 60 * 1000,
  message: 'Too many setup attempts. Please try again after the limit resets.',
});

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'assessment-intervention-api' });
});

router.get('/auth/setup-status', getSetupStatus);
router.post('/auth/setup-admin', adminSetupRateLimit, setupAdmin);
router.post('/auth/login', loginRateLimit, loginUser);
router.post('/auth/teachers/register', registrationRateLimit, registerTeacher);
router.post('/auth/students/register', registrationRateLimit, registerStudent);
router.get('/auth/me', requireAuth, getCurrentUser);

router.get('/dashboard', requireAuth, requireStaff, getDashboardData);
router.get('/student/dashboard', requireAuth, getStudentDashboard);
router.get('/students', requireAuth, requireStaff, getStudents);
router.get('/students/pending-accounts', requireAuth, requireAdmin, getPendingStudents);
router.post('/students', requireAuth, requireAdmin, createStudent);
router.put('/students/:studentId', requireAuth, requireAdmin, updateStudent);
router.post('/students/accounts/:userId/approve', requireAuth, requireAdmin, approveStudent);
router.delete('/students/accounts/:userId', requireAuth, requireAdmin, rejectStudent);
router.post('/teachers', requireAuth, requireAdmin, createTeacher);
router.get('/teachers/pending', requireAuth, requireAdmin, getPendingTeachers);
router.post('/teachers/:teacherId/approve', requireAuth, requireAdmin, approveTeacher);
router.delete('/teachers/pending/:teacherId', requireAuth, requireAdmin, rejectTeacher);
router.get('/subjects', requireAuth, requireStaff, getSubjects);
router.post('/subjects', requireAuth, requireAdmin, createSubject);
router.post('/subjects/standard', requireAuth, requireAdmin, addStandardSubjects);
router.put('/subjects/:subjectId', requireAuth, requireAdmin, updateSubject);
router.delete('/subjects/:subjectId', requireAuth, requireAdmin, deleteSubject);
router.post('/subjects/:subjectId/topics', requireAuth, requireAdmin, createTopic);
router.put('/topics/:topicId', requireAuth, requireAdmin, updateTopic);
router.delete('/topics/:topicId', requireAuth, requireAdmin, deleteTopic);
router.get('/assessments', requireAuth, requireStaff, getAssessments);
router.post('/assessments', requireAuth, requireStaff, createAssessment);
router.get('/results', requireAuth, requireStaff, getResults);
router.post('/results', requireAuth, requireStaff, saveScores);
router.get('/interventions', requireAuth, requireStaff, getInterventions);
router.post('/interventions', requireAuth, requireStaff, createIntervention);
router.post('/follow-ups', requireAuth, requireStaff, saveFollowUp);

export default router;
