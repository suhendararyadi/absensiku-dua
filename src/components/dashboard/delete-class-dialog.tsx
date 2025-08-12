"use client";

import { useState } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';

interface DeleteClassDialogProps {
  classId: string;
  className: string;
  triggerType?: 'button' | 'menu';
}

export function DeleteClassDialog({ classId, className, triggerType = 'button' }: DeleteClassDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Note: Deleting a class document does not automatically delete its subcollections (students, attendance).
  // For a production app, a Cloud Function would be needed to handle cascading deletes.
  // This implementation only deletes the class document itself.

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, 'classes', classId));
      toast({
        title: 'Sukses',
        description: `Kelas ${className} berhasil dihapus.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Kesalahan',
        description: 'Gagal menghapus kelas.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const Trigger = triggerType === 'button' ? (
    <Button variant="destructive" size="icon">
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Hapus Kelas</span>
    </Button>
  ) : (
     <div className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-destructive focus:bg-accent focus:text-destructive">
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
            Tindakan ini akan menghapus kelas <span className="font-bold">{className}</span>. 
            Data siswa dan absensi terkait TIDAK akan terhapus secara otomatis. Aksi ini tidak dapat diurungkan.
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
