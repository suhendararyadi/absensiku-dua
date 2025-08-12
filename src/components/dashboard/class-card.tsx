"use client";

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Users, CalendarCheck, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditClassDialog } from './edit-class-dialog';
import { DeleteClassDialog } from './delete-class-dialog';
import { useAuth } from '@/hooks/use-auth';

interface ClassCardProps {
  id: string;
  name: string;
  studentCount: number;
}

export function ClassCard({ id, name, studentCount }: ClassCardProps) {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';

  return (
    <Card className="flex flex-col transition-all hover:shadow-lg">
      <CardHeader className="flex-grow">
        <div className="flex items-start justify-between">
            <div>
                <CardTitle className="text-xl">{name}</CardTitle>
                <CardDescription className="flex items-center pt-1">
                <Users className="mr-2 h-4 w-4" />
                {studentCount} siswa terdaftar
                </CardDescription>
            </div>
            {isAdmin && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Opsi Kelas</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <EditClassDialog classId={id} currentClassName={name} triggerType="menu" />
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <DeleteClassDialog classId={id} className={name} triggerType="menu" />
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
      </CardHeader>
      <CardContent></CardContent>
      <CardFooter className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Link
          href={`/dashboard/attendance/${id}`}
          className={cn(buttonVariants({ variant: 'default' }))}
        >
          <CalendarCheck className="mr-2 h-4 w-4" />
          Absensi
        </Link>
        <Link
          href={`/dashboard/class/${id}`}
          className={cn(buttonVariants({ variant: 'secondary' }))}
        >
          <Users className="mr-2 h-4 w-4" />
          Siswa
        </Link>
      </CardFooter>
    </Card>
  );
}
