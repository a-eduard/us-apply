"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronLeft, Building2, Users, Loader2, Target, Percent, CalendarDays, Filter } from "lucide-react";
import EmployerCandidateCard from "@/components/dashboard/EmployerCandidateCard";
import { cn } from "@/lib/utils";

// Нормализация статусов для правильной фильтрации
const normalizeStatus = (status: string) => {
  if (!status || status === "Applied") return "New";
  if (status === "Screening" || status === "Interview") return "Reviewing";
  if (["Offer", "Employee", "Hired", "Shortlisted"].includes(status)) return "Onboarding";
  if (["New", "Reviewing", "Onboarding", "Declined"].includes(status)) return status;
  return "New";
};

export default function CampaignDetailClient({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login");
    },
  });

  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Стейт для фильтрации кандидатов
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const fetchCampaignData = useCallback(async () => {
    if (status !== "authenticated") return;

    try {
      const res = await fetch(`/api/employer/campaigns/${campaignId}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      });
      
      const contentType = res.headers.get("content-type");
      let data = null;
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      }

      if (!res.ok) {
        console.error("API Error Response:", data);
        setErrorMessage(data?.error || data?.details || `HTTP Error ${res.status}`);
        setLoading(false);
        return;
      }

      setCampaign(data);
      setErrorMessage(null);
    } catch (error: any) {
      console.error("Network or parsing error:", error);
      setErrorMessage(error.message || "Failed to fetch data");
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
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-4 px-4">
         <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100 text-center max-w-lg shadow-sm w-full">
            <h2 className="text-2xl font-extrabold text-red-600 mb-2">Error Loading Data</h2>
            <p className="text-slate-700 font-medium mb-4">The server returned an error:</p>
            <code className="bg-white px-4 py-3 rounded-xl text-red-500 font-bold border border-red-100 block mb-6 text-sm break-words">
              {errorMessage}
            </code>
            <button
              onClick={() => router.push("/dashboard/employer")}
              className="bg-red-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-red-700 transition-colors w-full"
            >
              Return to Dashboard
            </button>
         </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-4">
        <h2 className="text-2xl font-extrabold text-slate-800">Campaign not found</h2>
        <button
          onClick={() => router.push("/dashboard/employer")}
          className="text-blue-600 font-bold hover:underline"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const applications = campaign.applications || [];
  
  // Подсчет статистики для вкладок
  const stats = {
    All: applications.length,
    New: applications.filter((a: any) => normalizeStatus(a.status) === "New").length,
    Reviewing: applications.filter((a: any) => normalizeStatus(a.status) === "Reviewing").length,
    Onboarding: applications.filter((a: any) => normalizeStatus(a.status) === "Onboarding").length,
    Declined: applications.filter((a: any) => normalizeStatus(a.status) === "Declined").length,
  };

  const filteredApplications = applications.filter((app: any) => 
    activeFilter === "All" || normalizeStatus(app.status) === activeFilter
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      
      {/* Top Navigation */}
      <nav className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center sticky top-0 z-50 shadow-sm justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/employer")}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Campaigns
          </button>
        </div>
        <div className="flex items-center justify-center px-3 py-1 bg-slate-100 border border-slate-200 rounded-md">
          <span className="text-xs font-black uppercase text-slate-700 tracking-widest">
            EMPLOYER
          </span>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-[1200px] mx-auto p-4 sm:p-8">
        
        {/* Premium Dark Campaign Header */}
        <div className="bg-slate-900 rounded-[2rem] p-8 sm:p-10 shadow-xl mb-10 relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-rose-600/10 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-start gap-6">
              {campaign.logoUrl || campaign.logo_url ? (
                <img src={campaign.logoUrl || campaign.logo_url} alt="Logo" className="hidden sm:block w-20 h-20 rounded-2xl object-cover shrink-0 border border-white/10 shadow-lg bg-white" />
              ) : (
                <div className="hidden sm:flex w-20 h-20 bg-white/10 text-white/50 rounded-2xl items-center justify-center shrink-0 border border-white/10 shadow-lg">
                  <Building2 className="w-10 h-10" />
                </div>
              )}
              
              <div>
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">
                  <Building2 className="w-4 h-4" />
                  {campaign.companyName || campaign.company_name || "Your Company"}
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white mb-5 leading-tight">
                  {campaign.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-slate-300">
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-md">
                    <Target className="w-4 h-4 text-rose-400" />
                    OTE: {campaign.ote || "N/A"}
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-md">
                    <Percent className="w-4 h-4 text-blue-400" />
                    Commission: {campaign.commission || "N/A"}
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-md">
                    <CalendarDays className="w-4 h-4 text-emerald-400" />
                    {new Date(campaign.created_at || campaign.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-sm min-w-[160px]">
              <div className="flex justify-center mb-2">
                <Users className="w-6 h-6 text-slate-300" />
              </div>
              <div className="text-4xl font-black text-white mb-1">{applications.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Candidates</div>
            </div>
          </div>
        </div>

        {/* Pipeline Section */}
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              Candidates Pipeline
            </h2>
            
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              <Filter className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              {["All", "New", "Reviewing", "Onboarding", "Declined"].map((filterName) => (
                <button
                  key={filterName}
                  onClick={() => setActiveFilter(filterName)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border",
                    activeFilter === filterName
                      ? "bg-slate-900 text-white border-slate-900 shadow-md"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  )}
                >
                  {filterName}
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs",
                    activeFilter === filterName ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  )}>
                    {stats[filterName as keyof typeof stats]}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {filteredApplications.length === 0 ? (
            <div className="bg-white rounded-[2rem] border border-slate-200 p-16 text-center shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">No candidates found</h3>
              <p className="text-slate-500 font-medium">
                {activeFilter === "All" 
                  ? "Candidates who apply to this campaign will appear here for your review."
                  : `There are currently no candidates in the "${activeFilter}" stage.`}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredApplications.map((app: any) => (
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