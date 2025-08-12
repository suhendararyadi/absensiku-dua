"use client";

import { useMemo } from 'react';
import { format, parseISO, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { id as indonesiaLocale } from 'date-fns/locale';
import { Line, LineChart, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Area, AreaChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { TrendingUp } from 'lucide-react';

interface AttendanceRecord {
    id: string;
    studentName: string;
    date: string;
    status: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';
    classId: string;
}

interface AttendanceTrendChartProps {
    data: AttendanceRecord[];
    dateRange?: { from: Date; to: Date };
}

const chartConfig = {
    Hadir: { label: "Hadir", color: "hsl(142, 76%, 36%)" },
    Sakit: { label: "Sakit", color: "hsl(48, 96%, 53%)" },
    Izin: { label: "Izin", color: "hsl(213, 94%, 68%)" },
    Alfa: { label: "Alfa", color: "hsl(0, 84%, 60%)" },
    attendanceRate: { label: "Tingkat Kehadiran (%)", color: "hsl(142, 76%, 36%)" }
};

export function AttendanceTrendChart({ data, dateRange }: AttendanceTrendChartProps) {
    const chartData = useMemo(() => {
        if (data.length === 0 || !dateRange?.from || !dateRange?.to) return [];

        // Generate all dates in the range
        const dateInterval = eachDayOfInterval({
            start: dateRange.from,
            end: dateRange.to
        });

        return dateInterval.map(date => {
            const formattedDate = format(date, 'yyyy-MM-dd');
            const dayRecords = data.filter(record => record.date === formattedDate);
            
            const statusCounts = dayRecords.reduce((acc, record) => {
                acc[record.status] = (acc[record.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const hadir = statusCounts['Hadir'] || 0;
            const sakit = statusCounts['Sakit'] || 0;
            const izin = statusCounts['Izin'] || 0;
            const alfa = statusCounts['Alfa'] || 0;
            const total = hadir + sakit + izin + alfa;
            const attendanceRate = total > 0 ? (hadir / total) * 100 : 0;

            return {
                date: format(date, 'dd/MM'),
                fullDate: formattedDate,
                displayDate: format(date, 'EEE, dd MMM', { locale: indonesiaLocale }),
                Hadir: hadir,
                Sakit: sakit,
                Izin: izin,
                Alfa: alfa,
                total: total,
                attendanceRate: Math.round(attendanceRate * 10) / 10 // Round to 1 decimal
            };
        });
    }, [data, dateRange]);

    const trendAnalysis = useMemo(() => {
        if (chartData.length < 2) return null;

        const firstWeek = chartData.slice(0, Math.min(7, chartData.length));
        const lastWeek = chartData.slice(-Math.min(7, chartData.length));

        const firstWeekAvg = firstWeek.reduce((sum, day) => sum + day.attendanceRate, 0) / firstWeek.length;
        const lastWeekAvg = lastWeek.reduce((sum, day) => sum + day.attendanceRate, 0) / lastWeek.length;

        const trend = lastWeekAvg - firstWeekAvg;
        const trendPercentage = Math.abs(trend);

        return {
            trend: trend > 0 ? 'naik' : trend < 0 ? 'turun' : 'stabil',
            percentage: trendPercentage,
            isPositive: trend >= 0
        };
    }, [chartData]);

    if (chartData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Tren Kehadiran</CardTitle>
                    <CardDescription>Grafik tren kehadiran dari waktu ke waktu</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Pilih rentang tanggal untuk melihat tren kehadiran</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Trend Summary */}
            {trendAnalysis && (
                <Card className={`${trendAnalysis.isPositive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <TrendingUp className={`h-5 w-5 ${trendAnalysis.isPositive ? 'text-green-600' : 'text-red-600 rotate-180'}`} />
                            <div>
                                <p className={`text-sm font-medium ${trendAnalysis.isPositive ? 'text-green-900' : 'text-red-900'}`}>
                                    Tren Kehadiran {trendAnalysis.trend === 'stabil' ? 'Stabil' : 
                                        trendAnalysis.trend === 'naik' ? 'Meningkat' : 'Menurun'}
                                </p>
                                <p className={`text-xs ${trendAnalysis.isPositive ? 'text-green-700' : 'text-red-700'}`}>
                                    {trendAnalysis.trend !== 'stabil' && 
                                        `${trendAnalysis.percentage.toFixed(1)}% dibanding periode sebelumnya`
                                    }
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Attendance Rate Trend */}
            <Card>
                <CardHeader>
                    <CardTitle>Tren Tingkat Kehadiran</CardTitle>
                    <CardDescription>Persentase kehadiran harian dalam periode yang dipilih</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ChartContainer config={chartConfig} className="w-full h-full">
                            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis 
                                    dataKey="date" 
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                />
                                <YAxis 
                                    domain={[0, 100]}
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(value) => `${value}%`}
                                />
                                <Tooltip 
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white p-3 border rounded-lg shadow-lg">
                                                    <p className="font-medium">{data.displayDate}</p>
                                                    <p className="text-green-600">
                                                        Tingkat Kehadiran: {data.attendanceRate}%
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {data.Hadir} hadir dari {data.total} siswa
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="attendanceRate" 
                                    stroke="hsl(142, 76%, 36%)" 
                                    fillOpacity={1}
                                    fill="url(#attendanceGradient)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Daily Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>Breakdown Harian</CardTitle>
                    <CardDescription>Detail status kehadiran per hari</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px]">
                        <ChartContainer config={chartConfig} className="w-full h-full">
                            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis 
                                    dataKey="date" 
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                />
                                <YAxis 
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    allowDecimals={false}
                                />
                                <Tooltip 
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white p-3 border rounded-lg shadow-lg">
                                                    <p className="font-medium mb-2">{data.displayDate}</p>
                                                    <div className="space-y-1">
                                                        <p className="text-green-600">Hadir: {data.Hadir}</p>
                                                        <p className="text-yellow-600">Sakit: {data.Sakit}</p>
                                                        <p className="text-blue-600">Izin: {data.Izin}</p>
                                                        <p className="text-red-600">Alfa: {data.Alfa}</p>
                                                        <hr className="my-1" />
                                                        <p className="font-medium">Total: {data.total}</p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend />
                                <Line dataKey="Hadir" stroke="var(--color-Hadir)" strokeWidth={2} dot={{ r: 3 }} />
                                <Line dataKey="Sakit" stroke="var(--color-Sakit)" strokeWidth={2} dot={{ r: 3 }} />
                                <Line dataKey="Izin" stroke="var(--color-Izin)" strokeWidth={2} dot={{ r: 3 }} />
                                <Line dataKey="Alfa" stroke="var(--color-Alfa)" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}