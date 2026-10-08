import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export const getDashboardData = async (req: Request & { user?: { id: string; role: string } }, res: Response) => {
  try {
    const [students, assessments, results, interventions, followUps, users] = await Promise.all([
      prisma.student.findMany({ orderBy: { name: 'asc' } }),
      prisma.assessment.findMany({ orderBy: { date: 'desc' } }),
      prisma.result.findMany({ include: { assessment: true, student: true } }),
      prisma.intervention.findMany({ include: { student: true, followUp: true } }),
      prisma.followUp.findMany({ include: { intervention: true } }),
      prisma.user.findMany({ orderBy: { name: 'asc' } }),
    ]);

    const needsIntervention = results.filter((result) => {
      const max = result.assessment.maxScore || 100;
      return max > 0 && (result.score / max) * 100 < 60;
    }).length;

    return res.json({
      user: req.user,
      students,
      assessments,
      results: results.map((result) => ({
        id: result.id,
        assessmentId: result.assessmentId,
        studentId: result.studentId,
        score: result.score,
        assessment: { id: result.assessment.id, name: result.assessment.name, subject: result.assessment.subject, max: result.assessment.maxScore },
        student: { id: result.student.id, name: result.student.name, className: result.student.className },
      })),
      interventions: interventions.map((intervention) => ({
        id: intervention.id,
        studentId: intervention.studentId,
        subject: intervention.subject,
        topic: intervention.topic,
        assessmentId: intervention.assessmentId,
        previous: intervention.previous,
        reason: intervention.reason,
        action: intervention.action,
        teacher: intervention.teacherId ? { id: intervention.teacherId } : null,
        teacherName: intervention.teacherId ? undefined : undefined,
        start: intervention.startDate,
        followUp: intervention.followUpDate,
        status: intervention.status,
        notes: intervention.notes,
        outcome: intervention.outcome,
        followUpScore: intervention.followUpScore,
        student: { id: intervention.student.id, name: intervention.student.name, className: intervention.student.className },
      })),
      followUps: followUps.map((entry) => ({
        id: entry.id,
        interventionId: entry.interventionId,
        score: entry.score,
        outcome: entry.outcome,
        date: entry.date,
      })),
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        subject: user.subject,
        classes: user.classes,
      })),
      summary: {
        totalStudents: students.length,
        totalAssessments: assessments.length,
        totalResults: results.length,
        activeInterventions: interventions.filter((item) => item.status !== 'Completed').length,
        completedInterventions: interventions.filter((item) => item.status === 'Completed').length,
        needsIntervention,
      },
    });
  } catch (error) {
    console.error('getDashboardData error:', error);
    return res.status(500).json({ message: 'Unable to fetch dashboard data.' });
  }
};

export const getStudents = async (_req: Request, res: Response) => {
  const students = await prisma.student.findMany({ orderBy: { name: 'asc' } });
  return res.json(students);
};

export const createStudent = async (req: Request, res: Response) => {
  try {
    const { name, className, gender, status, session, studentId } = req.body ?? {};
    if (!name || !className || !session || !studentId) {
      return res.status(400).json({ message: 'Student ID, name, class and session are required.' });
    }

    const student = await prisma.student.create({
      data: {
        studentId: String(studentId),
        name: String(name),
        className: String(className),
        gender: gender ? String(gender) : null,
        status: status ? String(status) : 'Active',
        session: String(session),
      },
    });

    return res.status(201).json(student);
  } catch (error) {
    console.error('createStudent error:', error);
    return res.status(500).json({ message: 'Unable to create student record.' });
  }
};

export const getAssessments = async (_req: Request, res: Response) => {
  const assessments = await prisma.assessment.findMany({ orderBy: { date: 'desc' } });
  return res.json(assessments);
};

export const createAssessment = async (req: Request, res: Response) => {
  try {
    const { name, type, subject, className, session, term, date, maxScore, status } = req.body ?? {};
    if (!name || !type || !subject || !className || !session || !term || !date || !maxScore) {
      return res.status(400).json({ message: 'Please complete all assessment fields.' });
    }

    const assessment = await prisma.assessment.create({
      data: {
        name: String(name),
        type: String(type),
        subject: String(subject),
        className: String(className),
        session: String(session),
        term: String(term),
        date: new Date(date),
        maxScore: Number(maxScore),
        status: status ? String(status) : 'Draft',
      },
    });

    return res.status(201).json(assessment);
  } catch (error) {
    console.error('createAssessment error:', error);
    return res.status(500).json({ message: 'Unable to save the assessment.' });
  }
};

export const getResults = async (_req: Request, res: Response) => {
  const results = await prisma.result.findMany({
    include: { assessment: true, student: true },
    orderBy: { createdAt: 'desc' },
  });

  return res.json(results.map((result) => ({
    id: result.id,
    assessmentId: result.assessmentId,
    studentId: result.studentId,
    score: result.score,
    assessment: { id: result.assessment.id, name: result.assessment.name, subject: result.assessment.subject, max: result.assessment.maxScore },
    student: { id: result.student.id, name: result.student.name, className: result.student.className },
  })));
};

export const saveScores = async (req: Request, res: Response) => {
  try {
    const { assessmentId, scores } = req.body ?? {};
    if (!assessmentId || !Array.isArray(scores)) {
      return res.status(400).json({ message: 'Assessment ID and scores are required.' });
    }

    const promises = scores.map(async ({ studentId, score }: { studentId: string; score: number }) => {
      if (!studentId || Number.isNaN(Number(score))) {
        throw new Error('Invalid student score entry');
      }

      return prisma.result.upsert({
        where: {
          id: (await prisma.result.findFirst({ where: { assessmentId, studentId }, select: { id: true } }))?.id ?? '__missing__',
        },
        create: { assessmentId, studentId, score: Number(score) },
        update: { score: Number(score) },
      });
    });

    await Promise.all(promises);
    await prisma.assessment.update({ where: { id: assessmentId }, data: { status: 'Published' } });
    return res.json({ message: 'Scores saved successfully.' });
  } catch (error) {
    console.error('saveScores error:', error);
    return res.status(500).json({ message: 'Unable to save student scores.' });
  }
};

export const getInterventions = async (_req: Request, res: Response) => {
  const interventions = await prisma.intervention.findMany({
    include: { student: true, followUp: true },
    orderBy: { createdAt: 'desc' },
  });

  return res.json(interventions.map((item) => ({
    id: item.id,
    studentId: item.studentId,
    subject: item.subject,
    topic: item.topic,
    assessmentId: item.assessmentId,
    previous: item.previous,
    reason: item.reason,
    action: item.action,
    start: item.startDate,
    followUp: item.followUpDate,
    status: item.status,
    notes: item.notes,
    outcome: item.outcome,
    followUpScore: item.followUpScore,
    student: { id: item.student.id, name: item.student.name, className: item.student.className },
    followUpRecord: item.followUp ? { id: item.followUp.id, score: item.followUp.score, outcome: item.followUp.outcome, date: item.followUp.date } : null,
  })));
};

export const createIntervention = async (req: Request, res: Response) => {
  try {
    const { studentId, subject, topic, assessmentId, previous, reason, action, teacherId, startDate, followUpDate, status, notes } = req.body ?? {};
    if (!studentId || !subject || !topic || !reason || !action || !startDate || !followUpDate) {
      return res.status(400).json({ message: 'Please complete all intervention fields.' });
    }

    const intervention = await prisma.intervention.create({
      data: {
        studentId: String(studentId),
        subject: String(subject),
        topic: String(topic),
        assessmentId: assessmentId ? String(assessmentId) : null,
        previous: previous !== undefined && previous !== null ? Number(previous) : 0,
        reason: String(reason),
        action: String(action),
        teacherId: teacherId ? String(teacherId) : null,
        startDate: new Date(startDate),
        followUpDate: new Date(followUpDate),
        status: status ? String(status) : 'Active',
        notes: notes ? String(notes) : null,
      },
    });

    return res.status(201).json(intervention);
  } catch (error) {
    console.error('createIntervention error:', error);
    return res.status(500).json({ message: 'Unable to create intervention record.' });
  }
};

export const saveFollowUp = async (req: Request, res: Response) => {
  try {
    const { interventionId, score, outcome, date } = req.body ?? {};
    if (!interventionId || !score || !outcome || !date) {
      return res.status(400).json({ message: 'Follow-up details are incomplete.' });
    }

    const followUp = await prisma.followUp.upsert({
      where: { interventionId: String(interventionId) },
      create: {
        interventionId: String(interventionId),
        score: Number(score),
        outcome: String(outcome),
        date: new Date(date),
      },
      update: {
        score: Number(score),
        outcome: String(outcome),
        date: new Date(date),
      },
    });

    await prisma.intervention.update({
      where: { id: String(interventionId) },
      data: {
        status: 'Completed',
        outcome: String(outcome),
        followUpScore: Number(score),
      },
    });

    return res.status(201).json(followUp);
  } catch (error) {
    console.error('saveFollowUp error:', error);
    return res.status(500).json({ message: 'Unable to save follow-up result.' });
  }
};
