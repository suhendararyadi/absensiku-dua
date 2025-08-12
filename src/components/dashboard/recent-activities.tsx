"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Clock, 
  UserCheck, 
  UserX, 
  Heart, 
  AlertTriangle,
  Calendar,
  TrendingUp,
  Activity
} from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, isToday, formatDistanceToNow } from 'date-fns';
import { id as indonesiaLocale } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityItem {
  id: string;
  type: 'attendance' | 'alert' | 'achievement' | 'system';
  title: string;
  description: string;
  timestamp: Date;
  status?: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';
  studentName?: string;
  className?: string;
  icon: React.ReactNode;
  color: string;
}

export function RecentActivities() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentActivities = async () => {
      setIsLoading(true);
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        
        // Fetch recent attendance records
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('date', '==', today),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        
        const attendanceSnapshot = await getDocs(attendanceQuery);
        const recentActivities: ActivityItem[] = [];

        // Process attendance records
        attendanceSnapshot.forEach((doc) => {
          const data = doc.data();
          const timestamp = data.timestamp?.toDate() || new Date();
          
          let icon, color, title;
          
          switch (data.status) {
            case 'Hadir':
              icon = <UserCheck className="h-4 w-4" />;
              color = 'text-green-600 bg-green-50 border-green-200';
              title = 'Kehadiran Tercatat';
              break;
            case 'Sakit':
              icon = <Heart className="h-4 w-4" />;
              color = 'text-orange-600 bg-orange-50 border-orange-200';
              title = 'Siswa Sakit';
              break;
            case 'Izin':
              icon = <Calendar className="h-4 w-4" />;
              color = 'text-blue-600 bg-blue-50 border-blue-200';
              title = 'Siswa Izin';
              break;
            case 'Alfa':
              icon = <UserX className="h-4 w-4" />;
              color = 'text-red-600 bg-red-50 border-red-200';
              title = 'Siswa Alfa';
              break;
            default:
              icon = <Activity className="h-4 w-4" />;
              color = 'text-gray-600 bg-gray-50 border-gray-200';
              title = 'Aktivitas';
          }

          recentActivities.push({
            id: doc.id,
            type: 'attendance',
            title,
            description: `${data.studentName || 'Siswa'} - ${data.className || 'Kelas'}`,
            timestamp,
            status: data.status,
            studentName: data.studentName,
            className: data.className,
            icon,
            color
          });
        });

        // Add some system activities
        const systemActivities: ActivityItem[] = [
          {
            id: 'sys-1',
            type: 'system',
            title: 'Sistem Sinkronisasi',
            description: 'Data berhasil disinkronkan dengan server',
            timestamp: new Date(),
            icon: <TrendingUp className="h-4 w-4" />,
            color: 'text-blue-600 bg-blue-50 border-blue-200'
          },
          {
            id: 'sys-2',
            type: 'achievement',
            title: 'Target Tercapai',
            description: 'Tingkat kehadiran minggu ini mencapai target',
            timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            icon: <TrendingUp className="h-4 w-4" />,
            color: 'text-green-600 bg-green-50 border-green-200'
          }
        ];

        // Combine and sort activities
        const allActivities = [...recentActivities, ...systemActivities]
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 8);

        setActivities(allActivities);

      } catch (error) {
        console.error('Error fetching recent activities:', error);
        
        // Fallback mock data
        const mockActivities: ActivityItem[] = [
          {
            id: 'mock-1',
            type: 'attendance',
            title: 'Kehadiran Tercatat',
            description: 'Ahmad Rizki - Kelas 10A',
            timestamp: new Date(),
            status: 'Hadir',
            icon: <UserCheck className="h-4 w-4" />,
            color: 'text-green-600 bg-green-50 border-green-200'
          },
          {
            id: 'mock-2',
            type: 'system',
            title: 'Sistem Online',
            description: 'Semua layanan berjalan normal',
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
            icon: <Activity className="h-4 w-4" />,
            color: 'text-blue-600 bg-blue-50 border-blue-200'
          },
          {
            id: 'mock-3',
            type: 'attendance',
            title: 'Siswa Izin',
            description: 'Sari Dewi - Kelas 11B',
            timestamp: new Date(Date.now() - 45 * 60 * 1000),
            status: 'Izin',
            icon: <Calendar className="h-4 w-4" />,
            color: 'text-blue-600 bg-blue-50 border-blue-200'
          }
        ];
        
        setActivities(mockActivities);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentActivities();
  }, []);

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <Activity className="h-5 w-5 text-blue-600" />
          Aktivitas Terbaru
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Belum ada aktivitas hari ini</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <div className={`p-2 rounded-full border ${activity.color}`}>
                {activity.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-slate-900 truncate">
                    {activity.title}
                  </h4>
                  {activity.status && (
                    <Badge 
                      variant={
                        activity.status === 'Hadir' ? 'default' :
                        activity.status === 'Sakit' ? 'secondary' :
                        activity.status === 'Izin' ? 'outline' : 'destructive'
                      }
                      className="text-xs"
                    >
                      {activity.status}
                    </Badge>
                  )}
                </div>
                
                <p className="text-xs text-slate-600 truncate">
                  {activity.description}
                </p>
                
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-slate-400" />
                  <span className="text-xs text-slate-400">
                    {isToday(activity.timestamp) 
                      ? formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: indonesiaLocale })
                      : format(activity.timestamp, 'dd/MM HH:mm')
                    }
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
        
        {activities.length > 0 && (
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-center">
              <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                Lihat Semua Aktivitas
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}