import { StudentList } from "@/components/students/student-list";

export async function generateStaticParams() {
  // For static export, we need to provide at least one static param
  // This will be handled dynamically by Capacitor
  return [{ classId: 'placeholder' }];
}

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