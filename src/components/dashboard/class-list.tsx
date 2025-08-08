
"use client";

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ClassCard } from './class-card';
import { Skeleton } from '@/components/ui/skeleton';

interface ClassData {
  id: string;
  className: string;
  studentCount: number;
}

export function ClassList() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'classes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const classesData: ClassData[] = [];
      querySnapshot.forEach((doc) => {
        classesData.push({ id: doc.id, ...doc.data() } as ClassData);
      });
      setClasses(classesData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-3 p-4 border rounded-lg bg-card">
                <Skeleton className="h-24 w-full rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </div>
        ))}
      </div>
    );
  }

  if (classes.length === 0) {
    return (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-24" x-chunk="dashboard-02-chunk-1">
            <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="text-2xl font-bold tracking-tight">Belum ada kelas</h3>
                <p className="text-sm text-muted-foreground">
                    Mulai dengan menambahkan kelas baru untuk mengelola siswa dan absensi.
                </p>
            </div>
        </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {classes.map((c) => (
        <ClassCard key={c.id} id={c.id} name={c.className} studentCount={c.studentCount} />
      ))}
    </div>
  );
}
