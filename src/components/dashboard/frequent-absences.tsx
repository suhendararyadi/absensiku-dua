
"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, subDays } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/badge';
import Link from 'next/link';

type AbsenceStatus = "Alfa" | "Izin" | "Sakit";

interface AbsenceRecord {
    studentId: string;
    studentName: string;
    classId: string;
    status: AbsenceStatus;
}

interface AggregatedAbsence {
    studentId: string;
    studentName: string;
    classId: string;
    className?: string;
    counts: {
        Alfa: number;
        Izin: number;
        Sakit: number;
    };
    total: number;
}

export function FrequentAbsences() {
    const [absences, setAbsences] = useState<AggregatedAbsence[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFrequentAbsences = async () => {
            setIsLoading(true);
            try {
                const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
                const q = query(
                    collection(db, 'attendance'),
                    where('date', '>=', thirtyDaysAgo),
                    where('status', 'in', ['Alfa', 'Izin', 'Sakit'])
                );

                const snapshot = await getDocs(q);
                const records = snapshot.docs.map(doc => doc.data() as AbsenceRecord);

                const aggregation: Record<string, AggregatedAbsence> = {};

                for (const record of records) {
                    if (!aggregation[record.studentId]) {
                        aggregation[record.studentId] = {
                            studentId: record.studentId,
                            studentName: record.studentName,
                            classId: record.classId,
                            counts: { Alfa: 0, Izin: 0, Sakit: 0 },
                            total: 0,
                        };
                    }
                    aggregation[record.studentId].counts[record.status]++;
                    aggregation[record.studentId].total++;
                }

                const aggregatedArray = Object.values(aggregation);
                
                // Fetch class names
                const classPromises = aggregatedArray.map(async (agg) => {
                    const classRef = doc(db, 'classes', agg.classId);
                    const classSnap = await getDoc(classRef);
                    return {
                        ...agg,
                        className: classSnap.exists() ? classSnap.data().className : 'N/A',
                    };
                });

                const withClassNames = await Promise.all(classPromises);

                withClassNames.sort((a, b) => b.total - a.total);
                
                setAbsences(withClassNames.slice(0, 10)); // Get top 10

            } catch (error) {
                console.error("Failed to fetch frequent absences:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFrequentAbsences();
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-2">
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-6 w-1/2" />
                    </div>
                ))}
            </div>
        );
    }
    
    if (absences.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-40 rounded-md border-2 border-dashed">
                <ShieldCheck className="h-12 w-12 text-green-500" />
                <p className="mt-4 font-medium text-muted-foreground">Luar biasa! Tidak ada absensi signifikan dalam 30 hari terakhir.</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead className="text-center">Sakit</TableHead>
                    <TableHead className="text-center">Izin</TableHead>
                    <TableHead className="text-center text-red-600">Alfa</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {absences.map(student => (
                    <TableRow key={student.studentId}>
                        <TableCell className="font-medium">
                            <Link href={`/dashboard/class/${student.classId}`} className="hover:underline">
                                {student.studentName}
                            </Link>
                        </TableCell>
                         <TableCell>
                            <Badge variant="secondary">{student.className}</Badge>
                         </TableCell>
                        <TableCell className="text-center">{student.counts.Sakit}</TableCell>
                        <TableCell className="text-center">{student.counts.Izin}</TableCell>
                        <TableCell className="text-center font-semibold text-red-600">{student.counts.Alfa}</TableCell>
                        <TableCell className="text-center font-bold">{student.total}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
