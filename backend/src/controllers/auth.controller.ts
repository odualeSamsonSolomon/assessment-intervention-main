import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { getJwtSecret, hashPassword, isLegacyPasswordHash, verifyPassword } from '../utils/security.js';

const signToken = (payload: { id: string; email: string; name: string; role: string }) => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
};

export const getSetupStatus = async (_req: Request, res: Response) => {
  try {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });
    return res.json({ needsAdminSetup: !admin });
  } catch (error) {
    console.error('getSetupStatus error:', error);
    return res.status(500).json({ message: 'Unable to check setup status.' });
  }
};

export const setupAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body ?? {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    if (String(password).length < 12) {
      return res.status(400).json({ message: 'Password must be at least 12 characters.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    getJwtSecret();
    const passwordHash = await hashPassword(String(password));
    const createdUser = await prisma.$transaction(async (transaction) => {
      const admin = await transaction.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });
      if (admin) throw new Error('ADMIN_ALREADY_EXISTS');
      return transaction.user.create({
        data: {
          name: String(name).trim(),
          email: normalizedEmail,
          password: passwordHash,
          role: 'ADMIN',
          subject: 'Administration',
          classes: 'All classes',
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    const token = signToken({ id: createdUser.id, email: createdUser.email, name: createdUser.name, role: createdUser.role });
    return res.status(201).json({
      token,
      user: { id: createdUser.id, name: createdUser.name, email: createdUser.email, role: createdUser.role },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'ADMIN_ALREADY_EXISTS') {
      return res.status(409).json({ message: 'An administrator account already exists.' });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ message: 'A user with that email already exists.' });
    }
    console.error('registerUser error:', error);
    return res.status(500).json({ message: 'Unable to create administrator account.' });
  }
};

export const createTeacher = async (req: Request, res: Response) => {
  try {
    const { name, email, password, subject, classes } = req.body ?? {};
    if (!name || !email || !password || !subject) {
      return res.status(400).json({ message: 'Name, email, password and subject are required.' });
    }
    if (String(password).length < 12) {
      return res.status(400).json({ message: 'Password must be at least 12 characters.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    const passwordHash = await hashPassword(String(password));
    const teacher = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        password: passwordHash,
        role: 'TEACHER',
        subject: String(subject).trim(),
        classes: classes ? String(classes).trim() : null,
        isApproved: true,
      },
    });
    return res.status(201).json({
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      role: teacher.role,
      subject: teacher.subject,
      classes: teacher.classes,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ message: 'A user with that email already exists.' });
    }
    console.error('createTeacher error:', error);
    return res.status(500).json({ message: 'Unable to create teacher account.' });
  }
};

export const registerTeacher = async (req: Request, res: Response) => {
  try {
    const { name, email, password, subject, classes } = req.body ?? {};
    if (!name || !email || !password || !subject) {
      return res.status(400).json({ message: 'Name, email, password and subject are required.' });
    }
    if (String(password).length < 12 || String(password).length > 256) {
      return res.status(400).json({ message: 'Password must be between 12 and 256 characters.' });
    }
    if (String(name).trim().length > 120 || String(subject).trim().length > 120 || String(classes ?? '').trim().length > 250) {
      return res.status(400).json({ message: 'Name, subject, or class information is too long.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        password: await hashPassword(String(password)),
        role: 'TEACHER',
        subject: String(subject).trim(),
        classes: classes ? String(classes).trim() : null,
        isApproved: false,
      },
    });

    return res.status(201).json({
      message: 'Your teacher account request was submitted. An administrator must approve it before you can sign in.',
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ message: 'A user with that email already exists.' });
    }
    console.error('registerTeacher error:', error);
    return res.status(500).json({ message: 'Unable to submit teacher registration.' });
  }
};

export const getPendingTeachers = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: 'TEACHER', isApproved: false },
      select: { id: true, name: true, email: true, subject: true, classes: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return res.json(teachers);
  } catch (error) {
    console.error('getPendingTeachers error:', error);
    return res.status(500).json({ message: 'Unable to load pending teacher registrations.' });
  }
};

export const approveTeacher = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await prisma.user.updateMany({
      where: { id: String(req.params.teacherId), role: 'TEACHER', isApproved: false },
      data: { isApproved: true },
    });
    if (!result.count) return res.status(404).json({ message: 'Pending teacher registration not found.' });
    return res.json({ message: 'Teacher account approved.' });
  } catch (error) {
    console.error('approveTeacher error:', error);
    return res.status(500).json({ message: 'Unable to approve teacher account.' });
  }
};

export const rejectTeacher = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await prisma.user.deleteMany({
      where: { id: String(req.params.teacherId), role: 'TEACHER', isApproved: false },
    });
    if (!result.count) return res.status(404).json({ message: 'Pending teacher registration not found.' });
    return res.status(204).send();
  } catch (error) {
    console.error('rejectTeacher error:', error);
    return res.status(500).json({ message: 'Unable to reject teacher registration.' });
  }
};

export const registerStudent = async (req: Request, res: Response) => {
  try {
    const { name, email, password, studentId } = req.body ?? {};
    if (!name || !email || !password || !studentId) {
      return res.status(400).json({ message: 'Full name, email, student ID and password are required.' });
    }
    if (String(password).length < 12 || String(password).length > 256) {
      return res.status(400).json({ message: 'Password must be between 12 and 256 characters.' });
    }
    if (String(name).trim().length > 120 || String(studentId).trim().length > 64) {
      return res.status(400).json({ message: 'Name or student ID is too long.' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        password: await hashPassword(String(password)),
        role: 'STUDENT',
        isApproved: false,
        requestedStudentId: String(studentId).trim(),
      },
    });
    return res.status(201).json({
      message: 'Registration submitted. Your account will remain locked until a school administrator verifies your details and approves it.',
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ message: 'An account with that email address already exists.' });
    }
    console.error('registerStudent error:', error);
    return res.status(500).json({ message: 'Unable to submit student registration.' });
  }
};

export const getPendingStudents = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT', isApproved: false },
      select: { id: true, name: true, email: true, requestedStudentId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return res.json(students);
  } catch (error) {
    console.error('getPendingStudents error:', error);
    return res.status(500).json({ message: 'Unable to load pending student registrations.' });
  }
};

export const approveStudent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentRecordId = String(req.body?.studentRecordId || '');
    if (!studentRecordId) return res.status(400).json({ message: 'Select the verified student record to link.' });

    await prisma.$transaction(async (transaction) => {
      const account = await transaction.user.findFirst({
        where: { id: String(req.params.userId), role: 'STUDENT', isApproved: false },
      });
      if (!account) throw new Error('PENDING_STUDENT_NOT_FOUND');

      const student = await transaction.student.findUnique({
        where: { id: studentRecordId },
        select: { id: true, studentId: true, name: true, status: true, loginUserId: true },
      });
      if (!student || student.studentId !== account.requestedStudentId || student.status !== 'Active' || student.loginUserId) {
        throw new Error('STUDENT_RECORD_NOT_MATCHED');
      }

      await transaction.user.update({
        where: { id: account.id },
        data: {
          name: student.name,
          isApproved: true,
          studentProfile: { connect: { id: student.id } },
        },
      });
    });
    return res.json({ message: 'Student account approved and linked to the verified student record.' });
  } catch (error) {
    if (error instanceof Error && error.message === 'PENDING_STUDENT_NOT_FOUND') {
      return res.status(404).json({ message: 'Pending student registration not found.' });
    }
    if (error instanceof Error && error.message === 'STUDENT_RECORD_NOT_MATCHED') {
      return res.status(409).json({ message: 'The selected record is inactive, already linked, or its student ID does not match the registration.' });
    }
    console.error('approveStudent error:', error);
    return res.status(500).json({ message: 'Unable to approve student registration.' });
  }
};

export const rejectStudent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await prisma.user.deleteMany({
      where: { id: String(req.params.userId), role: 'STUDENT', isApproved: false },
    });
    if (!result.count) return res.status(404).json({ message: 'Pending student registration not found.' });
    return res.status(204).send();
  } catch (error) {
    console.error('rejectStudent error:', error);
    return res.status(500).json({ message: 'Unable to reject student registration.' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    getJwtSecret();
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordMatches = await verifyPassword(String(password), user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: 'Your account is awaiting administrator approval.' });
    }
    if (user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { loginUserId: user.id }, select: { status: true } });
      if (!student || student.status !== 'Active') {
        return res.status(403).json({ message: 'This student portal account is inactive. Contact your school administrator.' });
      }
    }

    if (isLegacyPasswordHash(user.password)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: await hashPassword(String(password)) },
      });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        subject: user.subject,
        classes: user.classes,
      },
    });
  } catch (error) {
    console.error('loginUser error:', error);
    return res.status(500).json({ message: 'Unable to authenticate user.' });
  }
};

export const getCurrentUser = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        subject: true,
        classes: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('getCurrentUser error:', error);
    return res.status(500).json({ message: 'Unable to load user profile.' });
  }
};
