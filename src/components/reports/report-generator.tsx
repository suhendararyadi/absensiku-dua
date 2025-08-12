
"use client";

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { id as indonesiaLocale } from 'date-fns/locale';
import { DateRange } from "react-day-picker";
import { CalendarIcon, Download, Loader2, BarChart3, TrendingUp, Users, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import * as xlsx from 'xlsx';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Bar, BarChart, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

// Import komponen baru
import { ReportStatistics } from './report-statistics';
import { AttendanceTrendChart } from './attendance-trend-chart';
import { StudentRanking } from './student-ranking';

interface ClassData {
    id: string;
    className: string;
}

type AttendanceStatus = "Hadir" | "Izin" | "Sakit" | "Alfa";

interface AttendanceRecord {
    id: string;
    studentName: string;
    date: string;
    status: AttendanceStatus;
}

const chartConfig = {
  Hadir: { label: "Hadir", color: "hsl(var(--chart-2))" },
  Sakit: { label: "Sakit", color: "hsl(var(--chart-4))" },
  Izin: { label: "Izin", color: "hsl(var(--chart-1))" },
  Alfa: { label: "Alfa", color: "hsl(var(--destructive))" },
};

export function ReportGenerator() {
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [students, setStudents] = useState<string[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedStudent, setSelectedStudent] = useState<string>('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [statusFilter, setStatusFilter] = useState<AttendanceStatus | "all">("all");
    const [reportData, setReportData] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingClasses, setIsLoadingClasses] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchClasses = async () => {
            setIsLoadingClasses(true);
            try {
                const classesSnapshot = await getDocs(collection(db, 'classes'));
                const classesData = classesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    className: doc.data().className
                }));
                setClasses(classesData);
            } catch (error) {
                console.error('Error fetching classes:', error);
                toast({
                    title: 'Kesalahan',
                    description: 'Gagal memuat daftar kelas.',
                    variant: 'destructive',
                });
            } finally {
                setIsLoadingClasses(false);
            }
        };

        fetchClasses();
    }, [toast]);

    // Fetch students when class is selected
    useEffect(() => {
        const fetchStudents = async () => {
            if (!selectedClassId) {
                setStudents([]);
                return;
            }

            try {
                let allRecords: any[] = [];
                
                if (selectedClassId === 'all') {
                    // Fetch from all classes
                    for (const classItem of classes) {
                        const attendanceQuery = query(
                            collection(db, 'attendance'),
                            where('classId', '==', classItem.id)
                        );
                        const attendanceSnapshot = await getDocs(attendanceQuery);
                        const records = attendanceSnapshot.docs.map(doc => doc.data());
                        allRecords = [...allRecords, ...records];
                    }
                } else {
                    // Fetch from specific class
                    const attendanceQuery = query(
                        collection(db, 'attendance'),
                        where('classId', '==', selectedClassId)
                    );
                    const attendanceSnapshot = await getDocs(attendanceQuery);
                    allRecords = attendanceSnapshot.docs.map(doc => doc.data());
                }
                
                const uniqueStudents = [...new Set(allRecords.map(record => record.studentName))];
                setStudents(uniqueStudents.sort());
            } catch (error) {
                console.error('Error fetching students:', error);
                setStudents([]);
            }
        };

        if (selectedClassId && (selectedClassId !== 'all' || classes.length > 0)) {
            fetchStudents();
        }
        setSelectedStudent('all'); // Reset student filter when class changes
    }, [selectedClassId, classes]);

    const handleGenerateReport = async () => {
        if (!selectedClassId || !dateRange?.from || !dateRange?.to) {
            toast({
                title: 'Informasi tidak lengkap',
                description: 'Silakan pilih kelas dan rentang tanggal.',
            });
            return;
        }

        setIsLoading(true);
        try {
            const startDate = format(startOfDay(dateRange.from), 'yyyy-MM-dd');
            const endDate = format(endOfDay(dateRange.to), 'yyyy-MM-dd');

            let allData: AttendanceRecord[] = [];

            if (selectedClassId === 'all') {
                // Fetch from all classes
                for (const classItem of classes) {
                    let attendanceQuery = query(
                        collection(db, 'attendance'),
                        where('classId', '==', classItem.id),
                        where('date', '>=', startDate),
                        where('date', '<=', endDate),
                        orderBy('date', 'desc')
                    );

                    // Add student filter if specific student is selected
                    if (selectedStudent !== 'all') {
                        attendanceQuery = query(
                            collection(db, 'attendance'),
                            where('classId', '==', classItem.id),
                            where('studentName', '==', selectedStudent),
                            where('date', '>=', startDate),
                            where('date', '<=', endDate),
                            orderBy('date', 'desc')
                        );
                    }

                    const querySnapshot = await getDocs(attendanceQuery);
                    const classData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
                    allData = [...allData, ...classData];
                }
            } else {
                // Fetch from specific class
                let attendanceQuery = query(
                    collection(db, 'attendance'),
                    where('classId', '==', selectedClassId),
                    where('date', '>=', startDate),
                    where('date', '<=', endDate),
                    orderBy('date', 'desc')
                );

                // Add student filter if specific student is selected
                if (selectedStudent !== 'all') {
                    attendanceQuery = query(
                        collection(db, 'attendance'),
                        where('classId', '==', selectedClassId),
                        where('studentName', '==', selectedStudent),
                        where('date', '>=', startDate),
                        where('date', '<=', endDate),
                        orderBy('date', 'desc')
                    );
                }

                const querySnapshot = await getDocs(attendanceQuery);
                allData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
            }

            setReportData(allData);

            if (allData.length === 0) {
                toast({
                    title: 'Tidak ada data',
                    description: 'Tidak ada data absensi ditemukan untuk filter yang dipilih.',
                });
            }
        } catch (error) {
            console.error('Error generating report:', error);
            toast({
                title: 'Kesalahan',
                description: 'Gagal membuat laporan. Silakan coba lagi.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const filteredReportData = useMemo(() => {
        if (statusFilter === "all") {
            return reportData;
        }
        return reportData.filter(record => record.status === statusFilter);
    }, [reportData, statusFilter]);
    
    const summaryData = useMemo(() => {
        if (!reportData || reportData.length === 0) return null;

        const summary = reportData.reduce((acc, record) => {
            acc[record.status] = (acc[record.status] || 0) + 1;
            return acc;
        }, {} as Record<AttendanceStatus, number>);

        return [{
            name: "Rekapitulasi",
            Hadir: summary.Hadir || 0,
            Sakit: summary.Sakit || 0,
            Izin: summary.Izin || 0,
            Alfa: summary.Alfa || 0
        }];
    }, [reportData]);

    const handleExport = () => {
        if (filteredReportData.length === 0) {
            toast({
                title: 'Tidak ada data',
                description: 'Tidak ada data untuk diekspor.',
            });
            return;
        }
        
        let className = 'Semua_Kelas';
        if (selectedClassId !== 'all') {
            const selectedClass = classes.find(c => c.id === selectedClassId);
            className = selectedClass?.className || 'Laporan';
        }
        const dateFromString = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
        const dateToString = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '';
        const studentFilter = selectedStudent !== 'all' ? `_${selectedStudent}` : '';
        const fileName = `Laporan_Absensi_${className}${studentFilter}_${dateFromString}_${dateToString}.xlsx`;

        // Prepare detailed data
        const dataToExport = filteredReportData.map(record => ({
            "Nama Siswa": record.studentName,
            "Tanggal": format(new Date(record.date), "d MMMM yyyy", { locale: indonesiaLocale }),
            "Status": record.status
        }));

        // Calculate statistics
        const totalRecords = reportData.length;
        const statusCounts = reportData.reduce((acc, record) => {
            acc[record.status] = (acc[record.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const hadirCount = statusCounts['Hadir'] || 0;
        const sakitCount = statusCounts['Sakit'] || 0;
        const izinCount = statusCounts['Izin'] || 0;
        const alfaCount = statusCounts['Alfa'] || 0;
        const attendanceRate = totalRecords > 0 ? ((hadirCount / totalRecords) * 100).toFixed(1) : '0';

        // Prepare summary data
        const summaryData = [
            { "Keterangan": "Informasi Laporan", "Nilai": "" },
            { "Keterangan": "Kelas", "Nilai": className },
            { "Keterangan": "Siswa", "Nilai": selectedStudent === 'all' ? 'Semua Siswa' : selectedStudent },
            { "Keterangan": "Periode", "Nilai": `${dateFromString} s/d ${dateToString}` },
            { "Keterangan": "Tanggal Dibuat", "Nilai": format(new Date(), "d MMMM yyyy HH:mm", { locale: indonesiaLocale }) },
            { "Keterangan": "", "Nilai": "" },
            { "Keterangan": "Ringkasan Statistik", "Nilai": "" },
            { "Keterangan": "Total Catatan", "Nilai": totalRecords },
            { "Keterangan": "Hadir", "Nilai": hadirCount },
            { "Keterangan": "Sakit", "Nilai": sakitCount },
            { "Keterangan": "Izin", "Nilai": izinCount },
            { "Keterangan": "Alfa", "Nilai": alfaCount },
            { "Keterangan": "Tingkat Kehadiran", "Nilai": `${attendanceRate}%` },
        ];

        // Create workbook with multiple sheets
        const workbook = xlsx.utils.book_new();
        
        // Summary sheet
        const summaryWorksheet = xlsx.utils.json_to_sheet(summaryData);
        xlsx.utils.book_append_sheet(workbook, summaryWorksheet, "Ringkasan");
        
        // Detailed data sheet
        const detailWorksheet = xlsx.utils.json_to_sheet(dataToExport);
        xlsx.utils.book_append_sheet(workbook, detailWorksheet, "Detail Absensi");

        // Student ranking if showing all students
        if (selectedStudent === 'all') {
            const studentStats = reportData.reduce((acc, record) => {
                if (!acc[record.studentName]) {
                    acc[record.studentName] = { hadir: 0, sakit: 0, izin: 0, alfa: 0, total: 0 };
                }
                acc[record.studentName][record.status.toLowerCase() as keyof typeof acc[string]]++;
                acc[record.studentName].total++;
                return acc;
            }, {} as Record<string, any>);

            const rankingData = Object.entries(studentStats)
                .map(([name, stats]) => ({
                    "Nama Siswa": name,
                    "Hadir": stats.hadir,
                    "Sakit": stats.sakit,
                    "Izin": stats.izin,
                    "Alfa": stats.alfa,
                    "Total": stats.total,
                    "Tingkat Kehadiran (%)": ((stats.hadir / stats.total) * 100).toFixed(1)
                }))
                .sort((a, b) => parseFloat(b["Tingkat Kehadiran (%)"]) - parseFloat(a["Tingkat Kehadiran (%)"]));

            const rankingWorksheet = xlsx.utils.json_to_sheet(rankingData);
            xlsx.utils.book_append_sheet(workbook, rankingWorksheet, "Ranking Siswa");
        }

        xlsx.writeFile(workbook, fileName);
        
        toast({
            title: 'Ekspor berhasil',
            description: `File ${fileName} telah diunduh.`,
        });
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Filter Laporan</CardTitle>
                    <CardDescription>Pilih kelas, siswa, dan rentang tanggal untuk membuat laporan absensi yang detail</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4 flex-wrap">
                    <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={isLoadingClasses}>
                        <SelectTrigger className="w-full md:w-[200px]">
                            <SelectValue placeholder={isLoadingClasses ? "Memuat kelas..." : "Pilih Kelas"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Kelas</SelectItem>
                            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.className}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={selectedStudent} onValueChange={setSelectedStudent} disabled={!selectedClassId || students.length === 0}>
                        <SelectTrigger className="w-full md:w-[200px]">
                            <SelectValue placeholder="Pilih Siswa" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Siswa</SelectItem>
                            {students.map(student => (
                                <SelectItem key={student} value={student}>{student}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full md:w-[280px] justify-start text-left font-normal",
                                !dateRange && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                                dateRange.to ? (
                                    <>
                                        {format(dateRange.from, "d LLL y", {locale: indonesiaLocale})} - {format(dateRange.to, "d LLL y", {locale: indonesiaLocale})}
                                    </>
                                ) : (
                                    format(dateRange.from, "d LLL y", {locale: indonesiaLocale})
                                )
                            ) : (
                                <span>Pilih rentang tanggal</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>

                    <Button onClick={handleGenerateReport} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Buat Laporan
                    </Button>
                </CardContent>
            </Card>

            {isLoading && (
                 <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
            
            {!isLoading && reportData.length > 0 && (
                <div className="space-y-6">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="overview" className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Ringkasan
                            </TabsTrigger>
                            <TabsTrigger value="trends" className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Tren
                            </TabsTrigger>
                            <TabsTrigger value="students" className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Ranking Siswa
                            </TabsTrigger>
                            <TabsTrigger value="details" className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Detail
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-6">
                            <ReportStatistics data={reportData.map(record => ({
                                ...record,
                                classId: selectedClassId
                            }))} />
                            <Card>
                                <CardHeader>
                                    <CardTitle>Grafik Ringkasan Absensi</CardTitle>
                                    <CardDescription>Grafik rekapitulasi dari keseluruhan data yang ditemukan (sebelum difilter berdasarkan status).</CardDescription>
                                </CardHeader>
                                <CardContent className="pl-2">
                                     <div className="h-[250px]">
                                        {summaryData ? (
                                            <ChartContainer config={chartConfig} className="w-full h-full">
                                                <BarChart data={summaryData} accessibilityLayer>
                                                    <XAxis
                                                        dataKey="name"
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickMargin={8}
                                                        tickFormatter={(value) => value.slice(0, 3)}
                                                    />
                                                    <YAxis />
                                                    <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                                    <Legend />
                                                    <Bar dataKey="Hadir" fill="var(--color-Hadir)" radius={4} />
                                                    <Bar dataKey="Sakit" fill="var(--color-Sakit)" radius={4} />
                                                    <Bar dataKey="Izin" fill="var(--color-Izin)" radius={4} />
                                                    <Bar dataKey="Alfa" fill="var(--color-Alfa)" radius={4} />
                                                </BarChart>
                                            </ChartContainer>
                                        ) : <p>Tidak ada data untuk ditampilkan.</p>}
                                     </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="trends">
                            <AttendanceTrendChart data={reportData.map(record => ({
                                ...record,
                                classId: selectedClassId
                            }))} />
                        </TabsContent>

                        <TabsContent value="students">
                            <StudentRanking data={reportData.map(record => ({
                                ...record,
                                classId: selectedClassId
                            }))} />
                        </TabsContent>

                        <TabsContent value="details">
                            <Card>
                                <CardHeader className="flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Detail Laporan Absensi</CardTitle>
                                        <CardDescription>Daftar detail absensi siswa untuk rentang tanggal yang dipilih. Gunakan filter di bawah untuk menyaring data berdasarkan status.</CardDescription>
                                    </div>
                                    <Button onClick={handleExport} variant="outline" disabled={filteredReportData.length === 0}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Ekspor ke Excel
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="mb-4">
                                        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                                            <SelectTrigger className="w-full md:w-[240px]">
                                                <SelectValue placeholder="Filter Berdasarkan Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Status</SelectItem>
                                                <SelectItem value="Hadir">Hadir</SelectItem>
                                                <SelectItem value="Izin">Izin</SelectItem>
                                                <SelectItem value="Sakit">Sakit</SelectItem>
                                                <SelectItem value="Alfa">Alfa</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Tanggal</TableHead>
                                                    <TableHead>Nama Siswa</TableHead>
                                                    <TableHead>Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredReportData.length > 0 ? (
                                                    filteredReportData
                                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                        .map((record, index) => (
                                                        <TableRow key={`${record.id}-${index}`}>
                                                            <TableCell className="font-medium">
                                                                {format(new Date(record.date), "d MMMM yyyy", { locale: indonesiaLocale })}
                                                            </TableCell>
                                                            <TableCell>{record.studentName}</TableCell>
                                                            <TableCell>
                                                                <span className={cn(
                                                                    "px-2 py-1 rounded-full text-xs font-medium",
                                                                    record.status === 'Hadir' && 'bg-green-100 text-green-800',
                                                                    record.status === 'Sakit' && 'bg-yellow-100 text-yellow-800',
                                                                    record.status === 'Izin' && 'bg-blue-100 text-blue-800',
                                                                    record.status === 'Alfa' && 'bg-red-100 text-red-800'
                                                                )}>
                                                                    {record.status}
                                                                </span>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="h-24 text-center">
                                                            Tidak ada data absensi yang cocok dengan filter yang dipilih.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    );
}
