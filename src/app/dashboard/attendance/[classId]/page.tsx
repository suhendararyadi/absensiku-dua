import { AttendanceSheet } from "@/components/attendance/attendance-sheet";

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