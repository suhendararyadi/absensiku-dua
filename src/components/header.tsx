"use client";

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { BookUser, LayoutDashboard, BarChart3, Bot, Moon, Sun } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/reports', label: 'Laporan', icon: BarChart3 },
    { href: '/chatbot', label: 'Chatbot', icon: Bot },
  ];

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center px-4 md:px-6">
        <Link href="/dashboard" className="mr-6 flex items-center gap-2">
          <BookUser className="h-6 w-6 text-primary" />
          <span className="hidden font-bold sm:inline-block text-foreground">AbsensiKu</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'transition-colors hover:text-primary flex items-center gap-2',
                pathname.startsWith(link.href) ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            {mounted && (
              <>
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </>
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
