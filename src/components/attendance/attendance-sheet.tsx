
"use client";

import { useState, useEffect } from "react";
import { collection, query, onSnapshot, doc, getDoc, getDocs, where, orderBy, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from 'date-fns';
import { id as indonesiaLocale } from 'date-fns/locale';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarIcon, ArrowLeft, CheckCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AttendanceRow } from "./attendance-row";
import Link from "next/link";
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
import { useToast } from "@/hooks/use-toast";


interface StudentData {
  id: string;
  studentName: string;
}

interface ClassData {
    className: string;
}

interface AttendanceData {
    [studentId: string]: {
        status?: "Hadir" | "Izin" | "Sakit" | "Alfa";
        checkInTime?: any;
        checkOutTime?: any;
    }
}

export function AttendanceSheet({ classId }: { classId:string }) {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceData>({});
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInitialData = async () => {
        setIsLoading(true);
        const classRef = doc(db, 'classes', classId);
        const classSnap = await getDoc(classRef);
        if (classSnap.exists()) {
            setClassData(classSnap.data() as ClassData);
        }

        const studentsQuery = query(collection(db, "classes", classId, "students"), orderBy('studentName'));
        const studentsSnapshot = await getDocs(studentsQuery);
        const studentsData: StudentData[] = [];
        studentsSnapshot.forEach(doc => studentsData.push({ id: doc.id, ...doc.data() } as StudentData));
        setStudents(studentsData);

        setIsLoading(false);
    };
    
    fetchInitialData();
  }, [classId]);

  useEffect(() => {
    if (!date) return;

    const formattedDate = format(date, "yyyy-MM-dd");
    const q = query(collection(db, "attendance"), where("classId", "==", classId), where("date", "==", formattedDate));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const newAttendance: AttendanceData = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            newAttendance[data.studentId] = {
                status: data.status,
                checkInTime: data.checkInTime,
                checkOutTime: data.checkOutTime,
            }
        });
        setAttendance(newAttendance);
    });

    return () => unsubscribe();
  }, [date, classId]);

  const handlePresentAll = async () => {
    if (!date || students.length === 0) {
      toast({
        variant: "destructive",
        title: "Aksi tidak dapat dilakukan",
        description: "Pastikan tanggal telah dipilih dan ada siswa di kelas ini.",
      });
      return;
    }
    
    setIsUpdatingAll(true);
    const formattedDate = format(date, 'yyyy-MM-dd');
    const batch = writeBatch(db);

    students.forEach(student => {
      const docId = `${formattedDate}_${student.id}`;
      const attendanceRef = doc(db, 'attendance', docId);
      batch.set(attendanceRef, {
        date: formattedDate,
        classId: classId,
        studentId: student.id,
        studentName: student.studentName,
        status: 'Hadir',
        checkInTime: serverTimestamp(),
        checkOutTime: null,
      }, { merge: true });
    });

    try {
      await batch.commit();
      toast({
        title: "Sukses",
        description: `Semua ${students.length} siswa telah ditandai Hadir.`,
      });
    } catch (error) {
      console.error("Error marking all present:", error);
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Terjadi kesalahan saat menandai semua siswa hadir.",
      });
    } finally {
      setIsUpdatingAll(false);
    }
  };


  const selectedDateString = date ? format(date, "EEEE, d MMMM yyyy", { locale: indonesiaLocale }) : 'Pilih tanggal';

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                 <div className="flex items-center gap-2 mb-2">
                    <Button asChild variant="outline" size="icon">
                        <Link href="/dashboard/classes"><ArrowLeft className="h-4 w-4"/></Link>
                    </Button>
                    <CardTitle className="text-2xl">
                        Absensi Kelas: {classData?.className || <Skeleton className="h-6 w-24 inline-block" />}
                    </CardTitle>
                </div>
                <CardDescription>Pilih tanggal dan catat absensi masuk atau pulang untuk setiap siswa.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full sm:w-[280px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDateString}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      disabled={(d) => d > new Date()}
                    />
                  </PopoverContent>
                </Popover>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <Button variant="outline" disabled={isLoading || isUpdatingAll}>
                          {isUpdatingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
                          Hadir Semua
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                      <AlertDialogTitle>Konfirmasi Hadir Semua</AlertDialogTitle>
                      <AlertDialogDescription>
                          Apakah Anda yakin ingin menandai semua siswa di kelas ini sebagai "Hadir"? Tindakan ini akan menimpa status absensi yang sudah ada untuk tanggal yang dipilih.
                      </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={handlePresentAll}>Ya, Tandai Hadir Semua</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Siswa</TableHead>
              <TableHead className="text-center w-[150px]">Status</TableHead>
              <TableHead className="text-center w-[280px]">Aksi</TableHead>
              <TableHead className="text-center w-[150px]">Waktu Pulang</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 mx-auto" /></TableCell>
                  <TableCell className="flex justify-center gap-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </TableCell>
                  <TableCell><Skeleton className="h-8 w-24 mx-auto" /></TableCell>
                </TableRow>
              ))
            ) : students.length > 0 ? (
                students.map(student => (
                    <AttendanceRow
                        key={student.id}
                        classId={classId}
                        student={student}
                        date={date}
                        attendanceData={attendance[student.id]}
                    />
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                    Tidak ada siswa di kelas ini.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
