'use client';

import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { AdminThemeProvider } from '@/components/admin/ThemeProvider';
import AdminShell from '@/components/admin/AdminShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Login page renders bare (no shell, no auth scaffolding)
  if (pathname === '/admin/login') {
    return (
      <AdminThemeProvider>
        <div className="admin-scope">
          <Toaster position="top-right" />
          {children}
        </div>
      </AdminThemeProvider>
    );
  }

  return (
    <AdminThemeProvider>
      <AdminShell>{children}</AdminShell>
    </AdminThemeProvider>
  );
}
