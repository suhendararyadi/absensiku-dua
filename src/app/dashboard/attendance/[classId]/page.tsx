import { AttendanceSheet } from "@/components/attendance/attendance-sheet";

export default function AttendancePage({ params }: { params: { classId: string } }) {
  return (
    <div className="container mx-auto">
      <AttendanceSheet classId={params.classId} />
    </div>
  );
}
