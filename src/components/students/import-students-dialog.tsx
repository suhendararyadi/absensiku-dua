
"use client";

import { useState, useCallback } from 'react';
import * as xlsx from 'xlsx';
import { collection, doc, runTransaction, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UploadCloud, Loader2, FileCheck2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { FileWarning } from 'lucide-react';


interface StudentImport {
  studentName: string;
  nisn: string;
  gender: 'Laki-laki' | 'Perempuan';
}

export function ImportStudentsDialog({ classId }: { classId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [studentsToImport, setStudentsToImport] = useState<StudentImport[]>([]);
  const { toast } = useToast();

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = xlsx.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

        // Assume header is [Nama Siswa, NISN, Jenis Kelamin]
        const parsedStudents: StudentImport[] = json.slice(1).map(row => ({
          studentName: row[0]?.toString().trim() || '',
          nisn: row[1]?.toString().trim() || '',
          gender: (row[2]?.toString().trim() === 'Laki-laki' || row[2]?.toString().trim() === 'Perempuan') ? row[2] : 'Laki-laki',
        })).filter(s => s.studentName && s.nisn); // Filter out empty rows

        setStudentsToImport(parsedStudents);

        if (parsedStudents.length === 0) {
           toast({
            variant: "destructive",
            title: "File Kosong atau Format Salah",
            description: "Pastikan file Excel memiliki data dan kolom yang benar: Nama Siswa, NISN, Jenis Kelamin.",
          });
        }
      } catch (error) {
        toast({
            variant: "destructive",
            title: "Gagal Membaca File",
            description: "Pastikan file yang Anda unggah adalah file Excel yang valid.",
        });
        resetState();
      }
    };
    reader.readAsArrayBuffer(file);
  }, [toast]);

  const handleImport = async () => {
    if (studentsToImport.length === 0) {
      toast({
        variant: "destructive",
        title: "Tidak ada data untuk diimpor.",
      });
      return;
    }
    
    setIsLoading(true);
    try {
        const classRef = doc(db, "classes", classId);
        
        await runTransaction(db, async (transaction) => {
            const classDoc = await transaction.get(classRef);
            if (!classDoc.exists()) {
                throw new Error("Kelas tidak ditemukan!");
            }
            
            const studentsCollectionRef = collection(db, "classes", classId, "students");
            const batch = writeBatch(db);

            studentsToImport.forEach(student => {
                const newStudentRef = doc(studentsCollectionRef);
                batch.set(newStudentRef, student);
            });
            
            await batch.commit();

            const newStudentCount = (classDoc.data().studentCount || 0) + studentsToImport.length;
            transaction.update(classRef, { studentCount: newStudentCount });
        });

      toast({
        title: 'Sukses',
        description: `${studentsToImport.length} siswa berhasil diimpor.`,
      });
      resetState();
      setIsOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Gagal mengimpor siswa: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setFileName('');
    setStudentsToImport([]);
    // Reset file input
    const fileInput = document.getElementById('excel-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }
  
  const handleOpenChange = (open: boolean) => {
    if(!open) {
        resetState();
    }
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UploadCloud className="mr-2 h-4 w-4" />
          Impor dari Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Impor Siswa dari File Excel</DialogTitle>
          <DialogDescription>
            Pilih file Excel untuk mengimpor data siswa secara massal. Pastikan format file sesuai.
          </DialogDescription>
        </DialogHeader>
        
        <Alert>
            <FileWarning className="h-4 w-4" />
            <AlertTitle>Penting!</AlertTitle>
            <AlertDescription>
                Pastikan file Excel Anda memiliki 3 kolom dengan header berikut pada baris pertama: <strong>Nama Siswa</strong>, <strong>NISN</strong>, dan <strong>Jenis Kelamin</strong> (isi dengan "Laki-laki" atau "Perempuan").
            </AlertDescription>
        </Alert>

        <div className="py-4 space-y-4">
            {!fileName ? (
                <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-8 flex flex-col items-center justify-center text-center">
                    <UploadCloud className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">Seret & lepas file atau klik untuk memilih</p>
                    <Input
                        id="excel-upload"
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                    />
                </div>
            ) : (
                <div className="flex items-center justify-center p-4 border rounded-md bg-muted">
                    <FileCheck2 className="h-6 w-6 text-green-600 mr-3" />
                    <span className="font-medium">{fileName}</span>
                </div>
            )}
          

          {studentsToImport.length > 0 && (
            <div>
                <h3 className="mb-2 font-medium">Pratinjau Data ({studentsToImport.length} siswa ditemukan)</h3>
                <ScrollArea className="h-64 w-full rounded-md border">
                    <Table>
                    <TableHeader className="sticky top-0 bg-muted">
                        <TableRow>
                        <TableHead>Nama Siswa</TableHead>
                        <TableHead>NISN</TableHead>
                        <TableHead>Jenis Kelamin</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {studentsToImport.map((student, index) => (
                        <TableRow key={index}>
                            <TableCell>{student.studentName}</TableCell>
                            <TableCell>{student.nisn}</TableCell>
                            <TableCell>{student.gender}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>Batal</Button>
          <Button onClick={handleImport} disabled={isLoading || studentsToImport.length === 0}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : `Impor ${studentsToImport.length} Siswa`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
