
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Bot,
  PanelLeft,
  List,
  BarChart3,
  BookUser,
  Users,
} from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AuthProvider } from '@/contexts/auth-context';
import { useAuth } from '@/hooks/use-auth';
import { Sidebar } from '@/components/dashboard/sidebar';

function DashboardHeader() {
    const { user, signOut, userProfile } = useAuth();
    const pathname = usePathname();

    const getBreadcrumb = () => {
        if (pathname === '/dashboard') return 'Dashboard';
        if (pathname === '/dashboard/classes') return 'Daftar Kelas';
        if (pathname === '/dashboard/reports') return 'Laporan';
        if (pathname.startsWith('/dashboard/class/')) return 'Kelola Siswa';
        if (pathname.startsWith('/dashboard/attendance/')) return 'Absensi';
        if (pathname === '/dashboard/chatbot') return 'Chatbot';
        if (pathname === '/dashboard/teachers') return 'Kelola Guru';
        return 'Halaman';
    }


    return (
         <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <nav className="grid gap-6 text-lg font-medium">
                <Link
                  href="/dashboard"
                  className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-bold text-primary-foreground md:text-base"
                >
                  <BookUser className="h-5 w-5 transition-all group-hover:scale-110" />
                  <span className="sr-only">AbsensiKu</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <Home className="h-5 w-5" />
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/classes"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <List className="h-5 w-5" />
                  Daftar Kelas
                </Link>
                {userProfile?.role === 'admin' && (
                  <Link
                    href="/dashboard/teachers"
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <Users className="h-5 w-5" />
                    Kelola Guru
                  </Link>
                )}
                <Link
                  href="/dashboard/reports"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <BarChart3 className="h-5 w-5" />
                  Laporan
                </Link>
                 <Link
                  href="/dashboard/chatbot"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <Bot className="h-5 w-5" />
                  Chatbot
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">AbsensiKu</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{getBreadcrumb()}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="relative ml-auto flex-1 md:grow-0">
            {/* Search can be added here if needed */}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full"
              >
                 <BookUser className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Pengaturan</DropdownMenuItem>
              <DropdownMenuItem>Bantuan</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>Keluar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
    )
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <Sidebar />
             <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64">
                <DashboardHeader />
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                    {children}
                </main>
            </div>
        </div>
    </AuthProvider>
  );
}
