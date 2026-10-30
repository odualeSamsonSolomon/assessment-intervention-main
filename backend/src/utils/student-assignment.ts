import { randomInt } from 'node:crypto';
import type { Prisma } from '@prisma/client';

const shuffle = <T>(items: T[]) => {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
};

export const rebalanceStudentsAcrossTeachers = async (transaction: Prisma.TransactionClient) => {
  const [teachers, students] = await Promise.all([
    transaction.user.findMany({ where: { role: 'TEACHER' }, select: { id: true } }),
    transaction.student.findMany({ select: { id: true } }),
  ]);

  if (!teachers.length || !students.length) return;

  const randomizedTeachers = shuffle(teachers);
  const randomizedStudents = shuffle(students);
  await Promise.all(randomizedTeachers.map((teacher, teacherIndex) => {
    const studentIds = randomizedStudents
      .filter((_student, studentIndex) => studentIndex % randomizedTeachers.length === teacherIndex)
      .map((student) => student.id);

    return transaction.student.updateMany({
      where: { id: { in: studentIds } },
      data: { teacherId: teacher.id },
    });
  }));
};
