import { createHash } from 'crypto';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

const hashPassword = (password: string) => createHash('sha256').update(password).digest('hex');

const signToken = (payload: { id: string; email: string; name: string; role: string }) => {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, subject, classes } = req.body ?? {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with that email already exists.' });
    }

    const createdUser = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        password: hashPassword(String(password)),
        role: (role === 'ADMIN' ? 'ADMIN' : 'TEACHER') as 'ADMIN' | 'TEACHER',
        subject: subject ? String(subject) : null,
        classes: classes ? String(classes) : null,
      },
    });

    const token = signToken({
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name,
      role: createdUser.role,
    });

    return res.status(201).json({
      token,
      user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        subject: createdUser.subject,
        classes: createdUser.classes,
      },
    });
  } catch (error) {
    console.error('registerUser error:', error);
    return res.status(500).json({ message: 'Unable to create user account.' });
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
