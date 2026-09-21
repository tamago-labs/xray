'use client';

import PreIpoList from '@/components/dashboard/pre-ipo/PreIpoList';

export default function PreIpoPage() {
  return (
    <div className="h-[calc(100vh-6.5rem)] overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <PreIpoList />
      </div>
    </div>
  );
}
