
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Edit, Loader2 } from 'lucide-react';

const studentSchema = z.object({
  studentName: z.string().min(1, { message: 'Nama siswa tidak boleh kosong.' }),
  nisn: z.string().min(1, { message: 'NISN tidak boleh kosong.' }),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface EditStudentDialogProps {
  classId: string;
  studentId: string;
  currentStudent: {
    studentName: string;
    nisn: string;
  };
}

export function EditStudentDialog({ classId, studentId, currentStudent }: EditStudentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: currentStudent,
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(currentStudent);
    }
  }, [isOpen, currentStudent, form]);

  const onSubmit = async (data: StudentFormValues) => {
    setIsLoading(true);
    try {
      const studentRef = doc(db, 'classes', classId, 'students', studentId);
      await updateDoc(studentRef, { ...data });
      toast({
        title: 'Sukses',
        description: 'Data siswa berhasil diperbarui.',
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memperbarui data siswa.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const Trigger = (
    <div className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full">
      <Edit className="mr-2 h-4 w-4" />
      <span>Edit</span>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {Trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Data Siswa</DialogTitle>
          <DialogDescription>Ubah data siswa dan klik simpan.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="studentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Siswa</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="nisn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NISN</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
