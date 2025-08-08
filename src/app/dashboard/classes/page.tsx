
"use client";

import { AddClassDialog } from "@/components/dashboard/add-class-dialog";
import { ClassList } from "@/components/dashboard/class-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ClassesPage() {
  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daftar Kelas</h1>
          <p className="text-muted-foreground">
            Kelola kelas, siswa, dan absensi harian Anda.
          </p>
        </div>
        <AddClassDialog />
      </div>
      <ClassList />
    </div>
  );
}
