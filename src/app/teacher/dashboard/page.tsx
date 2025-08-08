
"use client";

import { AuthProvider } from '@/contexts/auth-context';

function TeacherDashboardPage() {
    return (
        <div className="container mx-auto">
            <h1 className="text-2xl font-bold">Dashboard Guru</h1>
            <p>Selamat datang! Halaman ini sedang dalam pengembangan.</p>
            <p>Nantinya, di sini akan muncul daftar mata pelajaran yang Anda ajar.</p>
        </div>
    );
}

export default function Page() {
    return (
        <AuthProvider>
            <TeacherDashboardPage />
        </AuthProvider>
    )
}
