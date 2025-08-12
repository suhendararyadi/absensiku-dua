
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
import { useAuth } from "@/hooks/use-auth";

export default function ClassesPage() {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daftar Kelas</h1>
          <p className="text-muted-foreground">
            Kelola kelas, siswa, dan absensi harian Anda.
          </p>
        </div>
        {isAdmin && <AddClassDialog />}
      </div>
      <ClassList />
    </div>
  );
}
