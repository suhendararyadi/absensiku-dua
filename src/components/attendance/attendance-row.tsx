"use client";

import { useState } from 'react';
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from '@/lib/utils';

type AttendanceStatus = "Hadir" | "Izin" | "Sakit" | "Alfa";

interface AttendanceRowProps {
    classId: string;
    student: { id: string; studentName: string };
    date: Date | undefined;
    attendanceData?: {
        status?: AttendanceStatus;
        checkInTime?: Timestamp;
        checkOutTime?: Timestamp;
    };
}

export function AttendanceRow({ classId, student, date, attendanceData }: AttendanceRowProps) {
    const [isLoading, setIsLoading] = useState<AttendanceStatus | 'checkOut' | false>(false);
    const { toast } = useToast();

    const handleStatusUpdate = async (status: AttendanceStatus) => {
        if (!date) {
            toast({ variant: 'destructive', title: 'Tanggal belum dipilih.' });
            return;
        }
        setIsLoading(status);

        const formattedDate = format(date, 'yyyy-MM-dd');
        const docId = `${formattedDate}_${student.id}`;
        const attendanceRef = doc(db, 'attendance', docId);

        try {
            const dataToSet: any = {
                date: formattedDate,
                classId: classId,
                studentId: student.id,
                studentName: student.studentName,
                status: status,
                checkOutTime: null, // Reset checkout time when status changes
            };

            if (status === 'Hadir') {
                dataToSet.checkInTime = serverTimestamp();
            } else {
                dataToSet.checkInTime = null;
            }

            await setDoc(attendanceRef, dataToSet, { merge: true });

            toast({
                title: 'Sukses',
                description: `Status ${student.studentName} diperbarui menjadi ${status}.`
            });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal memperbarui status.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCheckout = async () => {
        if (!date) {
            toast({ variant: 'destructive', title: 'Tanggal belum dipilih.' });
            return;
        }
        setIsLoading('checkOut');

        const formattedDate = format(date, 'yyyy-MM-dd');
        const docId = `${formattedDate}_${student.id}`;
        const attendanceRef = doc(db, 'attendance', docId);

        try {
             await setDoc(attendanceRef, { 
                checkOutTime: serverTimestamp() 
            }, { merge: true });
             toast({
                title: 'Sukses',
                description: `Absensi pulang untuk ${student.studentName} berhasil dicatat.`
            });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal mencatat absensi pulang.' });
        } finally {
            setIsLoading(false);
        }
    };

    const status = attendanceData?.status;
    const checkInTime = attendanceData?.checkInTime;
    const checkOutTime = attendanceData?.checkOutTime;
    
    const statusButtons: AttendanceStatus[] = ["Hadir", "Izin", "Sakit", "Alfa"];

    return (
        <TableRow>
            <TableCell className="font-medium">{student.studentName}</TableCell>
            <TableCell className="text-center">
                {checkInTime && status === 'Hadir' ? (
                    <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold text-green-600">Hadir</span>
                        <span className="text-xs text-muted-foreground">{format(checkInTime.toDate(), 'HH:mm')}</span>
                    </div>
                ) : status ? (
                    <span className={cn(
                        "font-semibold",
                        status === 'Sakit' && 'text-yellow-600',
                        status === 'Izin' && 'text-blue-600',
                        status === 'Alfa' && 'text-red-600'
                    )}>{status}</span>
                ) : (
                    <span>-</span>
                )}
            </TableCell>
            <TableCell className="text-center space-x-1 space-y-1">
                {statusButtons.map(s => (
                    <Button 
                        key={s}
                        size="sm" 
                        variant={status === s ? 'default' : 'outline'}
                        onClick={() => handleStatusUpdate(s)} 
                        disabled={!!isLoading}
                        className={cn(
                            status === s && s === 'Hadir' && 'bg-green-600 hover:bg-green-700',
                            status === s && s === 'Sakit' && 'bg-yellow-600 hover:bg-yellow-700 text-white',
                            status === s && s === 'Izin' && 'bg-blue-600 hover:bg-blue-700',
                            status === s && s === 'Alfa' && 'bg-red-600 hover:bg-red-700',
                        )}
                    >
                        {isLoading === s ? <Loader2 className="h-4 w-4 animate-spin" /> : s}
                    </Button>
                ))}
            </TableCell>
            <TableCell className="text-center">
                {checkOutTime ? (
                    <span className="font-semibold text-indigo-600">{format(checkOutTime.toDate(), 'HH:mm')}</span>
                ) : status === 'Hadir' ? (
                    <Button size="sm" variant="secondary" onClick={handleCheckout} disabled={!!isLoading}>
                        {isLoading === 'checkOut' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Catat Pulang'}
                    </Button>
                ) : (
                    <span>-</span>
                )}
            </TableCell>
        </TableRow>
    );
}
