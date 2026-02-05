import connectToDatabase from '@/lib/db';
import Student from '@/models/Student';
import StudentManager from '@/components/students/StudentManager';

export const dynamic = 'force-dynamic';

async function getStudents() {
  await connectToDatabase();
  const students = await Student.find({}).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(students));
}

export default async function StudentsPage() {
  const students = await getStudents();

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">Student ID Cards</h2>
      <StudentManager initialStudents={students} />
    </div>
  );
}
