
"use client";

import { TeacherManagement } from "@/components/teachers/teacher-management";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TeachersPage() {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect non-admins away from this page
    if (!loading && userProfile?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [userProfile, loading, router]);

  // Render nothing or a loading state while checking the role
  if (loading || userProfile?.role !== 'admin') {
    return null; // Or a loading spinner
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Akun Guru</h1>
          <p className="text-muted-foreground">
            Tambah, lihat, atau hapus akun untuk guru.
          </p>
        </div>
      </div>
      <TeacherManagement />
    </div>
  );
}
