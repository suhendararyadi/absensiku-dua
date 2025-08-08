
"use client";

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { id as indonesiaLocale } from 'date-fns/locale';
import { Line, LineChart, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { ClipboardMinus } from 'lucide-react';

type AttendanceStatus = "Hadir" | "Izin" | "Sakit" | "Alfa";

interface AttendanceRecord {
    status: AttendanceStatus;
    date: string;
}

const chartConfig = {
  Hadir: { label: "Hadir", color: "hsl(var(--chart-2))" },
  Sakit: { label: "Sakit", color: "hsl(var(--chart-4))" },
  Izin: { label: "Izin", color: "hsl(var(--chart-1))" },
  Alfa: { label: "Alfa", color: "hsl(var(--destructive))" },
};

export function SchoolOverview() {
    const [chartData, setChartData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLast7DaysOverview = async () => {
            setIsLoading(true);
            try {
                const endDate = new Date();
                const startDate = subDays(endDate, 6);

                const attendanceQuery = query(
                    collection(db, 'attendance'), 
                    where('date', '>=', format(startDate, "yyyy-MM-dd")),
                    where('date', '<=', format(endDate, "yyyy-MM-dd"))
                );
                
                const attendanceSnapshot = await getDocs(attendanceQuery);
                const attendanceRecords = attendanceSnapshot.docs.map(doc => doc.data() as AttendanceRecord);

                const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

                const dailySummary = dateRange.map(day => {
                    const formattedDay = format(day, 'yyyy-MM-dd');
                    const recordsForDay = attendanceRecords.filter(r => r.date === formattedDay);
                    
                    const summary = recordsForDay.reduce((acc, record) => {
                        acc[record.status] = (acc[record.status] || 0) + 1;
                        return acc;
                    }, {} as Record<AttendanceStatus, number>);

                    return {
                        date: format(day, 'EEE', { locale: indonesiaLocale }),
                        fullDate: formattedDay,
                        Hadir: summary.Hadir || 0,
                        Sakit: summary.Sakit || 0,
                        Izin: summary.Izin || 0,
                        Alfa: summary.Alfa || 0,
                    };
                });
                
                setChartData(dailySummary);

            } catch (error) {
                console.error("Failed to fetch weekly overview data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLast7DaysOverview();
    }, []);
    
    if (isLoading) {
        return <Skeleton className="h-96" />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Grafik Kehadiran (7 Hari Terakhir)</CardTitle>
                <CardDescription>
                    Menampilkan tren absensi siswa selama seminggu terakhir.
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[350px]">
                { chartData.length > 0 ? (
                    <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-video h-full"
                    >
                        <LineChart
                            data={chartData}
                            margin={{ top: 5, right: 20, left: -10, bottom: 0 }}
                        >
                            <CartesianGrid vertical={false} />
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
                                cursor={false}
                                content={<ChartTooltipContent indicator="dot" />}
                            />
                            <Legend />
                            <Line dataKey="Hadir" type="monotone" stroke="var(--color-Hadir)" strokeWidth={2} dot={false} />
                            <Line dataKey="Sakit" type="monotone" stroke="var(--color-Sakit)" strokeWidth={2} dot={false} />
                            <Line dataKey="Izin" type="monotone" stroke="var(--color-Izin)" strokeWidth={2} dot={false} />
                            <Line dataKey="Alfa" type="monotone" stroke="var(--color-Alfa)" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ChartContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full rounded-md border-2 border-dashed">
                            <ClipboardMinus className="h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4 text-muted-foreground">Belum ada data absensi untuk ditampilkan.</p>
                    </div>
                )}
                </div>
            </CardContent>
        </Card>
    );
}
