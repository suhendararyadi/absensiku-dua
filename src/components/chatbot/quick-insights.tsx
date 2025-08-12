'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Calendar
} from 'lucide-react';
import { getAttendanceStats } from '@/lib/firestore-service';

interface QuickInsightsProps {
  totalStudents: number;
  totalClasses: number;
  onInsightClick: (question: string) => void;
}

interface InsightData {
  attendanceRate: number;
  presentToday: number;
  absentToday: number;
  trendDirection: 'up' | 'down' | 'stable';
  criticalAlerts: string[];
}

export function QuickInsights({ totalStudents, totalClasses, onInsightClick }: QuickInsightsProps) {
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const stats = await getAttendanceStats(7);
        if (stats) {
          const totalRecords = stats.totalRecords;
          const presentCount = stats.statusBreakdown.Hadir;
          const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;
          
          // Get today's data
          const today = new Date().toISOString().split('T')[0];
          const todayStats = stats.dailyStats[today] || { Hadir: 0, total: 0 };
          
          // Calculate trend (simplified)
          const trendDirection: 'up' | 'down' | 'stable' = attendanceRate >= 85 ? 'up' : attendanceRate >= 70 ? 'stable' : 'down';
          
          // Generate alerts
          const criticalAlerts: string[] = [];
          if (attendanceRate < 70) {
            criticalAlerts.push('Tingkat kehadiran rendah');
          }
          if (stats.statusBreakdown.Alfa > 5) {
            criticalAlerts.push('Banyak siswa alfa');
          }
          
          setInsights({
            attendanceRate,
            presentToday: todayStats.Hadir,
            absentToday: todayStats.total - todayStats.Hadir,
            trendDirection,
            criticalAlerts
          });
        }
      } catch (error) {
        console.error('Error fetching insights:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Attendance Rate Card */}
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onInsightClick('Berapa tingkat kehadiran keseluruhan minggu ini?')}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Tingkat Kehadiran</span>
            {insights?.trendDirection === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : insights?.trendDirection === 'down' ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-blue-500" />
            )}
          </div>
          <div className="text-2xl font-bold mb-2">{insights?.attendanceRate || 0}%</div>
          <Progress value={insights?.attendanceRate || 0} className="h-2" />
        </CardContent>
      </Card>

      {/* Today's Summary Card */}
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onInsightClick('Tampilkan ringkasan absensi hari ini')}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Hari Ini</span>
            <Calendar className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{insights?.presentToday || 0}</div>
              <div className="text-xs text-muted-foreground">Hadir</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{insights?.absentToday || 0}</div>
              <div className="text-xs text-muted-foreground">Tidak Hadir</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Overview Card */}
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onInsightClick('Berikan overview lengkap sistem absensi')}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Sistem</span>
            <Users className="h-4 w-4 text-purple-500" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Total Siswa:</span>
              <span className="font-medium">{totalStudents}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Kelas:</span>
              <span className="font-medium">{totalClasses}</span>
            </div>
            {insights?.criticalAlerts && insights.criticalAlerts.length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <AlertTriangle className="h-3 w-3 text-orange-500" />
                <Badge variant="outline" className="text-xs">
                  {insights.criticalAlerts.length} Alert
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}