
"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AddTeacherDialog } from './add-teacher-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { useAuth } from '@/hooks/use-auth';

interface Teacher {
    id: string;
    email: string;
    role: string;
}

export function TeacherManagement() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { userProfile } = useAuth();

    useEffect(() => {
        // Only fetch teachers if the user is an admin
        if (userProfile?.role !== 'admin') {
            setIsLoading(false);
            return;
        }

        const q = query(
            collection(db, 'users'), 
            where('role', '==', 'guru'),
            orderBy('email')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const teachersData: Teacher[] = [];
            snapshot.forEach(doc => {
                teachersData.push({ id: doc.id, ...doc.data() } as Teacher);
            });
            setTeachers(teachersData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching teachers:", error);
            // This might happen due to security rules, which is fine.
            // The page-level check will redirect non-admins.
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userProfile]);

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle>Daftar Guru</CardTitle>
                        <CardDescription>Daftar semua pengguna dengan peran sebagai "guru".</CardDescription>
                    </div>
                    <AddTeacherDialog />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead className="hidden md:table-cell">User ID</TableHead>
                            <TableHead>Peran</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-64" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : teachers.length > 0 ? (
                            teachers.map(teacher => (
                                <TableRow key={teacher.id}>
                                    <TableCell className="font-medium">{teacher.email}</TableCell>
                                    <TableCell className="text-muted-foreground hidden md:table-cell">{teacher.id}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{teacher.role}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    Belum ada guru yang ditambahkan. Ikuti petunjuk di tombol "Tambah Akun Guru".
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
