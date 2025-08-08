
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, BookUser } from 'lucide-react';
import Link from 'next/link';

const registerSchema = z.object({
  email: z.string().email({ message: 'Email tidak valid.' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter.' }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // 2. Create user profile in Firestore with 'guru' role
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: 'guru', // Automatically assign 'guru' role
      });

      toast({
        title: 'Pendaftaran Berhasil',
        description: 'Akun Anda telah dibuat. Anda akan diarahkan ke dashboard.',
      });
      
      // Redirect to dashboard on successful registration
      router.push('/dashboard');

    } catch (error: any) {
        let description = 'Terjadi kesalahan. Silakan coba lagi.';
        switch (error.code) {
            case 'auth/email-already-in-use':
                description = 'Email yang Anda masukkan sudah terdaftar.';
                break;
            case 'auth/weak-password':
                description = 'Password terlalu lemah. Gunakan minimal 6 karakter.';
                break;
            case 'auth/invalid-email':
                 description = 'Format email yang Anda masukkan tidak valid.';
                 break;
            default:
                description = error.message;
        }
       toast({
        variant: 'destructive',
        title: 'Pendaftaran Gagal',
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
           <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
             <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Daftar Akun Guru</CardTitle>
          <CardDescription>Buat akun baru untuk mulai menggunakan AbsensiKu.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="guru@sekolah.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Minimal 6 karakter" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Daftar
              </Button>
            </form>
          </Form>
           <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Sudah punya akun?{' '}
                <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                    Login di sini
                </Link>
              </p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
