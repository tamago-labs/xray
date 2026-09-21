export const dynamic = "force-dynamic";

import PreIpoDetailClient from "@/components/dashboard/pre-ipo/PreIpoDetailClient";

export default function PreIpoDetail({ params }: { params: { slug: string } }) {
  return (
    <div className="h-[calc(100vh-6.5rem)] overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <PreIpoDetailClient slug={params.slug} />
      </div>
    </div>
  );
}
