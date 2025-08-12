
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, doc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PlusCircle, Loader2 } from 'lucide-react';

const studentSchema = z.object({
  studentName: z.string().min(1, { message: 'Nama siswa tidak boleh kosong.' }),
  nisn: z.string().min(1, { message: 'NISN tidak boleh kosong.' }),
});

type StudentFormValues = z.infer<typeof studentSchema>;

export function AddStudentDialog({ classId }: { classId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: { studentName: '', nisn: '' },
  });

  const onSubmit = async (data: StudentFormValues) => {
    setIsLoading(true);
    try {
        const classRef = doc(db, "classes", classId);
        
        await runTransaction(db, async (transaction) => {
            const classDoc = await transaction.get(classRef);
            if (!classDoc.exists()) {
                throw "Kelas tidak ditemukan!";
            }

            const newStudentRef = doc(collection(db, "classes", classId, "students"));
            transaction.set(newStudentRef, { ...data });

            const newStudentCount = (classDoc.data().studentCount || 0) + 1;
            transaction.update(classRef, { studentCount: newStudentCount });
        });
      
      toast({
        title: 'Sukses',
        description: 'Siswa baru berhasil ditambahkan.',
      });
      form.reset();
      setIsOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Kesalahan',
        description: `Gagal menambahkan siswa: ${error}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Tambah Siswa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Siswa Baru</DialogTitle>
          <DialogDescription>Masukkan nama dan NISN untuk siswa baru.</DialogDescription>
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
                    <Input placeholder="Contoh: Budi" {...field} />
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
                    <Input placeholder="Nomor Induk Siswa Nasional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
