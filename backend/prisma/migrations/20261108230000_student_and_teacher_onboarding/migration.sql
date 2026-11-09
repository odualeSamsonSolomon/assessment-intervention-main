ALTER TYPE "UserRole" ADD VALUE 'STUDENT';

ALTER TABLE "User"
ADD COLUMN "isApproved" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "requestedStudentId" TEXT;

ALTER TABLE "Student"
ADD COLUMN "loginUserId" TEXT;

CREATE UNIQUE INDEX "Student_loginUserId_key" ON "Student"("loginUserId");

ALTER TABLE "Student"
ADD CONSTRAINT "Student_loginUserId_fkey"
FOREIGN KEY ("loginUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
