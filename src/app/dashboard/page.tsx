
"use client";

import { FrequentAbsences } from "@/components/dashboard/frequent-absences";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { AdvancedAnalytics } from "@/components/dashboard/advanced-analytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="w-full">
          <SummaryCards />
        </div>

        {/* Advanced Analytics */}
        <Card className="w-full">
          <AdvancedAnalytics />
        </Card>

        {/* Quick Actions Panel */}
        <Card className="w-full">
          <QuickActions />
        </Card>

        {/* Frequent Absences - Full Width */}
        <Card className="w-full">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-b">
            <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Perhatian Khusus
            </CardTitle>
            <CardDescription className="text-red-700 dark:text-red-300">
              Siswa dengan absensi terbanyak dalam 30 hari terakhir
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <FrequentAbsences />
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="mt-8 border-t bg-muted/30 py-4">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} AbsensiKu - Sistem Manajemen Kehadiran. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
