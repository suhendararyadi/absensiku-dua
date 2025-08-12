"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PlusCircle, Loader2 } from 'lucide-react';

const classSchema = z.object({
  className: z.string().min(1, { message: 'Nama kelas tidak boleh kosong.' }),
});

type ClassFormValues = z.infer<typeof classSchema>;

export function AddClassDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: { className: '' },
  });

  const onSubmit = async (data: ClassFormValues) => {
    setIsLoading(true);
    try {
      await addDoc(collection(db, 'classes'), {
        className: data.className,
        studentCount: 0,
        createdAt: serverTimestamp(),
      });
      toast({
        title: 'Sukses',
        description: 'Kelas baru berhasil ditambahkan.',
      });
      form.reset();
      setIsOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Kesalahan',
        description: 'Gagal menambahkan kelas baru.',
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
          Tambah Kelas Baru
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Kelas Baru</DialogTitle>
          <DialogDescription>
            Masukkan nama untuk kelas baru. Klik simpan jika sudah selesai.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="className"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Kelas</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: 10A" {...field} />
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
