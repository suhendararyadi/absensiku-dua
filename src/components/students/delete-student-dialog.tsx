"use client";

import { useState } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';

interface DeleteStudentDialogProps {
  classId: string;
  studentId: string;
  studentName: string;
}

export function DeleteStudentDialog({ classId, studentId, studentName }: DeleteStudentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsLoading(true);
    try {
        const classRef = doc(db, "classes", classId);
        const studentRef = doc(db, "classes", classId, "students", studentId);

        await runTransaction(db, async (transaction) => {
            const classDoc = await transaction.get(classRef);
            if (!classDoc.exists()) {
                throw "Kelas tidak ditemukan!";
            }

            transaction.delete(studentRef);

            const newStudentCount = Math.max(0, (classDoc.data().studentCount || 0) - 1);
            transaction.update(classRef, { studentCount: newStudentCount });
        });

      toast({
        title: 'Sukses',
        description: `Siswa ${studentName} berhasil dihapus.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Kesalahan',
        description: `Gagal menghapus siswa: ${error}`,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const Trigger = (
    <div className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full focus:bg-accent focus:text-destructive">
      <Trash2 className="mr-2 h-4 w-4" />
      <span>Hapus</span>
    </div>
  )

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {Trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini akan menghapus siswa <span className="font-bold">{studentName}</span> secara permanen. Aksi ini tidak dapat diurungkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ya, Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
