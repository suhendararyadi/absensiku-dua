
"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AddSubjectDialog } from './add-subject-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Skeleton } from '../ui/skeleton';

interface Subject {
    id: string;
    subjectName: string;
    teacherName: string;
}

export function SubjectManagement() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'subjects'), orderBy('subjectName'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const subjectsData: Subject[] = [];
            snapshot.forEach(doc => {
                subjectsData.push({ id: doc.id, ...doc.data() } as Subject);
            });
            setSubjects(subjectsData);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Daftar Mata Pelajaran</CardTitle>
                        <CardDescription>Daftar semua mata pelajaran dan guru pengajarnya.</CardDescription>
                    </div>
                    <AddSubjectDialog />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Mata Pelajaran</TableHead>
                            <TableHead>Guru Pengajar</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                </TableRow>
                            ))
                        ) : subjects.length > 0 ? (
                            subjects.map(subject => (
                                <TableRow key={subject.id}>
                                    <TableCell className="font-medium">{subject.subjectName}</TableCell>
                                    <TableCell>{subject.teacherName}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={2} className="h-24 text-center">
                                    Belum ada mata pelajaran yang ditambahkan.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
