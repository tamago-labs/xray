import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TokenDetailPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <p className="text-white/40 text-lg">Token detail page is temporarily unavailable</p>
        <Link href="/dashboard/explore" className="text-accent text-sm mt-2 inline-block hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1" /> Back to Explore
        </Link>
      </div>
    </div>
  );
}
