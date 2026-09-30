'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { useWallet } from '@/components/app/WalletContext';
import PortfolioStats from '@/components/dashboard/portfolio/PortfolioStats';
import HoldingsList from '@/components/dashboard/portfolio/HoldingsList';
import AddSimulatedTokenModal from '@/components/dashboard/portfolio/AddSimulatedTokenModal';

const dataClient = generateClient<Schema>();

interface PortfolioInfo {
  id: string;
  name: string;
}

export default function Portfolio() {
  const { address } = useWallet();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [portfolios, setPortfolios] = useState<PortfolioInfo[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [addSimTokenOpen, setAddSimTokenOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!address) { setProfileId(null); return; }
    let cancelled = false;
    void (async () => {
      try {
        const { data: profiles } = await dataClient.models.UserProfile.list({
          filter: { walletAddress: { eq: address } },
        });
        if (cancelled) return;
        if (profiles.length > 0) {
          setProfileId(profiles[0].id);
        } else {
          const { data: created } = await dataClient.models.UserProfile.create({
            walletAddress: address,
            credits: 1000,
          });
          if (!cancelled && created) setProfileId(created.id);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [address]);

  const loadPortfolios = useCallback(async () => {
    if (!profileId) { setPortfolios([]); return; }
    try {
      const { data } = await dataClient.models.Portfolio.list({
        filter: { userProfileId: { eq: profileId } },
      });
      setPortfolios((data ?? []).map((p) => ({ id: p.id, name: p.name })));
    } catch { setPortfolios([]); }
  }, [profileId]);

  useEffect(() => { void loadPortfolios(); }, [loadPortfolios, refreshKey]);

  const handleCreatePortfolio = useCallback(async (name: string) => {
    if (!profileId) return;
    try {
      const { data } = await dataClient.models.Portfolio.create({
        userProfileId: profileId,
        name,
      });
      if (data) {
        setSelectedPortfolioId(data.id);
        setRefreshKey((k) => k + 1);
      }
    } catch {}
  }, [profileId]);

  const handleDeletePortfolio = useCallback(async (id: string) => {
    try {
      const { data: tokens } = await dataClient.models.PortfolioToken.list({
        filter: { portfolioId: { eq: id } },
      });
      for (const t of tokens ?? []) {
        await dataClient.models.PortfolioToken.delete({ id: t.id });
      }
      await dataClient.models.Portfolio.delete({ id });
      if (selectedPortfolioId === id) setSelectedPortfolioId(null);
      setRefreshKey((k) => k + 1);
    } catch {}
  }, [selectedPortfolioId]);

  const isSimulated = !!selectedPortfolioId;

  return (
    <div className="flex gap-4 h-[calc(100vh-6.5rem)] min-h-0">
      <PortfolioStats
        profileId={profileId}
        portfolios={portfolios}
        selectedPortfolioId={selectedPortfolioId}
        onSelectPortfolio={setSelectedPortfolioId}
        onCreatePortfolio={handleCreatePortfolio}
        onDeletePortfolio={handleDeletePortfolio}
        refreshKey={refreshKey}
      />
      <div className="flex-1 bg-surface border border-border3/50 rounded-xl p-5 flex flex-col min-h-0 overflow-hidden">
        <HoldingsList
          isSimulated={isSimulated}
          selectedPortfolioId={selectedPortfolioId}
          onAddSimulatedToken={() => setAddSimTokenOpen(true)}
          refreshKey={refreshKey}
        />
      </div>
      <AddSimulatedTokenModal
        open={addSimTokenOpen}
        onClose={() => setAddSimTokenOpen(false)}
        portfolioId={selectedPortfolioId}
        onAdded={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
