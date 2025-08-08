
"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Users, UserCheck, ClipboardList, UserX } from "lucide-react";

interface SummaryData {
    totalStudents: number;
    totalClasses: number;
    presentToday: number;
    absentToday: number;
}

export function SummaryCards() {
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSummaryData = async () => {
            setIsLoading(true);
            try {
                const today = format(new Date(), 'yyyy-MM-dd');

                // Get total students and classes
                const classesSnapshot = await getDocs(collection(db, 'classes'));
                let totalStudents = 0;
                classesSnapshot.forEach(doc => {
                    totalStudents += doc.data().studentCount || 0;
                });
                const totalClasses = classesSnapshot.size;

                // Get today's attendance
                const attendanceTodayQuery = query(collection(db, "attendance"), where("date", "==", today));
                const attendanceTodaySnapshot = await getDocs(attendanceTodayQuery);
                let presentToday = 0;
                let absentToday = 0;
                attendanceTodaySnapshot.forEach(doc => {
                    const status = doc.data().status;
                    if (status === 'Hadir') {
                        presentToday++;
                    } else if (['Sakit', 'Izin', 'Alfa'].includes(status)) {
                        absentToday++;
                    }
                });

                setSummary({
                    totalStudents,
                    totalClasses,
                    presentToday,
                    absentToday,
                });
            } catch (error) {
                console.error("Error fetching summary data:", error);
                setSummary(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSummaryData();
    }, []);
    
    const totalAttendanceToday = (summary?.presentToday || 0) + (summary?.absentToday || 0);

    const attendancePercentage = totalAttendanceToday > 0
      ? ((summary!.presentToday / totalAttendanceToday) * 100).toFixed(0) + '%'
      : '0%';


    if (isLoading) {
        return (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
        )
    }

    return (
        <>
            <div className="mb-4">
                <h1 className="text-2xl font-bold tracking-tight">Ringkasan Hari Ini</h1>
                <p className="text-muted-foreground">Tinjauan rekapitulasi absensi untuk semua kelas.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-900">Total Siswa</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900">{summary?.totalStudents ?? 0}</div>
                        <p className="text-xs text-blue-800/80">dari {summary?.totalClasses ?? 0} kelas</p>
                    </CardContent>
                </Card>
                 <Card className="bg-green-50 border-green-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-900">Kehadiran</CardTitle>
                        <UserCheck className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-900">{attendancePercentage}</div>
                        <p className="text-xs text-green-800/80">{summary?.presentToday ?? 0} siswa hadir</p>
                    </CardContent>
                </Card>
                <Card className="bg-yellow-50 border-yellow-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-yellow-900">Tidak Hadir</CardTitle>
                        <UserX className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-900">{summary?.absentToday ?? 0}</div>
                        <p className="text-xs text-yellow-800/80">Sakit, Izin, atau Alfa</p>
                    </CardContent>
                </Card>
                <Card className="bg-indigo-50 border-indigo-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-900">Total Tercatat</CardTitle>
                         <ClipboardList className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-900">{totalAttendanceToday}</div>
                        <p className="text-xs text-indigo-800/80">dari {summary?.totalStudents} siswa</p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
