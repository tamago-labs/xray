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
  const isChatSession = pathname.startsWith('/dashboard/chats/');

  return (
    <div className="min-h-screen bg-dark">
        <Sidebar />
        <div className={`ml-56 flex flex-col ${isNewChat || isChatSession ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
          <Topbar />
          <main className={isNewChat || isChatSession ? 'h-screen overflow-hidden' : 'p-6'}>{children}</main>
        </div>
    </div>
  );
}
