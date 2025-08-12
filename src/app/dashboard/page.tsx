
"use client";

import { FrequentAbsences } from "@/components/dashboard/frequent-absences";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { AdvancedAnalytics } from "@/components/dashboard/advanced-analytics";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Main Content - Single Column Layout */}
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg">
          <SummaryCards />
        </div>

        {/* Quick Actions Panel - Now in main flow */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg overflow-hidden">
          <QuickActions />
        </div>

        {/* Advanced Analytics - Main Chart */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg overflow-hidden">
          <AdvancedAnalytics />
        </div>

        {/* Alert & Status Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Frequent Absences */}
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
              <CardTitle className="flex items-center gap-2 text-red-800">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Perhatian Khusus
              </CardTitle>
              <CardDescription className="text-red-700">
                Siswa dengan absensi terbanyak dalam 30 hari terakhir
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <FrequentAbsences />
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <RecentActivities />
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">📊</div>
          <div className="text-sm font-medium text-slate-700 mt-1">Data Analytics</div>
          <div className="text-xs text-slate-500">Real-time insights</div>
        </div>
        
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">🔒</div>
          <div className="text-sm font-medium text-slate-700 mt-1">Secure & Private</div>
          <div className="text-xs text-slate-500">Data protection</div>
        </div>
        
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">⚡</div>
          <div className="text-sm font-medium text-slate-700 mt-1">Fast Performance</div>
          <div className="text-xs text-slate-500">Optimized system</div>
        </div>
      </div>
    </div>
  );
}
