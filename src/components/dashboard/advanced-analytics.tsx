"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Award,
  AlertCircle,
  Calendar,
  Users
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface AnalyticsData {
  weeklyTrend: Array<{
    day: string;
    present: number;
    absent: number;
    rate: number;
  }>;
  dailyStats: {
    present: number;
    absent: number;
    totalStudents: number;
    attendanceRate: number;
    presentRate: number;
    absentRate: number;
    statusBreakdown: {
      Hadir: number;
      Sakit: number;
      Izin: number;
      Alfa: number;
    };
  };
  classPerformance: Array<{
    className: string;
    rate: number;
    total: number;
  }>;
  monthlyComparison: {
    thisMonth: number;
    lastMonth: number;
    change: number;
  };
  targets: {
    overall: { current: number; target: number };
    weekly: { current: number; target: number };
  };
}

export function AdvancedAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trends');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const today = new Date();
        const weekStart = startOfWeek(today);
        const weekEnd = endOfWeek(today);
        
        // Weekly trend data
        const weeklyData = [];
        for (let i = 0; i < 7; i++) {
          const date = format(subDays(today, 6 - i), 'yyyy-MM-dd');
          const dayName = format(subDays(today, 6 - i), 'EEE');
          
          const dayQuery = query(
            collection(db, 'attendance'),
            where('date', '==', date)
          );
          const daySnapshot = await getDocs(dayQuery);
          
          let present = 0, absent = 0;
          daySnapshot.forEach(doc => {
            const status = doc.data().status;
            if (status === 'Hadir') present++;
            else absent++;
          });
          
          const total = present + absent;
          const rate = total > 0 ? Math.round((present / total) * 100) : 0;
          
          weeklyData.push({
            day: dayName,
            present,
            absent,
            rate
          });
        }

        // Daily statistics for today
        const todayDate = format(today, 'yyyy-MM-dd');
        const todayQuery = query(
          collection(db, 'attendance'),
          where('date', '==', todayDate)
        );
        const todaySnapshot = await getDocs(todayQuery);
        
        const todayStatusCounts = { Hadir: 0, Sakit: 0, Izin: 0, Alfa: 0 };
        todaySnapshot.forEach(doc => {
          const status = doc.data().status;
          if (status in todayStatusCounts) {
            todayStatusCounts[status as keyof typeof todayStatusCounts]++;
          }
        });

        // Get total students count
        const studentsSnapshot = await getDocs(collection(db, 'students'));
        const totalStudents = studentsSnapshot.size;
        
        const todayPresent = todayStatusCounts.Hadir;
        const todayAbsent = todayStatusCounts.Sakit + todayStatusCounts.Izin + todayStatusCounts.Alfa;
        const todayTotal = todayPresent + todayAbsent;
        
        const dailyStats = {
          present: todayPresent,
          absent: todayAbsent,
          totalStudents,
          attendanceRate: todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0,
          presentRate: totalStudents > 0 ? Math.round((todayPresent / totalStudents) * 100) : 0,
          absentRate: totalStudents > 0 ? Math.round((todayAbsent / totalStudents) * 100) : 0,
          statusBreakdown: todayStatusCounts
        };

        // Class performance
        const classesSnapshot = await getDocs(collection(db, 'classes'));
        const classPerformance = [];
        
        for (const classDoc of classesSnapshot.docs) {
          const classData = classDoc.data();
          const classQuery = query(
            collection(db, 'attendance'),
            where('classId', '==', classDoc.id),
            where('date', '>=', format(weekStart, 'yyyy-MM-dd')),
            where('date', '<=', format(weekEnd, 'yyyy-MM-dd'))
          );
          const classAttendance = await getDocs(classQuery);
          
          let present = 0, total = 0;
          classAttendance.forEach(doc => {
            total++;
            if (doc.data().status === 'Hadir') present++;
          });
          
          if (total > 0) {
            classPerformance.push({
              className: classData.className,
              rate: Math.round((present / total) * 100),
              total
            });
          }
        }

        // Monthly comparison (simplified)
        const thisMonthRate = dailyStats.attendanceRate;
        
        // Mock last month data (in real app, you'd fetch actual data)
        const lastMonthRate = Math.max(0, thisMonthRate + Math.floor(Math.random() * 10) - 5);
        const change = thisMonthRate - lastMonthRate;

        setAnalytics({
          weeklyTrend: weeklyData,
          dailyStats,
          classPerformance: classPerformance.sort((a, b) => b.rate - a.rate),
          monthlyComparison: {
            thisMonth: thisMonthRate,
            lastMonth: lastMonthRate,
            change
          },
          targets: {
            overall: { current: thisMonthRate, target: 90 },
            weekly: { current: weeklyData[weeklyData.length - 1]?.rate || 0, target: 85 }
          }
        });

      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  return (
    <Card className="bg-gradient-to-br from-white to-slate-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Analitik Lanjutan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trends">Tren</TabsTrigger>
            <TabsTrigger value="performance">Performa</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">Target Bulanan</span>
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-bold">{analytics.targets.overall.current}%</span>
                  </div>
                  <Progress 
                    value={analytics.targets.overall.current} 
                    className="h-2"
                  />
                  <div className="text-xs text-blue-700">
                    Target: {analytics.targets.overall.target}%
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-800">Perbandingan Bulan</span>
                  {analytics.monthlyComparison.change >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {analytics.monthlyComparison.change >= 0 ? '+' : ''}{analytics.monthlyComparison.change}%
                </div>
                <div className="text-xs text-green-700">
                  vs bulan lalu ({analytics.monthlyComparison.lastMonth}%)
                </div>
              </div>
            </div>


            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium mb-3">Tren Kehadiran 7 Hari Terakhir</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.weeklyTrend}>
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium mb-3">Perbandingan Hadir vs Tidak Hadir</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.weeklyTrend}>
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="present" fill="#10b981" name="Hadir" />
                    <Bar dataKey="absent" fill="#ef4444" name="Tidak Hadir" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Performa Kelas (Minggu Ini)
              </h4>
              <div className="space-y-3">
                {analytics.classPerformance.slice(0, 5).map((cls, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-800">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{cls.className}</span>
                        <span className="text-sm font-bold">{cls.rate}%</span>
                      </div>
                      <Progress value={cls.rate} className="h-2" />
                    </div>
                    <Badge 
                      variant={cls.rate >= 90 ? "default" : cls.rate >= 80 ? "secondary" : "destructive"}
                    >
                      {cls.total} data
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Insights */}
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-amber-800 mb-1">Insight Performa</h5>
                  <p className="text-sm text-amber-700">
                    {analytics.classPerformance.length > 0 && analytics.classPerformance[0].rate >= 95
                      ? `Excellent! ${analytics.classPerformance[0].className} memiliki tingkat kehadiran tertinggi.`
                      : analytics.classPerformance.some(c => c.rate < 80)
                      ? "Beberapa kelas memerlukan perhatian khusus untuk meningkatkan kehadiran."
                      : "Performa kehadiran secara keseluruhan cukup baik."
                    }
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}