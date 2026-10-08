import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();
const hash = (value) => createHash('sha256').update(value).digest('hex');

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@school.edu.ng' },
    update: {
      name: 'Oduale Samson',
      password: hash('password'),
      role: 'ADMIN',
      subject: 'Administration',
      classes: 'All classes',
    },
    create: {
      email: 'admin@school.edu.ng',
      password: hash('password'),
      name: 'Oduale Samson',
      role: 'ADMIN',
      subject: 'Administration',
      classes: 'All classes',
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@school.edu.ng' },
    update: {
      name: 'Ngozi Eze',
      password: hash('password'),
      role: 'TEACHER',
      subject: 'English Language',
      classes: 'SSS1, SSS2',
    },
    create: {
      email: 'teacher@school.edu.ng',
      password: hash('password'),
      name: 'Ngozi Eze',
      role: 'TEACHER',
      subject: 'English Language',
      classes: 'SSS1, SSS2',
    },
  });

  const students = await Promise.all([
    prisma.student.upsert({
      where: { studentId: 'ST-2025-001' },
      update: {},
      create: {
        studentId: 'ST-2025-001',
        name: 'Amaka Nwosu',
        className: 'SSS2',
        gender: 'Female',
        status: 'Active',
        session: '2025/2026',
      },
    }),
    prisma.student.upsert({
      where: { studentId: 'ST-2025-002' },
      update: {},
      create: {
        studentId: 'ST-2025-002',
        name: 'Ibrahim Musa',
        className: 'SSS3',
        gender: 'Male',
        status: 'Active',
        session: '2025/2026',
      },
    }),
    prisma.student.upsert({
      where: { studentId: 'ST-2025-003' },
      update: {},
      create: {
        studentId: 'ST-2025-003',
        name: 'Blessing Eze',
        className: 'SSS1',
        gender: 'Female',
        status: 'Active',
        session: '2025/2026',
      },
    }),
    prisma.student.upsert({
      where: { studentId: 'ST-2025-004' },
      update: {},
      create: {
        studentId: 'ST-2025-004',
        name: 'Tunde Adeyemi',
        className: 'SSS2',
        gender: 'Male',
        status: 'Active',
        session: '2025/2026',
      },
    }),
    prisma.student.upsert({
      where: { studentId: 'ST-2025-005' },
      update: {},
      create: {
        studentId: 'ST-2025-005',
        name: 'Favour Okoro',
        className: 'SSS3',
        gender: 'Female',
        status: 'Active',
        session: '2025/2026',
      },
    }),
  ]);

  const assessment = await prisma.assessment.upsert({
    where: { id: 'seed-assessment-1' },
    update: {},
    create: {
      id: 'seed-assessment-1',
      name: 'Algebra Class Test',
      type: 'Class Test',
      subject: 'Mathematics',
      className: 'SSS2',
      session: '2025/2026',
      term: 'First Term',
      date: new Date('2025-10-14'),
      maxScore: 20,
      status: 'Published',
    },
  });

  await prisma.result.upsert({
    where: { id: 'seed-result-1' },
    update: {},
    create: {
      id: 'seed-result-1',
      assessmentId: assessment.id,
      studentId: students[0].id,
      score: 8,
    },
  });

  console.log(JSON.stringify({ admin: admin.email, teacher: teacher.email, students: students.length, assessment: assessment.name }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
