"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Medal, Award, TrendingDown, User } from 'lucide-react';

interface AttendanceRecord {
    id: string;
    studentName: string;
    date: string;
    status: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';
    classId: string;
}

interface StudentRankingProps {
    data: AttendanceRecord[];
}

interface StudentStats {
    name: string;
    totalRecords: number;
    hadir: number;
    sakit: number;
    izin: number;
    alfa: number;
    attendanceRate: number;
    rank: number;
}

export function StudentRanking({ data }: StudentRankingProps) {
    const studentStats = useMemo(() => {
        if (data.length === 0) return [];

        // Group by student
        const studentData = data.reduce((acc, record) => {
            if (!acc[record.studentName]) {
                acc[record.studentName] = {
                    name: record.studentName,
                    totalRecords: 0,
                    hadir: 0,
                    sakit: 0,
                    izin: 0,
                    alfa: 0
                };
            }
            
            acc[record.studentName].totalRecords++;
            acc[record.studentName][record.status.toLowerCase() as keyof typeof acc[string]]++;
            
            return acc;
        }, {} as Record<string, Omit<StudentStats, 'attendanceRate' | 'rank'>>);

        // Calculate attendance rate and sort
        const stats = Object.values(studentData)
            .map(student => ({
                ...student,
                attendanceRate: (student.hadir / student.totalRecords) * 100
            }))
            .sort((a, b) => b.attendanceRate - a.attendanceRate)
            .map((student, index) => ({
                ...student,
                rank: index + 1
            }));

        return stats;
    }, [data]);

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="h-5 w-5 text-yellow-500" />;
            case 2:
                return <Medal className="h-5 w-5 text-gray-400" />;
            case 3:
                return <Award className="h-5 w-5 text-amber-600" />;
            default:
                return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
        }
    };

    const getRankBadge = (rank: number, attendanceRate: number) => {
        if (rank <= 3) {
            const colors = ['bg-yellow-100 text-yellow-800', 'bg-gray-100 text-gray-800', 'bg-amber-100 text-amber-800'];
            return <Badge className={colors[rank - 1]}>Peringkat {rank}</Badge>;
        } else if (attendanceRate >= 90) {
            return <Badge className="bg-green-100 text-green-800">Sangat Baik</Badge>;
        } else if (attendanceRate >= 80) {
            return <Badge className="bg-blue-100 text-blue-800">Baik</Badge>;
        } else if (attendanceRate >= 70) {
            return <Badge className="bg-yellow-100 text-yellow-800">Cukup</Badge>;
        } else {
            return <Badge className="bg-red-100 text-red-800">Perlu Perhatian</Badge>;
        }
    };

    const topPerformers = studentStats.slice(0, 3);
    const needsAttention = studentStats.filter(s => s.attendanceRate < 75);

    if (studentStats.length === 0) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground">Tidak ada data siswa untuk ditampilkan</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Siswa Terbaik */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Siswa Terbaik
                    </CardTitle>
                    <CardDescription>Siswa dengan tingkat kehadiran terbaik</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        {topPerformers.map((student, index) => (
                            <div key={student.name} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                                <div className="flex-shrink-0">
                                    {getRankIcon(student.rank)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {student.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Progress value={student.attendanceRate} className="flex-1 h-2" />
                                        <span className="text-sm font-semibold text-green-600">
                                            {student.attendanceRate.toFixed(1)}%
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {student.hadir}/{student.totalRecords} hadir
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Siswa yang Perlu Perhatian */}
            {needsAttention.length > 0 && (
                <Card className="border-red-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-700">
                            <TrendingDown className="h-5 w-5" />
                            Perlu Perhatian
                        </CardTitle>
                        <CardDescription>Siswa dengan tingkat kehadiran di bawah 75%</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {needsAttention.map((student) => (
                                <div key={student.name} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <User className="h-4 w-4 text-red-600" />
                                        <div>
                                            <p className="font-medium text-red-900">{student.name}</p>
                                            <p className="text-sm text-red-700">
                                                {student.hadir} hadir, {student.sakit} sakit, {student.izin} izin, {student.alfa} alfa
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-red-900">
                                            {student.attendanceRate.toFixed(1)}%
                                        </p>
                                        <Badge className="bg-red-100 text-red-800">Peringkat #{student.rank}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabel Peringkat Lengkap */}
            <Card>
                <CardHeader>
                    <CardTitle>Ranking Lengkap Siswa</CardTitle>
                    <CardDescription>Daftar lengkap siswa berdasarkan tingkat kehadiran</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16">Peringkat</TableHead>
                                <TableHead>Nama Siswa</TableHead>
                                <TableHead className="text-center">Hadir</TableHead>
                                <TableHead className="text-center">Sakit</TableHead>
                                <TableHead className="text-center">Izin</TableHead>
                                <TableHead className="text-center">Alfa</TableHead>
                                <TableHead className="text-center">Total</TableHead>
                                <TableHead className="text-center">Tingkat Kehadiran</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {studentStats.map((student) => (
                                <TableRow key={student.name} className={student.rank <= 3 ? 'bg-blue-50' : ''}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center justify-center">
                                            {getRankIcon(student.rank)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">{student.name}</TableCell>
                                    <TableCell className="text-center text-green-600 font-medium">
                                        {student.hadir}
                                    </TableCell>
                                    <TableCell className="text-center text-yellow-600">
                                        {student.sakit}
                                    </TableCell>
                                    <TableCell className="text-center text-blue-600">
                                        {student.izin}
                                    </TableCell>
                                    <TableCell className="text-center text-red-600">
                                        {student.alfa}
                                    </TableCell>
                                    <TableCell className="text-center font-medium">
                                        {student.totalRecords}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center gap-2">
                                            <Progress value={student.attendanceRate} className="flex-1 h-2" />
                                            <span className="text-sm font-semibold min-w-[3rem]">
                                                {student.attendanceRate.toFixed(1)}%
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {getRankBadge(student.rank, student.attendanceRate)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}