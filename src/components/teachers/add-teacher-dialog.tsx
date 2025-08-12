
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, UserPlus, Database } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export function AddTeacherDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Cara Tambah Akun Guru
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cara Menambah Akun Guru (Manual)</DialogTitle>
          <DialogDescription>
            Untuk alasan keamanan, penambahan akun guru dilakukan melalui Firebase Console.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
            <Alert>
                <UserPlus className="h-4 w-4" />
                <AlertTitle>Langkah 1: Buat Akun di Firebase Authentication</AlertTitle>
                <AlertDescription>
                    <ol className="list-decimal pl-5 space-y-1 mt-2">
                        <li>Buka Firebase Console project Anda.</li>
                        <li>Masuk ke bagian <strong>Authentication</strong>.</li>
                        <li>Klik <strong>Tambah pengguna</strong>, lalu isi email dan password untuk guru.</li>
                        <li>Setelah dibuat, <strong>salin User UID</strong> dari akun baru tersebut.</li>
                    </ol>
                </AlertDescription>
            </Alert>
            <Alert>
                <Database className="h-4 w-4" />
                <AlertTitle>Langkah 2: Buat Dokumen di Firestore</AlertTitle>
                <AlertDescription>
                     <ol className="list-decimal pl-5 space-y-1 mt-2">
                        <li>Masuk ke bagian <strong>Firestore Database</strong>.</li>
                        <li>Buka koleksi <strong>users</strong>.</li>
                        <li>Klik <strong>Tambah dokumen</strong>.</li>
                        <li>Gunakan <strong>User UID</strong> yang tadi disalin sebagai <strong>Document ID</strong>.</li>
                        <li>Tambahkan 2 field:
                            <ul className="list-disc pl-6 mt-1">
                                <li>Field 1: Key: `email`, Type: `string`, Value: (email guru)</li>
                                <li>Field 2: Key: `role`, Type: `string`, Value: `guru`</li>
                            </ul>
                        </li>
                        <li>Klik <strong>Simpan</strong>. Akun guru akan langsung muncul di daftar.</li>
                    </ol>
                </AlertDescription>
            </Alert>
        </div>

        <DialogFooter className="sm:justify-start pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                Tutup
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
