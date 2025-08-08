
"use client";

import { FrequentAbsences } from "@/components/dashboard/frequent-absences";
import { SchoolOverview } from "@/components/dashboard/school-overview";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
        <SummaryCards />
        <SchoolOverview />
        <Card>
            <CardHeader>
                <CardTitle>Siswa dengan Absensi Terbanyak</CardTitle>
                <CardDescription>Daftar siswa dengan akumulasi Izin, Sakit, atau Alfa terbanyak dalam 30 hari terakhir.</CardDescription>
            </CardHeader>
            <CardContent>
                <FrequentAbsences />
            </CardContent>
        </Card>
    </div>
  );
}
