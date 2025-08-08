import { ReportGenerator } from "@/components/reports/report-generator";

export default function ReportsPage() {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-between space-y-2 mb-8">
          <div>
              <h1 className="text-3xl font-bold tracking-tight">Laporan Absensi</h1>
              <p className="text-muted-foreground">
                  Filter dan lihat rekapitulasi absensi siswa.
              </p>
          </div>
        </div>
        <ReportGenerator />
      </div>
    );
  }
  