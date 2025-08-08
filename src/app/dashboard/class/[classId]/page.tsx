import { StudentList } from "@/components/students/student-list";

export default function ClassPage({ params }: { params: { classId: string } }) {
  return (
    <div className="container mx-auto">
        <StudentList classId={params.classId} />
    </div>
  );
}
