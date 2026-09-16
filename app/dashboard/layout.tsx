'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import Topbar from '@/components/dashboard/Topbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isNewChat = pathname === '/dashboard' || pathname === '/dashboard/';

  return (
    <div className="min-h-screen bg-dark">
        <Sidebar />
        <div className="ml-56">
          <Topbar />
          <main className={isNewChat ? '' : 'p-6'}>{children}</main>
        </div>
    </div>
  );
}
