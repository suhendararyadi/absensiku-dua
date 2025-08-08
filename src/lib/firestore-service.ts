
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, subDays } from 'date-fns';

// Helper function to convert Firestore documents to plain objects
const docsToObjects = (querySnapshot: any) => {
    return querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
};

export async function getClasses() {
    console.log('Fetching classes...');
    const classesQuery = query(collection(db, 'classes'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(classesQuery);
    if (snapshot.empty) {
        return [];
    }
    const classes = docsToObjects(snapshot).map(c => ({ id: c.id, className: c.className, studentCount: c.studentCount }));
    console.log('Found classes:', classes);
    return classes;
}

export async function getStudentsInClass(classId: string) {
    console.log(`Fetching students for class ID: ${classId}`);
    const studentsQuery = query(collection(db, `classes/${classId}/students`), orderBy('studentName'));
    const snapshot = await getDocs(studentsQuery);
    if (snapshot.empty) {
        return [];
    }
    const students = docsToObjects(snapshot).map(s => ({ id: s.id, studentName: s.studentName, nisn: s.nisn }));
    console.log('Found students:', students);
    return students;
}

interface AttendanceParams {
  classId?: string;
  studentName?: string;
  days?: number;
}

export async function getAttendance(params: AttendanceParams) {
    console.log('Fetching attendance with params:', params);
    let conditions = [];

    if (params.classId) {
        conditions.push(where('classId', '==', params.classId));
    }
    if (params.studentName) {
        // Using inequalities for string matching since Firestore doesn't support partial text search
        conditions.push(where('studentName', '>=', params.studentName));
        conditions.push(where('studentName', '<=', params.studentName + '\uf8ff'));
    }

    const days = params.days || 7;
    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
    conditions.push(where('date', '>=', startDate));

    const attendanceQuery = query(collection(db, 'attendance'), ...conditions, orderBy('date', 'desc'));
    
    try {
        const snapshot = await getDocs(attendanceQuery);
        if (snapshot.empty) {
            return `Tidak ada data absensi ditemukan dengan filter yang diberikan dalam ${days} hari terakhir.`;
        }
        const attendance = docsToObjects(snapshot).map(a => ({ 
            studentName: a.studentName, 
            date: a.date, 
            status: a.status 
        }));
        console.log('Found attendance records:', attendance);
        return attendance;
    } catch (e: any) {
        // Firebase throws an error if an index is required but not created.
        if (e.code === 'failed-precondition') {
            return `Query memerlukan indeks komposit. Silakan buat indeks di Firebase Console untuk field yang digunakan: ${e.message}`;
        }
        console.error('Error fetching attendance:', e);
        return `Terjadi kesalahan saat mengambil data absensi: ${e.message}`;
    }
}
