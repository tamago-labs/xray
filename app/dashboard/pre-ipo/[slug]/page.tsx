export const dynamic = 'force-dynamic';

import PreIpoDetailClient from '@/components/pre-ipo/PreIpoDetailClient';
import { getAssetBySlug, type PreIpoAsset } from '@/lib/pre-ipo/contracts';
import Link from 'next/link';

export default async function PreIpoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const asset = getAssetBySlug(slug);

  if (!asset) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/40 text-lg">Asset not found</p>
          <Link href="/dashboard/pre-ipo" className="text-accent text-sm mt-2 inline-block hover:underline">
            Back to Markets
          </Link>
        </div>
      </div>
    );
  }

  return <PreIpoDetailClient asset={asset} />;
}
