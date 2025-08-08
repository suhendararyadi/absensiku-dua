"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, updateDoc } from 'firebase/firestore';
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
import { Edit, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const classSchema = z.object({
  className: z.string().min(1, { message: 'Nama kelas tidak boleh kosong.' }),
});

type ClassFormValues = z.infer<typeof classSchema>;

interface EditClassDialogProps {
  classId: string;
  currentClassName: string;
  triggerType?: 'button' | 'menu';
}

export function EditClassDialog({ classId, currentClassName, triggerType = 'button' }: EditClassDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: { className: currentClassName },
  });
  
  useEffect(() => {
    if(isOpen) {
        form.reset({ className: currentClassName });
    }
  }, [isOpen, currentClassName, form]);


  const onSubmit = async (data: ClassFormValues) => {
    setIsLoading(true);
    try {
      const classRef = doc(db, 'classes', classId);
      await updateDoc(classRef, {
        className: data.className,
      });
      toast({
        title: 'Sukses',
        description: 'Nama kelas berhasil diperbarui.',
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memperbarui nama kelas.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const Trigger = triggerType === 'button' ? (
     <Button variant="outline" size="icon">
        <Edit className="h-4 w-4" />
        <span className="sr-only">Edit Kelas</span>
    </Button>
  ) : (
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
          <DialogTitle>Edit Nama Kelas</DialogTitle>
          <DialogDescription>
            Ubah nama kelas dan klik simpan untuk menerapkan perubahan.
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
