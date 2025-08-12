'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Bot,
  List,
  BarChart3,
  BookUser,
  Users,
  ChevronUp,
  User2,
  CalendarCheck,
  GraduationCap,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';

export function AppSidebar() {
  const pathname = usePathname();
  const { userProfile, signOut } = useAuth();
  
  const isLinkActive = (href: string, exact: boolean = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };
  
  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home, exact: true },
    { href: '/dashboard/classes', label: 'Daftar Kelas', icon: List },
    { href: '/dashboard/teachers', label: 'Kelola Guru', icon: Users, adminOnly: true },
    { href: '/dashboard/reports', label: 'Laporan', icon: BarChart3 },
    { href: '/dashboard/chatbot', label: 'Chatbot', icon: Bot },
  ];

  return (
    <Sidebar collapsible="icon" className="hidden md:flex">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <BookUser className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">AbsensiKu</span>
                  <span className="truncate text-xs">Sistem Absensi Modern</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navLinks.map((link) => {
                if (link.adminOnly && userProfile?.role !== 'admin') {
                  return null;
                }
                
                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isLinkActive(link.href, link.exact)}
                    >
                      <Link href={link.href}>
                        <link.icon />
                        <span>{link.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <User2 className="size-4" />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {userProfile?.email?.split('@')[0] || 'User'}
                    </span>
                    <span className="truncate text-xs capitalize">
                      {userProfile?.role || 'Teacher'}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem>
                  <span>Pengaturan</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Bantuan</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  );
}