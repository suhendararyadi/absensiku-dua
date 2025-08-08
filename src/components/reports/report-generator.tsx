
"use client"

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DateRange } from 'react-day-picker';
import { format, startOfDay, endOfDay } from 'date-fns';
import { id as indonesiaLocale } from 'date-fns/locale';
import * as xlsx from 'xlsx';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Calendar as CalendarIcon, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

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
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [statusFilter, setStatusFilter] = useState<AttendanceStatus | "all">("all");
    const [reportData, setReportData] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingClasses, setIsLoadingClasses] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchClasses = async () => {
            setIsLoadingClasses(true);
            const q = query(collection(db, 'classes'), orderBy('className'));
            const querySnapshot = await getDocs(q);
            const classesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassData));
            setClasses(classesData);
            setIsLoadingClasses(false);
        };
        fetchClasses();
    }, []);

    const handleGenerateReport = async () => {
        if (!selectedClassId || !dateRange?.from || !dateRange?.to) {
            toast({
                variant: 'destructive',
                title: 'Filter tidak lengkap',
                description: 'Silakan pilih kelas dan rentang tanggal terlebih dahulu.',
            });
            return;
        }

        setIsLoading(true);
        setReportData([]);

        try {
            const startDate = format(startOfDay(dateRange.from), "yyyy-MM-dd");
            const endDate = format(endOfDay(dateRange.to), "yyyy-MM-dd");

            const q = query(
                collection(db, 'attendance'),
                where('classId', '==', selectedClassId),
                where('date', '>=', startDate),
                where('date', '<=', endDate)
            );

            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord))
              .sort((a, b) => b.date.localeCompare(a.date));
            
            if(data.length === 0) {
                 toast({
                    title: 'Tidak ada data',
                    description: 'Tidak ada data absensi yang ditemukan untuk filter yang dipilih.',
                });
            }

            setReportData(data);

        } catch (error: any) {
            console.error("Firebase query error:", error);
            let description = 'Terjadi kesalahan saat mengambil data dari server.';
            if (error.code === 'failed-precondition') {
                description = 'Query membutuhkan indeks. Silakan cek konsol browser (F12) untuk link pembuatan indeks otomatis oleh Firebase.';
            }
            toast({
                variant: 'destructive',
                title: 'Gagal memuat laporan',
                description: description,
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
        
        const selectedClass = classes.find(c => c.id === selectedClassId);
        const className = selectedClass?.className || 'Laporan';
        const dateFromString = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
        const dateToString = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '';
        const fileName = `Laporan_Absensi_${className}_${dateFromString}_${dateToString}.xlsx`;

        const dataToExport = filteredReportData.map(record => ({
            "Nama Siswa": record.studentName,
            "Tanggal": format(new Date(record.date), "d MMMM yyyy", { locale: indonesiaLocale }),
            "Status": record.status
        }));
        
        const worksheet = xlsx.utils.json_to_sheet(dataToExport);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Laporan Absensi");
        xlsx.writeFile(workbook, fileName);
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Filter Laporan</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4 flex-wrap">
                    <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={isLoadingClasses}>
                        <SelectTrigger className="w-full md:w-[200px]">
                            <SelectValue placeholder={isLoadingClasses ? "Memuat kelas..." : "Pilih Kelas"} />
                        </SelectTrigger>
                        <SelectContent>
                            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.className}</SelectItem>)}
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
                    <Card>
                        <CardHeader>
                            <CardTitle>Ringkasan</CardTitle>
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
                    <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <div>
                                <CardTitle>Detail Laporan</CardTitle>
                                <CardDescription>Daftar detail absensi siswa. Gunakan filter di bawah untuk menyaring data.</CardDescription>
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
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama Siswa</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredReportData.length > 0 ? (
                                        filteredReportData.map(record => (
                                            <TableRow key={record.id}>
                                                <TableCell className="font-medium">{record.studentName}</TableCell>
                                                <TableCell>{format(new Date(record.date), "d MMMM yyyy", { locale: indonesiaLocale })}</TableCell>
                                                <TableCell>
                                                    <span className={cn(
                                                        "font-semibold",
                                                        record.status === 'Hadir' && 'text-green-600',
                                                        record.status === 'Sakit' && 'text-yellow-600',
                                                        record.status === 'Izin' && 'text-blue-600',
                                                        record.status === 'Alfa' && 'text-red-600'
                                                    )}>{record.status}</span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">
                                                Tidak ada data yang cocok dengan filter status.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
