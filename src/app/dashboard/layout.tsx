
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  SidebarProvider, 
  SidebarInset, 
  SidebarTrigger 
} from '@/components/ui/sidebar';
import { AuthProvider } from '@/contexts/auth-context';
import { useAuth } from '@/hooks/use-auth';
import { AppSidebar } from '../../components/dashboard/app-sidebar'

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
         <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          {/* Desktop: SidebarTrigger + Breadcrumb */}
          <div className="hidden md:flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Breadcrumb>
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
          </div>

          {/* Mobile: Sheet Trigger + Title */}
           <div className="flex md:hidden items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button size="icon" variant="outline">
                    <PanelLeft className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="sm:max-w-xs">
                 <SheetHeader className="sr-only">
                    <SheetTitle>Menu Navigasi</SheetTitle>
                 </SheetHeader>
                <nav className="grid gap-6 text-lg font-medium">
                  <Link
                    href="/dashboard"
                    className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
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
            <div className="flex items-center">
              <h1 className="text-lg font-semibold">{getBreadcrumb()}</h1>
            </div>
          </div>
          <div className="ml-auto px-3">
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
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthProvider>
  );
}
