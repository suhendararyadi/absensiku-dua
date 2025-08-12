"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardCheck, 
  FileText, 
  UserPlus, 
  Calendar,
  BookOpen,
  TrendingUp,
  Clock,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';

interface QuickStat {
  label: string;
  value: number;
  urgent?: boolean;
}

export function QuickActions() {
  const [quickStats, setQuickStats] = useState<QuickStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuickStats = async () => {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        
        // Get classes that haven't been marked today
        const classesSnapshot = await getDocs(collection(db, 'classes'));
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('date', '==', today)
        );
        const attendanceSnapshot = await getDocs(attendanceQuery);
        
        const classesWithAttendance = new Set();
        attendanceSnapshot.forEach(doc => {
          classesWithAttendance.add(doc.data().classId);
        });
        
        const pendingClasses = classesSnapshot.size - classesWithAttendance.size;
        
        // Get students needing attention (frequent absences)
        const thirtyDaysAgo = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
        const absenceQuery = query(
          collection(db, 'attendance'),
          where('date', '>=', thirtyDaysAgo),
          where('status', 'in', ['Alfa', 'Sakit', 'Izin'])
        );
        const absenceSnapshot = await getDocs(absenceQuery);
        
        const studentAbsences: Record<string, number> = {};
        absenceSnapshot.forEach(doc => {
          const studentId = doc.data().studentId;
          studentAbsences[studentId] = (studentAbsences[studentId] || 0) + 1;
        });
        
        const studentsNeedingAttention = Object.values(studentAbsences).filter(count => count >= 5).length;
        
        setQuickStats([
          { label: 'Kelas Belum Diabsen', value: pendingClasses, urgent: pendingClasses > 0 },
          { label: 'Siswa Perlu Perhatian', value: studentsNeedingAttention, urgent: studentsNeedingAttention > 0 },
          { label: 'Total Kelas', value: classesSnapshot.size },
        ]);
      } catch (error) {
        console.error('Error fetching quick stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuickStats();
  }, []);

  const quickActions = [
    {
      title: 'Input Absensi',
      description: 'Catat kehadiran siswa hari ini',
      icon: ClipboardCheck,
      href: '/dashboard/attendance',
      color: 'bg-blue-500 hover:bg-blue-600',
      urgent: quickStats.find(s => s.label === 'Kelas Belum Diabsen')?.urgent
    },
    {
      title: 'Lihat Laporan',
      description: 'Analisis data absensi',
      icon: FileText,
      href: '/dashboard/reports',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Kelola Siswa',
      description: 'Tambah atau edit data siswa',
      icon: UserPlus,
      href: '/dashboard/students',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Jadwal Kelas',
      description: 'Atur jadwal dan mata pelajaran',
      icon: Calendar,
      href: '/dashboard/schedule',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Aksi Cepat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {quickStats.map((stat, index) => (
            <div key={index} className="text-center p-2 bg-white rounded-lg border">
              <div className={`text-lg font-bold ${stat.urgent ? 'text-red-600' : 'text-slate-700'}`}>
                {isLoading ? '...' : stat.value}
                {stat.urgent && <AlertTriangle className="inline h-4 w-4 ml-1" />}
              </div>
              <div className="text-xs text-slate-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} href={action.href}>
                <Button
                  variant="outline"
                  className={`w-full h-auto p-4 flex flex-col items-center gap-2 border-2 hover:border-slate-300 transition-all duration-200 ${
                    action.urgent ? 'border-red-200 bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg text-white ${action.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sm text-slate-800 flex items-center gap-1">
                      {action.title}
                      {action.urgent && <Badge variant="destructive" className="text-xs px-1 py-0">!</Badge>}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">{action.description}</div>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Today's Focus */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-blue-800 font-medium text-sm mb-1">
            <Clock className="h-4 w-4" />
            Fokus Hari Ini
          </div>
          <p className="text-xs text-blue-700">
            {quickStats.find(s => s.urgent) 
              ? "Ada kelas yang belum diabsen atau siswa yang perlu perhatian khusus."
              : "Semua kelas sudah diabsen. Lanjutkan monitoring kehadiran siswa."
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}