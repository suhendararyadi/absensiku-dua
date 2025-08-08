
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export function Sidebar() {
    const pathname = usePathname();
    const { userProfile } = useAuth();
    
    const isLinkActive = (href: string, exact: boolean = false) => {
        if (exact) {
            return pathname === href;
        }
        return pathname.startsWith(href);
    }
    
    const navLinks = [
      { href: '/dashboard', label: 'Dashboard', icon: Home, exact: true },
      { href: '/dashboard/classes', label: 'Daftar Kelas', icon: List },
      { href: '/dashboard/teachers', label: 'Kelola Guru', icon: Users, adminOnly: true },
      { href: '/dashboard/reports', label: 'Laporan', icon: BarChart3 },
      { href: '/dashboard/chatbot', label: 'Chatbot', icon: Bot },
    ];

    return (
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
            <nav className="flex flex-col gap-4 px-4 sm:py-5">
                <Link
                    href="/dashboard"
                    className="group flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-primary text-lg font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    <BookUser className="h-5 w-5 transition-transform group-hover:scale-110" />
                    <span>AbsensiKu</span>
                </Link>
                
                {navLinks.map(link => {
                    if (link.adminOnly && userProfile?.role !== 'admin') {
                        return null;
                    }
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary',
                                isLinkActive(link.href, link.exact) 
                                    ? 'bg-accent text-primary' 
                                    : 'text-muted-foreground'
                            )}
                        >
                            <link.icon className="h-4 w-4" />
                            {link.label}
                        </Link>
                    )
                })}
            </nav>
        </aside>
    );
}
