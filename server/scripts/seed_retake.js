const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding RetakeClasses...");

  const courses = ['WEB108', 'WEB1043', 'PRO1014', 'WEB503', 'WEB2063'];
  const lecturers = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C'];
  const schedules = ['T2, T4 - Ca 1', 'T3, T5 - Ca 2', 'T7, CN - Ca 3'];

  for (const courseId of courses) {
    // Check if course exists
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
        console.log("Course not found:", courseId);
        continue;
    }

    for (let i = 1; i <= 2; i++) {
      await prisma.retakeClass.create({
        data: {
          courseId: courseId,
          lecturerName: lecturers[Math.floor(Math.random() * lecturers.length)],
          schedule: schedules[Math.floor(Math.random() * schedules.length)],
          startDate: new Date('2026-07-01T00:00:00Z'),
          endDate: new Date('2026-08-30T00:00:00Z'),
          totalSeats: 30,
          availableSeats: Math.floor(Math.random() * 20) + 5,
          status: 'OPEN'
        }
      });
    }
  }

  console.log("Seeded successfully.");
}

seed().catch(console.error).finally(() => prisma.$disconnect());
