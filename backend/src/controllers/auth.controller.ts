import { createHash } from 'node:crypto';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { rebalanceStudentsAcrossTeachers } from '../utils/student-assignment.js';

const hashPassword = (password: string) => createHash('sha256').update(password).digest('hex');

const signToken = (payload: { id: string; email: string; name: string; role: string }) => {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
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

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    const createdUser = await prisma.$transaction(async (transaction) => {
      const admin = await transaction.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });
      if (admin) throw new Error('ADMIN_ALREADY_EXISTS');
      return transaction.user.create({
        data: {
          name: String(name).trim(),
          email: normalizedEmail,
          password: hashPassword(String(password)),
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

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    const teacher = await prisma.$transaction(async (transaction) => {
      const createdTeacher = await transaction.user.create({
        data: {
          name: String(name).trim(),
          email: normalizedEmail,
          password: hashPassword(String(password)),
          role: 'TEACHER',
          subject: String(subject).trim(),
          classes: classes ? String(classes).trim() : null,
        },
      });
      await rebalanceStudentsAcrossTeachers(transaction);
      return createdTeacher;
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

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordMatches = user.password === hashPassword(String(password));
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
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
