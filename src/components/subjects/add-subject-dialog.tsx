
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Loader2 } from 'lucide-react';

const subjectSchema = z.object({
  subjectName: z.string().min(1, { message: 'Nama mata pelajaran tidak boleh kosong.' }),
  teacherId: z.string().min(1, { message: 'Guru harus dipilih.' }),
});

type SubjectFormValues = z.infer<typeof subjectSchema>;

interface Teacher {
    id: string;
    email: string;
}

export function AddSubjectDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    const fetchTeachers = async () => {
        const q = query(collection(db, 'users'), where('role', '==', 'guru'));
        const snapshot = await getDocs(q);
        const teachersData: Teacher[] = [];
        snapshot.forEach(doc => teachersData.push({ id: doc.id, ...doc.data() } as Teacher));
        setTeachers(teachersData);
    };

    fetchTeachers();
  }, [isOpen]);

  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { subjectName: '', teacherId: '' },
  });

  const onSubmit = async (data: SubjectFormValues) => {
    setIsLoading(true);
    try {
      const selectedTeacher = teachers.find(t => t.id === data.teacherId);
      if (!selectedTeacher) {
        throw new Error("Guru tidak ditemukan");
      }
      
      await addDoc(collection(db, 'subjects'), {
        subjectName: data.subjectName,
        teacherId: data.teacherId,
        teacherName: selectedTeacher.email, // Storing teacher email for easy display
      });
      toast({
        title: 'Sukses',
        description: 'Mata pelajaran baru berhasil ditambahkan.',
      });
      form.reset();
      setIsOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menambahkan mata pelajaran baru.',
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
          Tambah Mata Pelajaran
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Mata Pelajaran</DialogTitle>
          <DialogDescription>
            Isi detail mata pelajaran dan pilih guru pengajarnya.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="subjectName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Mata Pelajaran</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Matematika" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="teacherId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guru Pengajar</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih guru" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {teachers.map(teacher => (
                                <SelectItem key={teacher.id} value={teacher.id}>{teacher.email}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
