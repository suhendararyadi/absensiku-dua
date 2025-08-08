import { StudentList } from "@/components/students/student-list";

export default async function ClassPage({ 
  params 
}: { 
  params: Promise<{ classId: string }> 
}) {
  const { classId } = await params;
  
  return (
    <div className="container mx-auto">
        <StudentList classId={classId} />
    </div>
  );
}