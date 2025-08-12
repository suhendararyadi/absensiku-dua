"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Users, Calendar, BarChart3, Target } from 'lucide-react';

interface AttendanceRecord {
    id: string;
    studentName: string;
    date: string;
    status: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';
    classId: string;
}

interface ReportStatisticsProps {
    data: AttendanceRecord[];
    className?: string;
}

export function ReportStatistics({ data, className }: ReportStatisticsProps) {
    const statistics = useMemo(() => {
        if (data.length === 0) return null;

        const totalRecords = data.length;
        const statusCounts = data.reduce((acc, record) => {
            acc[record.status] = (acc[record.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const hadirCount = statusCounts['Hadir'] || 0;
        const sakitCount = statusCounts['Sakit'] || 0;
        const izinCount = statusCounts['Izin'] || 0;
        const alfaCount = statusCounts['Alfa'] || 0;

        const attendanceRate = totalRecords > 0 ? (hadirCount / totalRecords) * 100 : 0;
        const absentRate = totalRecords > 0 ? ((sakitCount + izinCount + alfaCount) / totalRecords) * 100 : 0;

        // Analisis per siswa
        const studentStats = data.reduce((acc, record) => {
            if (!acc[record.studentName]) {
                acc[record.studentName] = {
                    total: 0,
                    hadir: 0,
                    sakit: 0,
                    izin: 0,
                    alfa: 0
                };
            }
            acc[record.studentName].total++;
            acc[record.studentName][record.status.toLowerCase() as keyof typeof acc[string]]++;
            return acc;
        }, {} as Record<string, any>);

        const uniqueStudents = Object.keys(studentStats).length;
        const uniqueDates = [...new Set(data.map(r => r.date))].length;

        // Siswa dengan kehadiran terbaik dan terburuk
        const studentAttendanceRates = Object.entries(studentStats).map(([name, stats]) => ({
            name,
            attendanceRate: (stats.hadir / stats.total) * 100,
            totalRecords: stats.total
        }));

        const bestAttendance = studentAttendanceRates.reduce((best, current) => 
            current.attendanceRate > best.attendanceRate ? current : best
        );

        const worstAttendance = studentAttendanceRates.reduce((worst, current) => 
            current.attendanceRate < worst.attendanceRate ? current : worst
        );

        return {
            totalRecords,
            hadirCount,
            sakitCount,
            izinCount,
            alfaCount,
            attendanceRate,
            absentRate,
            uniqueStudents,
            uniqueDates,
            bestAttendance,
            worstAttendance,
            averageAttendanceRate: studentAttendanceRates.reduce((sum, s) => sum + s.attendanceRate, 0) / studentAttendanceRates.length
        };
    }, [data]);

    if (!statistics) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground">Tidak ada data untuk ditampilkan</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Tingkat Kehadiran */}
            <Card className="bg-green-50 border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-900">Tingkat Kehadiran</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-900">
                        {statistics.attendanceRate.toFixed(1)}%
                    </div>
                    <Progress value={statistics.attendanceRate} className="mt-2" />
                    <p className="text-xs text-green-800/80 mt-1">
                        {statistics.hadirCount} dari {statistics.totalRecords} catatan
                    </p>
                </CardContent>
            </Card>

            {/* Tingkat Ketidakhadiran */}
            <Card className="bg-red-50 border-red-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-red-900">Tingkat Ketidakhadiran</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-900">
                        {statistics.absentRate.toFixed(1)}%
                    </div>
                    <Progress value={statistics.absentRate} className="mt-2" />
                    <p className="text-xs text-red-800/80 mt-1">
                        {statistics.sakitCount + statistics.izinCount + statistics.alfaCount} catatan tidak hadir
                    </p>
                </CardContent>
            </Card>

            {/* Jumlah Siswa */}
            <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-900">Siswa Terlibat</CardTitle>
                    <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-900">{statistics.uniqueStudents}</div>
                    <p className="text-xs text-blue-800/80">
                        Rata-rata kehadiran: {statistics.averageAttendanceRate.toFixed(1)}%
                    </p>
                </CardContent>
            </Card>

            {/* Rentang Waktu */}
            <Card className="bg-purple-50 border-purple-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-purple-900">Rentang Waktu</CardTitle>
                    <Calendar className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-purple-900">{statistics.uniqueDates}</div>
                    <p className="text-xs text-purple-800/80">hari tercatat</p>
                </CardContent>
            </Card>

            {/* Breakdown Status */}
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Breakdown Status Kehadiran
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-green-700">Hadir</span>
                        <div className="flex items-center gap-2">
                            <Progress value={(statistics.hadirCount / statistics.totalRecords) * 100} className="w-20" />
                            <span className="text-sm font-medium">{statistics.hadirCount}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-yellow-700">Sakit</span>
                        <div className="flex items-center gap-2">
                            <Progress value={(statistics.sakitCount / statistics.totalRecords) * 100} className="w-20" />
                            <span className="text-sm font-medium">{statistics.sakitCount}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700">Izin</span>
                        <div className="flex items-center gap-2">
                            <Progress value={(statistics.izinCount / statistics.totalRecords) * 100} className="w-20" />
                            <span className="text-sm font-medium">{statistics.izinCount}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-red-700">Alfa</span>
                        <div className="flex items-center gap-2">
                            <Progress value={(statistics.alfaCount / statistics.totalRecords) * 100} className="w-20" />
                            <span className="text-sm font-medium">{statistics.alfaCount}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Performa Siswa */}
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Performa Kehadiran Siswa
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <div>
                            <p className="text-sm font-medium text-green-900">Kehadiran Terbaik</p>
                            <p className="text-xs text-green-700">{statistics.bestAttendance.name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-bold text-green-900">
                                {statistics.bestAttendance.attendanceRate.toFixed(1)}%
                            </p>
                            <p className="text-xs text-green-700">
                                {Math.round((statistics.bestAttendance.attendanceRate / 100) * statistics.bestAttendance.totalRecords)} dari {statistics.bestAttendance.totalRecords}
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                        <div>
                            <p className="text-sm font-medium text-red-900">Perlu Perhatian</p>
                            <p className="text-xs text-red-700">{statistics.worstAttendance.name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-bold text-red-900">
                                {statistics.worstAttendance.attendanceRate.toFixed(1)}%
                            </p>
                            <p className="text-xs text-red-700">
                                {Math.round((statistics.worstAttendance.attendanceRate / 100) * statistics.worstAttendance.totalRecords)} dari {statistics.worstAttendance.totalRecords}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}