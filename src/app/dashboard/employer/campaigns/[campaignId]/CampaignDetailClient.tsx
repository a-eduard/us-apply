"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronLeft, Building2, Users, Loader2 } from "lucide-react";
import EmployerCandidateCard from "@/components/dashboard/EmployerCandidateCard";

export default function CampaignDetailClient({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  
  // Protect the route with NextAuth
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login");
    },
  });

  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCampaignData = useCallback(async () => {
    if (status !== "authenticated") return;

    try {
      // NextAuth automatically includes the session cookie, no Authorization header needed
      const res = await fetch(`/api/employer/campaigns/${campaignId}`);

      if (!res.ok) {
        throw new Error("Failed to fetch campaign data");
      }

      const data = await res.json();
      setCampaign(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [campaignId, status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCampaignData();
    }
  }, [fetchCampaignData, status]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Campaign not found</h2>
        <button
          onClick={() => router.push("/dashboard/employer")}
          className="text-blue-600 hover:underline"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const applications = campaign.applications || [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Navbar (Simplified for sub-pages) */}
      <nav className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center sticky top-0 z-10">
        <button
          onClick={() => router.push("/dashboard/employer")}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Campaigns
        </button>
      </nav>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-8">
        {/* Campaign Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            <Building2 className="w-4 h-4" />
            {campaign.companyName || "Your Company"}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {campaign.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {applications.length} Total Candidates
            </span>
            <span>•</span>
            <span>Created {new Date(campaign.created_at || campaign.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Applications List */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Candidates</h2>
          
          {applications.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
              <Users className="w-8 h-8 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">No applications yet</h3>
              <p className="text-slate-500 text-sm">
                Candidates who apply to this campaign will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app: any) => (
                <EmployerCandidateCard
                  key={app.id}
                  candidate={app}
                  fetchCandidates={fetchCampaignData}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}