import { AttendanceSheet } from "@/components/attendance/attendance-sheet";

export async function generateStaticParams() {
  // For static export, we need to provide at least one static param
  // This will be handled dynamically by Capacitor
  return [{ classId: 'placeholder' }];
}

export default async function AttendancePage({ 
  params 
}: { 
  params: Promise<{ classId: string }> 
}) {
  const { classId } = await params;
  
  return (
    <div className="container mx-auto">
      <AttendanceSheet classId={classId} />
    </div>
  );
}