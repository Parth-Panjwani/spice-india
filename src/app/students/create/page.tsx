import { Suspense } from 'react';
import IDCardGenerator from '@/components/students/IDCardGenerator';

export default function CreateStudentPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Create Student ID</h2>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <IDCardGenerator />
      </Suspense>
    </div>
  );
}
