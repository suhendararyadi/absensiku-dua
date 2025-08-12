import { collection, getDocs, query, where, orderBy, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, subDays } from 'date-fns';

// Define interfaces for type safety
interface Class {
    id: string;
    className: string;
    studentCount: number;
}

interface Student {
    id: string;
    studentName: string;
    nisn: string;
}

interface AttendanceRecord {
    id: string;
    studentId: string;
    studentName: string;
    classId: string;
    date: string;
    status: string;
    checkInTime?: any;
    checkOutTime?: any;
}

// Helper function to convert Firestore documents to plain objects
const docsToObjects = (querySnapshot: QuerySnapshot<DocumentData>) => {
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export async function getClasses(): Promise<Class[]> {
    console.log('Fetching classes...');
    const classesQuery = query(collection(db, 'classes'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(classesQuery);
    if (snapshot.empty) {
        return [];
    }
    const classes = docsToObjects(snapshot).map((c: any): Class => ({ 
        id: c.id, 
        className: c.className, 
        studentCount: c.studentCount 
    }));
    console.log('Found classes:', classes);
    return classes;
}

export async function getStudentsInClass(classId: string): Promise<Student[]> {
    console.log(`Fetching students for class ID: ${classId}`);
    const studentsQuery = query(collection(db, `classes/${classId}/students`), orderBy('studentName'));
    const snapshot = await getDocs(studentsQuery);
    if (snapshot.empty) {
        return [];
    }
    const students = docsToObjects(snapshot).map((s: any): Student => ({ 
        id: s.id, 
        studentName: s.studentName, 
        nisn: s.nisn 
    }));
    console.log('Found students:', students);
    return students;
}

interface AttendanceParams {
  classId?: string;
  studentName?: string;
  days?: number;
}

export async function getAttendance(params: AttendanceParams): Promise<AttendanceRecord[] | string> {
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
        const attendance = docsToObjects(snapshot).map((a: any): AttendanceRecord => ({ 
            id: a.id,
            studentId: a.studentId || '',
            studentName: a.studentName, 
            classId: a.classId || '',
            date: a.date, 
            status: a.status,
            checkInTime: a.checkInTime,
            checkOutTime: a.checkOutTime
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

// New function to get attendance statistics
export async function getAttendanceStats(days: number = 7): Promise<any> {
    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
    const attendanceQuery = query(
        collection(db, 'attendance'),
        where('date', '>=', startDate),
        orderBy('date', 'desc')
    );
    
    try {
        const snapshot = await getDocs(attendanceQuery);
        const records = docsToObjects(snapshot);
        
        // Calculate statistics
        const stats = {
            totalRecords: records.length,
            statusBreakdown: {
                Hadir: 0,
                Sakit: 0,
                Izin: 0,
                Alfa: 0
            },
            dailyStats: {} as any,
            classStats: {} as any
        };
        
        records.forEach((record: any) => {
            // Status breakdown
            if (stats.statusBreakdown.hasOwnProperty(record.status)) {
                stats.statusBreakdown[record.status as keyof typeof stats.statusBreakdown]++;
            }
            
            // Daily stats
            if (!stats.dailyStats[record.date]) {
                stats.dailyStats[record.date] = { Hadir: 0, Sakit: 0, Izin: 0, Alfa: 0, total: 0 };
            }
            stats.dailyStats[record.date][record.status]++;
            stats.dailyStats[record.date].total++;
            
            // Class stats
            if (!stats.classStats[record.classId]) {
                stats.classStats[record.classId] = { Hadir: 0, Sakit: 0, Izin: 0, Alfa: 0, total: 0 };
            }
            stats.classStats[record.classId][record.status]++;
            stats.classStats[record.classId].total++;
        });
        
        return stats;
    } catch (error) {
        console.error('Error fetching attendance stats:', error);
        return null;
    }
}