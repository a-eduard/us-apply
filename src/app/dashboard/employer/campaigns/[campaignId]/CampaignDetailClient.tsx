"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronLeft, Building2, Users, Loader2, Target, Percent, CalendarDays, Filter } from "lucide-react";
import EmployerCandidateCard from "@/components/dashboard/EmployerCandidateCard";
import { cn } from "@/lib/utils";

// Normalizing statuses for proper filtering
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
  
  // State for filtering candidates
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-blue-600 dark:text-blue-500" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-4 px-4 transition-colors duration-300">
         <div className="bg-rose-50 dark:bg-rose-500/10 p-6 sm:p-8 rounded-[2rem] border border-rose-100 dark:border-rose-500/20 text-center max-w-lg shadow-sm w-full transition-colors">
            <h2 className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 mb-2">Error Loading Data</h2>
            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 font-medium mb-4">The server returned an error:</p>
            <code className="bg-white dark:bg-slate-900 px-4 py-3 rounded-xl text-rose-500 dark:text-rose-400 font-bold border border-rose-100 dark:border-rose-900/50 block mb-6 text-xs sm:text-sm break-words transition-colors">
              {errorMessage}
            </code>
            <button
              onClick={() => router.push("/dashboard/employer")}
              className="bg-rose-600 dark:bg-rose-500 text-white font-bold px-6 py-3.5 rounded-xl hover:bg-rose-700 dark:hover:bg-rose-600 transition-colors w-full shadow-lg shadow-rose-600/20 dark:shadow-rose-900/20 active:scale-[0.98] outline-none focus-visible:ring-4 focus-visible:ring-rose-500/40"
            >
              Return to Dashboard
            </button>
         </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-4 transition-colors duration-300">
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Campaign not found</h2>
        <button
          onClick={() => router.push("/dashboard/employer")}
          className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const applications = campaign.applications || [];
  
  // Calculate statistics for tabs
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-20">
      
      {/* Top Navigation */}
      <nav className="h-16 sm:h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 flex items-center sticky top-0 z-50 shadow-sm transition-colors duration-300">
        <div className="max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => router.push("/dashboard/employer")}
              className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6 lg:mt-8">
        
        {/* Premium Adaptable Campaign Header */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[2rem] p-5 sm:p-8 lg:p-10 shadow-sm border border-slate-200/60 dark:border-slate-800 mb-6 sm:mb-10 relative overflow-hidden transition-colors duration-300">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-8">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              {campaign.logoUrl || campaign.logo_url ? (
                <img src={campaign.logoUrl || campaign.logo_url} alt="Logo" className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shrink-0 border border-slate-100 dark:border-slate-800 shadow-sm bg-white transition-colors" />
              ) : (
                <div className="flex w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 rounded-2xl items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                  <Building2 className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
              )}
              
              <div className="w-full">
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 sm:mb-2 transition-colors">
                  <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate max-w-[200px] sm:max-w-none">{campaign.companyName || campaign.company_name || "Your Company"}</span>
                </div>
                <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-3 sm:mb-5 leading-tight transition-colors">
                  {campaign.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs lg:text-sm font-bold text-slate-600 dark:text-slate-300 transition-colors">
                  <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950/50 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
                    <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                    <span className="truncate max-w-[120px] sm:max-w-none">OTE: {campaign.ote || "N/A"}</span>
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950/50 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
                    <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 dark:text-blue-400 shrink-0" />
                    <span className="truncate max-w-[120px] sm:max-w-none">Comm: {campaign.commission || "N/A"}</span>
                  </span>
                  <span className="hidden sm:flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950/50 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
                    <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    {new Date(campaign.created_at || campaign.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 lg:p-6 text-center w-full lg:min-w-[160px] lg:w-auto transition-colors">
              <div className="flex justify-center mb-1 sm:mb-2">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 dark:text-slate-500" />
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-blue-600 dark:text-blue-500 mb-0.5 sm:mb-1 transition-colors">{applications.length}</div>
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 transition-colors">Total Candidates</div>
            </div>
          </div>
        </div>

        {/* Pipeline Section */}
        <div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 mb-5 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5 sm:gap-3 transition-colors">
              Candidates Pipeline
            </h2>
            
            {/* Filter Tabs - Swipeable on mobile */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden flex-nowrap" style={{ WebkitOverflowScrolling: 'touch' }}>
              <Filter className="hidden sm:block w-4 h-4 text-slate-400 dark:text-slate-500 mr-2 shrink-0 transition-colors" />
              {["All", "New", "Reviewing", "Onboarding", "Declined"].map((filterName) => (
                <button
                  key={filterName}
                  onClick={() => setActiveFilter(filterName)}
                  className={cn(
                    "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap border shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98]",
                    activeFilter === filterName
                      ? "bg-slate-900 dark:bg-blue-600 text-white border-transparent shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  {filterName}
                  <span className={cn(
                    "px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black transition-colors",
                    activeFilter === filterName ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  )}>
                    {stats[filterName as keyof typeof stats]}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {filteredApplications.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 p-8 sm:p-12 lg:p-16 text-center shadow-sm transition-colors duration-300">
              <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-slate-50 dark:bg-slate-950/50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 transition-colors">
                <Users className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white mb-2 transition-colors">No candidates found</h3>
              <p className="text-xs sm:text-sm lg:text-base text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto transition-colors">
                {activeFilter === "All" 
                  ? "Candidates who apply to this campaign will appear here for your review."
                  : `There are currently no candidates in the "${activeFilter}" stage.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5">
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