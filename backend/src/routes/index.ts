import { Router } from 'express';
import { getCurrentUser, loginUser, registerUser } from '../controllers/auth.controller.js';
import { createAssessment, createIntervention, createStudent, getAssessments, getDashboardData, getInterventions, getResults, getStudents, saveFollowUp, saveScores } from '../controllers/data.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'assessment-intervention-api' });
});

router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
router.get('/auth/me', requireAuth, getCurrentUser);

router.get('/dashboard', requireAuth, getDashboardData);
router.get('/students', requireAuth, getStudents);
router.post('/students', requireAuth, createStudent);
router.get('/assessments', requireAuth, getAssessments);
router.post('/assessments', requireAuth, createAssessment);
router.get('/results', requireAuth, getResults);
router.post('/results', requireAuth, saveScores);
router.get('/interventions', requireAuth, getInterventions);
router.post('/interventions', requireAuth, createIntervention);
router.post('/follow-ups', requireAuth, saveFollowUp);

export default router;
