import type { Request, Response } from 'express';
import { randomInt } from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { seniorSecondarySubjects } from '../utils/senior-secondary-subjects.js';

const teacherIdFor = (req: AuthenticatedRequest) =>
  req.user?.role === 'TEACHER' ? req.user.id : undefined;

const assessmentWhereFor = async (teacherId?: string) => {
  if (!teacherId) return {};

  const assignedClasses = await prisma.student.findMany({
    where: { teacherId },
    select: { className: true },
    distinct: ['className'],
  });

  return {
    OR: [
      { teacherId },
      { className: { in: assignedClasses.map((student) => student.className) } },
    ],
  };
};

export const getDashboardData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teacherId = teacherIdFor(req);
    const assessmentWhere = await assessmentWhereFor(teacherId);
    const [students, assessments, results, interventions, followUps, users, subjects] = await Promise.all([
      prisma.student.findMany({
        where: teacherId ? { teacherId } : {},
        include: {
          teacher: { select: { id: true, name: true } },
          loginUser: { select: { isApproved: true } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.assessment.findMany({ where: assessmentWhere, orderBy: { date: 'desc' } }),
      prisma.result.findMany({ where: teacherId ? { student: { teacherId } } : {}, include: { assessment: true, student: true } }),
      prisma.intervention.findMany({ where: teacherId ? { student: { teacherId } } : {}, include: { student: true, followUp: true, teacher: { select: { id: true, name: true } } } }),
      prisma.followUp.findMany({ where: teacherId ? { intervention: { student: { teacherId } } } : {}, include: { intervention: true } }),
      prisma.user.findMany({ where: teacherId ? { id: teacherId, isApproved: true } : { isApproved: true }, orderBy: { name: 'asc' } }),
      prisma.subject.findMany({ include: { topics: { orderBy: { name: 'asc' } } }, orderBy: { name: 'asc' } }),
    ]);

    const needsIntervention = results.filter((result) => {
      const max = result.assessment.maxScore || 100;
      return max > 0 && (result.score / max) * 100 < 60;
    }).length;

    return res.json({
      user: req.user,
      students: students.map(({ loginUser, ...student }) => ({
        ...student,
        portalAccountStatus: loginUser ? (loginUser.isApproved ? 'active' : 'pending') : 'none',
      })),
      assessments,
      results: results.map((result) => ({
        id: result.id,
        assessmentId: result.assessmentId,
        studentId: result.studentId,
        score: result.score,
        assessment: { id: result.assessment.id, name: result.assessment.name, subject: result.assessment.subject, max: result.assessment.maxScore },
        student: { id: result.student.id, studentId: result.student.studentId, name: result.student.name, className: result.student.className },
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
        teacher: intervention.teacher,
        start: intervention.startDate,
        followUp: intervention.followUpDate,
        status: intervention.status,
        notes: intervention.notes,
        outcome: intervention.outcome,
        followUpScore: intervention.followUpScore,
        student: { id: intervention.student.id, studentId: intervention.student.studentId, name: intervention.student.name, className: intervention.student.className },
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
      subjects,
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

export const getStudents = async (req: AuthenticatedRequest, res: Response) => {
  const teacherId = teacherIdFor(req);
  const students = await prisma.student.findMany({
    where: teacherId ? { teacherId } : {},
    include: {
      teacher: { select: { id: true, name: true } },
      loginUser: { select: { isApproved: true } },
    },
    orderBy: { name: 'asc' },
  });
  return res.json(students.map(({ loginUser, ...student }) => ({
    ...student,
    portalAccountStatus: loginUser ? (loginUser.isApproved ? 'active' : 'pending') : 'none',
  })));
};

export const createStudent = async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};
    const { name, className, gender, status, session, studentId } = body;
    if (!name || !className || !session || !studentId) {
      return res.status(400).json({ message: 'Student ID, name, class and session are required.' });
    }

    let teacherId: string | null = null;
    if (Object.hasOwn(body, 'teacherId')) {
      teacherId = body.teacherId ? String(body.teacherId) : null;
      if (teacherId && !await prisma.user.findFirst({
        where: { id: teacherId, role: 'TEACHER', isApproved: true },
        select: { id: true },
      })) {
        return res.status(400).json({ message: 'Select an approved teacher or leave the student unassigned.' });
      }
    } else {
      const teachers = await prisma.user.findMany({
        where: { role: 'TEACHER', isApproved: true },
        select: { id: true, _count: { select: { students: true } } },
      });
      const minimumLoad = teachers.length ? Math.min(...teachers.map((teacher) => teacher._count.students)) : 0;
      const leastLoadedTeachers = teachers.filter((teacher) => teacher._count.students === minimumLoad);
      teacherId = leastLoadedTeachers.length ? leastLoadedTeachers[randomInt(leastLoadedTeachers.length)].id : null;
    }

    const student = await prisma.student.create({
      data: {
        studentId: String(studentId),
        name: String(name),
        className: String(className),
        gender: gender ? String(gender) : null,
        status: status ? String(status) : 'Active',
        session: String(session),
        teacherId,
      },
      include: { teacher: { select: { id: true, name: true } } },
    });

    return res.status(201).json(student);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(409).json({ message: 'A student with that ID already exists.' });
    }
    console.error('createStudent error:', error);
    return res.status(500).json({ message: 'Unable to create student record.' });
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};
    const { name, className, gender, status, session, teacherId } = body;
    if (!name || !className || !session) {
      return res.status(400).json({ message: 'Student name, class and session are required.' });
    }

    if (Object.hasOwn(body, 'teacherId') && teacherId && !await prisma.user.findFirst({
      where: { id: String(teacherId), role: 'TEACHER', isApproved: true },
      select: { id: true },
    })) {
      return res.status(400).json({ message: 'Select an approved teacher or leave the student unassigned.' });
    }

    const student = await prisma.student.update({
      where: { studentId: String(req.params.studentId) },
      data: {
        name: String(name),
        className: String(className),
        gender: gender ? String(gender) : null,
        status: status ? String(status) : 'Active',
        session: String(session),
        ...(Object.hasOwn(body, 'teacherId') ? { teacherId: teacherId ? String(teacherId) : null } : {}),
      },
      include: { teacher: { select: { id: true, name: true } } },
    });

    return res.json(student);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ message: 'Student record not found.' });
    }
    console.error('updateStudent error:', error);
    return res.status(500).json({ message: 'Unable to update student record.' });
  }
};

export const getAssessments = async (req: AuthenticatedRequest, res: Response) => {
  const assessments = await prisma.assessment.findMany({ where: await assessmentWhereFor(teacherIdFor(req)), orderBy: { date: 'desc' } });
  return res.json(assessments);
};

export const getSubjects = async (_req: Request, res: Response) => {
  const subjects = await prisma.subject.findMany({
    include: { topics: { orderBy: { name: 'asc' } } },
    orderBy: { name: 'asc' },
  });
  return res.json(subjects);
};

export const createSubject = async (req: Request, res: Response) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ message: 'Subject name is required.' });
    const subject = await prisma.subject.create({ data: { name } });
    return res.status(201).json(subject);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(409).json({ message: 'That subject already exists.' });
    }
    console.error('createSubject error:', error);
    return res.status(500).json({ message: 'Unable to create subject.' });
  }
};

export const addStandardSubjects = async (_req: Request, res: Response) => {
  try {
    const existing = await prisma.subject.findMany({ select: { name: true } });
    const existingNames = new Set(existing.map((subject) => subject.name.trim().toLocaleLowerCase()));
    const missingNames = seniorSecondarySubjects.filter((name) => !existingNames.has(name.toLocaleLowerCase()));
    const result = await prisma.subject.createMany({
      data: missingNames.map((name) => ({ name })),
      skipDuplicates: true,
    });
    return res.status(201).json({ added: result.count, total: seniorSecondarySubjects.length });
  } catch (error) {
    console.error('addStandardSubjects error:', error);
    return res.status(500).json({ message: 'Unable to add standard subjects.' });
  }
};

export const updateSubject = async (req: Request, res: Response) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ message: 'Subject name is required.' });
    const subject = await prisma.$transaction(async (transaction) => {
      const current = await transaction.subject.findUnique({ where: { id: String(req.params.subjectId) } });
      if (!current) return null;
      const updated = await transaction.subject.update({
        where: { id: current.id },
        data: { name },
        include: { topics: { orderBy: { name: 'asc' } } },
      });
      if (current.name !== name) {
        await Promise.all([
          transaction.assessment.updateMany({ where: { subject: current.name }, data: { subject: name } }),
          transaction.intervention.updateMany({ where: { subject: current.name }, data: { subject: name } }),
        ]);
      }
      return updated;
    });
    if (!subject) return res.status(404).json({ message: 'Subject not found.' });
    return res.json(subject);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(409).json({ message: 'That subject already exists.' });
    }
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ message: 'Subject not found.' });
    }
    console.error('updateSubject error:', error);
    return res.status(500).json({ message: 'Unable to update subject.' });
  }
};

export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const subject = await prisma.subject.findUnique({ where: { id: String(req.params.subjectId) } });
    if (!subject) return res.status(404).json({ message: 'Subject not found.' });
    const [assessments, interventions] = await Promise.all([
      prisma.assessment.count({ where: { subject: subject.name } }),
      prisma.intervention.count({ where: { subject: subject.name } }),
    ]);
    if (assessments || interventions) {
      return res.status(409).json({ message: 'This subject is used by existing assessments or interventions.' });
    }
    await prisma.subject.delete({ where: { id: subject.id } });
    return res.status(204).send();
  } catch (error) {
    console.error('deleteSubject error:', error);
    return res.status(500).json({ message: 'Unable to delete subject.' });
  }
};

export const createTopic = async (req: Request, res: Response) => {
  try {
    const name = String(req.body?.name || '').trim();
    const subjectId = String(req.params.subjectId);
    if (!name) return res.status(400).json({ message: 'Topic name is required.' });
    const topic = await prisma.topic.create({ data: { name, subjectId } });
    return res.status(201).json(topic);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(409).json({ message: 'That topic already exists for this subject.' });
    }
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return res.status(404).json({ message: 'Subject not found.' });
    }
    console.error('createTopic error:', error);
    return res.status(500).json({ message: 'Unable to create topic.' });
  }
};

export const updateTopic = async (req: Request, res: Response) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ message: 'Topic name is required.' });
    const topic = await prisma.$transaction(async (transaction) => {
      const current = await transaction.topic.findUnique({
        where: { id: String(req.params.topicId) },
        include: { subject: true },
      });
      if (!current) return null;
      const updated = await transaction.topic.update({ where: { id: current.id }, data: { name } });
      if (current.name !== name) {
        await transaction.intervention.updateMany({
          where: { subject: current.subject.name, topic: current.name },
          data: { topic: name },
        });
      }
      return updated;
    });
    if (!topic) return res.status(404).json({ message: 'Topic not found.' });
    return res.json(topic);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(409).json({ message: 'That topic already exists for this subject.' });
    }
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ message: 'Topic not found.' });
    }
    console.error('updateTopic error:', error);
    return res.status(500).json({ message: 'Unable to update topic.' });
  }
};

export const deleteTopic = async (req: Request, res: Response) => {
  try {
    const topic = await prisma.topic.findUnique({
      where: { id: String(req.params.topicId) },
      include: { subject: true },
    });
    if (!topic) return res.status(404).json({ message: 'Topic not found.' });
    const interventions = await prisma.intervention.count({ where: { subject: topic.subject.name, topic: topic.name } });
    if (interventions) {
      return res.status(409).json({ message: 'This topic is used by existing interventions.' });
    }
    await prisma.topic.delete({ where: { id: topic.id } });
    return res.status(204).send();
  } catch (error) {
    console.error('deleteTopic error:', error);
    return res.status(500).json({ message: 'Unable to delete topic.' });
  }
};

export const createAssessment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, type, subject, className, session, term, date, maxScore, status } = req.body ?? {};
    if (!name || !type || !subject || !className || !session || !term || !date || !maxScore) {
      return res.status(400).json({ message: 'Please complete all assessment fields.' });
    }

    const teacherId = teacherIdFor(req);
    if (teacherId && !await prisma.student.findFirst({ where: { teacherId, className: String(className) }, select: { id: true } })) {
      return res.status(403).json({ message: 'Assessments can only be created for your assigned classes.' });
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
        teacherId,
      },
    });

    return res.status(201).json(assessment);
  } catch (error) {
    console.error('createAssessment error:', error);
    return res.status(500).json({ message: 'Unable to save the assessment.' });
  }
};

export const getResults = async (req: AuthenticatedRequest, res: Response) => {
  const teacherId = teacherIdFor(req);
  const results = await prisma.result.findMany({
    where: teacherId ? { student: { teacherId } } : {},
    include: { assessment: true, student: true },
    orderBy: { createdAt: 'desc' },
  });

  return res.json(results.map((result) => ({
    id: result.id,
    assessmentId: result.assessmentId,
    studentId: result.studentId,
    score: result.score,
    assessment: { id: result.assessment.id, name: result.assessment.name, subject: result.assessment.subject, max: result.assessment.maxScore },
    student: { id: result.student.id, studentId: result.student.studentId, name: result.student.name, className: result.student.className },
  })));
};

export const saveScores = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { assessmentId, scores } = req.body ?? {};
    if (!assessmentId || !Array.isArray(scores)) {
      return res.status(400).json({ message: 'Assessment ID and scores are required.' });
    }

    const teacherId = teacherIdFor(req);
    if (teacherId) {
      const assessment = await prisma.assessment.findUnique({
        where: { id: String(assessmentId) },
        select: { id: true, teacherId: true, className: true },
      });
      if (!assessment) return res.status(404).json({ message: 'Assessment not found.' });
      if (assessment.teacherId && assessment.teacherId !== teacherId) {
        return res.status(403).json({ message: 'You cannot enter scores for this assessment.' });
      }

      const uniqueStudentIds = [...new Set(scores.map((entry: { studentId: string }) => String(entry.studentId)))];
      const assignedStudents = await prisma.student.count({
        where: {
          id: { in: uniqueStudentIds },
          teacherId,
          className: assessment.className,
        },
      });
      if (assignedStudents !== uniqueStudentIds.length) {
        return res.status(403).json({ message: 'Scores can only be entered for your assigned students in this class.' });
      }
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

export const getInterventions = async (req: AuthenticatedRequest, res: Response) => {
  const teacherId = teacherIdFor(req);
  const interventions = await prisma.intervention.findMany({
    where: teacherId ? { student: { teacherId } } : {},
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
    student: { id: item.student.id, studentId: item.student.studentId, name: item.student.name, className: item.student.className },
    followUpRecord: item.followUp ? { id: item.followUp.id, score: item.followUp.score, outcome: item.followUp.outcome, date: item.followUp.date } : null,
  })));
};

export const createIntervention = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId, subject, topic, assessmentId, previous, reason, action, teacherId: requestedTeacherId, startDate, followUpDate, status, notes } = req.body ?? {};
    if (!studentId || !subject || !topic || !reason || !action || !startDate || !followUpDate) {
      return res.status(400).json({ message: 'Please complete all intervention fields.' });
    }

    const teacherId = teacherIdFor(req);
    if (teacherId && !await prisma.student.findFirst({ where: { id: String(studentId), teacherId }, select: { id: true } })) {
      return res.status(403).json({ message: 'Interventions can only be created for your assigned students.' });
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
        teacherId: teacherId ?? (requestedTeacherId ? String(requestedTeacherId) : null),
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

export const saveFollowUp = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { interventionId, score, outcome, date } = req.body ?? {};
    if (!interventionId || score === undefined || score === null || !Number.isFinite(Number(score)) || !outcome || !date) {
      return res.status(400).json({ message: 'Follow-up details are incomplete.' });
    }
    if (Number(score) < 0 || Number(score) > 100) {
      return res.status(400).json({ message: 'Follow-up score must be between 0 and 100.' });
    }

    const teacherId = teacherIdFor(req);
    if (teacherId && !await prisma.intervention.findFirst({
      where: { id: String(interventionId), student: { teacherId } },
      select: { id: true },
    })) {
      return res.status(403).json({ message: 'Follow-ups can only be recorded for your assigned students.' });
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

export const getStudentDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'STUDENT') {
      return res.status(403).json({ message: 'Student portal access required.' });
    }

    const student = await prisma.student.findFirst({
      where: {
        loginUserId: req.user.id,
        status: 'Active',
        loginUser: { isApproved: true },
      },
      select: {
        id: true,
        studentId: true,
        name: true,
        className: true,
        session: true,
        results: {
          where: { assessment: { status: 'Published' } },
          select: {
            id: true,
            score: true,
            assessment: {
              select: { id: true, name: true, subject: true, type: true, date: true, maxScore: true, term: true, session: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        interventions: {
          select: {
            id: true,
            subject: true,
            topic: true,
            startDate: true,
            followUpDate: true,
            status: true,
            outcome: true,
            followUpScore: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) return res.status(403).json({ message: 'Student portal account is inactive or unavailable.' });

    return res.json({
      user: { ...req.user, name: student.name },
      student: {
        studentId: student.studentId,
        name: student.name,
        className: student.className,
        session: student.session,
      },
      results: student.results.map((result) => ({
        id: result.id,
        score: result.score,
        assessment: { ...result.assessment, max: result.assessment.maxScore },
      })),
      interventions: student.interventions,
    });
  } catch (error) {
    console.error('getStudentDashboard error:', error);
    return res.status(500).json({ message: 'Unable to load student portal data.' });
  }
};
