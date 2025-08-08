
"use client";

import { useState, useEffect } from "react";
import { collection, query, onSnapshot, doc, getDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AddStudentDialog } from "./add-student-dialog";
import { EditStudentDialog } from "./edit-student-dialog";
import { DeleteStudentDialog } from "./delete-student-dialog";
import { ImportStudentsDialog } from "./import-students-dialog";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowLeft, MoreVertical } from "lucide-react";

interface StudentData {
  id: string;
  studentName: string;
  nisn: string;
}

interface ClassData {
    className: string;
}

export function StudentList({ classId }: { classId: string }) {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClassData = async () => {
        const classRef = doc(db, 'classes', classId);
        const classSnap = await getDoc(classRef);
        if (classSnap.exists()) {
            setClassData(classSnap.data() as ClassData);
        }
    }
    fetchClassData();

    const q = query(collection(db, "classes", classId, "students"), orderBy('studentName'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const studentsData: StudentData[] = [];
      querySnapshot.forEach((doc) => {
        studentsData.push({ id: doc.id, ...doc.data() } as StudentData);
      });
      setStudents(studentsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [classId]);

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
                        Kelola Siswa: {classData?.className || <Skeleton className="h-6 w-24 inline-block" />}
                    </CardTitle>
                </div>
                <CardDescription>Tambah, impor, edit, atau hapus data siswa dari kelas ini.</CardDescription>
            </div>
            <div className="flex gap-2">
                <ImportStudentsDialog classId={classId} />
                <AddStudentDialog classId={classId} />
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Siswa</TableHead>
              <TableHead>NISN</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : students.length > 0 ? (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.studentName}</TableCell>
                  <TableCell>{student.nisn}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Opsi Siswa</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <EditStudentDialog 
                            classId={classId} 
                            studentId={student.id} 
                            currentStudent={{studentName: student.studentName, nisn: student.nisn}} 
                          />
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <DeleteStudentDialog 
                            classId={classId} 
                            studentId={student.id} 
                            studentName={student.studentName} 
                          />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  Belum ada siswa di kelas ini.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
