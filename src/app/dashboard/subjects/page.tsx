
"use client";

import { SubjectManagement } from "@/components/subjects/subject-management";

export default function SubjectsPage() {
  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Mata Pelajaran</h1>
          <p className="text-muted-foreground">
            Buat mata pelajaran dan kaitkan dengan guru pengajar.
          </p>
        </div>
      </div>
      <SubjectManagement />
    </div>
  );
}
