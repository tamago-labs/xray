'use client';

import { useState, useEffect } from 'react';
import PreIpoList from '@/components/dashboard/pre-ipo/PreIpoList';
import PreIpoInfoModal from '@/components/pre-ipo/PreIpoInfoModal';

export default function PreIpoPage() {
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setModalOpen(true);
  }, []);

  return (
    <div className="h-[calc(100vh-6.5rem)] overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <PreIpoList />
      </div>
      <PreIpoInfoModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
