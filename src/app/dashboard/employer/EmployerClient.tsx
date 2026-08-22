"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Plus, Briefcase, ChevronRight, LogOut, Loader2, Edit2, Trash2, CalendarDays, Users, MapPin, Mail, Phone, Globe, FileText, PlayCircle, Sun, Moon, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EmployerClient() {
  const router = useRouter();
  
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login");
    },
  });

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [activeTab, setActiveTab] = useState<"campaigns" | "talent-pool">("campaigns");

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [campaignToDelete, setCampaignToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [candidateToDelete, setCandidateToDelete] = useState<number | null>(null);
  const [isDeletingCandidate, setIsDeletingCandidate] = useState(false);

  // Modal States for Talent Pool
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [currentMediaUrl, setCurrentMediaUrl] = useState("");
  const [currentCandidateName, setCurrentCandidateName] = useState("");

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/employer/campaigns").then(res => res.json()),
      fetch("/api/employer/candidates").then(res => res.json())
    ])
    .then(([campaignsData, candidatesData]) => {
      setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
      setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
      setLoading(false);
    })
    .catch((err) => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    setMounted(true);
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  const executeDelete = async () => {
    if (!campaignToDelete) return;
    setIsDeleting(true);
    
    try {
      const res = await fetch(`/api/employer/campaigns/${campaignToDelete}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
      } else {
        alert("Failed to delete campaign.");
      }
    } catch (err) {
      alert("An error occurred while deleting.");
    } finally {
      setIsDeleting(false);
      setCampaignToDelete(null);
    }
  };

  const executeDeleteCandidate = async () => {
    if (!candidateToDelete) return;
    setIsDeletingCandidate(true);
    
    try {
      const res = await fetch(`/api/employer/candidates/${candidateToDelete}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to delete candidate.");
      }
    } catch (err) {
      alert("An error occurred while deleting the candidate.");
    } finally {
      setIsDeletingCandidate(false);
      setCandidateToDelete(null);
    }
  };

  const openVideoModal = (url: string, name: string) => {
    setCurrentMediaUrl(url);
    setCurrentCandidateName(name);
    setShowVideoModal(true);
  };

  const openResumeModal = (url: string, name: string) => {
    setCurrentMediaUrl(url);
    setCurrentCandidateName(name);
    setShowResumeModal(true);
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-blue-600 dark:text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 relative transition-colors duration-300 pb-28">
      <style>{`header { display: none !important; }`}</style>
      
      <nav className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-0.5" onClick={() => router.push('/')}>
            <img src="/usc_logo.png" alt="USclosers Logo" className="h-6 sm:h-7 md:h-8 group-hover:opacity-80 transition-opacity shrink-0 mr-2 sm:mr-3" />
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight group-hover:opacity-80 transition-colors hidden sm:block">
              USclosers
            </span>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 sm:p-2.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm active:scale-95"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 mt-2 sm:mt-4">
        
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white mb-1.5 sm:mb-2 transition-colors">Employer Dashboard</h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium transition-colors">Manage your job postings and explore top talent.</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/employer/campaigns/new')}
            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-3.5 sm:py-4 bg-blue-600 dark:bg-blue-500 text-white font-bold text-sm sm:text-base rounded-xl shadow-lg shadow-blue-600/20 dark:shadow-blue-900/20 hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40 transition-all whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Create New Campaign
          </button>
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl w-full sm:w-fit shadow-sm transition-colors overflow-x-auto flex-nowrap [&::-webkit-scrollbar]:hidden mb-6 sm:mb-8">
          <button
            onClick={() => setActiveTab("campaigns")}
            className={cn(
              "px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              activeTab === "campaigns" 
                ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:scale-[0.98]"
            )}
          >
            <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> My Campaigns
          </button>
          <button
            onClick={() => setActiveTab("talent-pool")}
            className={cn(
              "px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              activeTab === "talent-pool" 
                ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:scale-[0.98]"
            )}
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Talent Pool
          </button>
        </div>

        {activeTab === "campaigns" && (
          <>
            {campaigns.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 border-dashed p-6 sm:p-12 md:p-20 text-center shadow-sm max-w-2xl mx-auto mt-6 sm:mt-10 transition-colors">
                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-slate-50 dark:bg-slate-950/50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 transition-colors">
                  <Briefcase className="w-7 h-7 sm:w-10 sm:h-10 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-2 sm:mb-3 transition-colors">No campaigns yet</h3>
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium mb-6 sm:mb-8 transition-colors">Create your first job posting to start receiving applications from top closers.</p>
                <button
                  onClick={() => router.push('/dashboard/employer/campaigns/new')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-slate-900 dark:bg-blue-600 text-white font-bold rounded-xl shadow-lg dark:shadow-blue-900/20 hover:bg-slate-800 dark:hover:bg-blue-700 active:scale-[0.98] outline-none focus-visible:ring-4 focus-visible:ring-slate-500/20 dark:focus-visible:ring-blue-500/40 transition-all text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  Create Campaign
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                {campaigns.map((campaign) => {
                  const apps = campaign.applications || [];
                  
                  const countNew = apps.filter((a: any) => !a.status || a.status === 'Applied' || a.status === 'New').length;
                  const countReviewing = apps.filter((a: any) => ['Screening', 'Interview', 'Reviewing', 'Needs Revision'].includes(a.status)).length;
                  const countOnboarding = apps.filter((a: any) => ['Offer', 'Employee', 'Hired', 'Shortlisted', 'Onboarding'].includes(a.status)).length;
                  const countDeclined = apps.filter((a: any) => a.status === 'Declined').length;

                  return (
                    <div key={campaign.id} className="bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200/60 dark:border-slate-800 p-4 sm:p-5 lg:p-6 flex flex-col relative overflow-hidden group hover:shadow-xl dark:hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 active:scale-[0.99] sm:active:scale-100">
                      <div className="absolute top-0 left-0 right-0 h-1 sm:h-1.5 bg-gradient-to-r from-rose-500 to-blue-500 opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300"></div>

                      <div className="flex justify-between items-start mb-4 sm:mb-5 lg:mb-6">
                        {campaign.logoUrl || campaign.logo_url ? (
                          <img src={campaign.logoUrl || campaign.logo_url} alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl object-cover shrink-0 border border-slate-100 dark:border-slate-800 bg-white shadow-sm transition-colors" />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-slate-50 dark:bg-slate-950/50 text-slate-400 dark:text-slate-500 rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950/50 p-1 rounded-xl border border-slate-100 dark:border-slate-800 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300">
                          <button 
                            onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/employer/campaigns/${campaign.id}/edit`); }}
                            className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors active:scale-95"
                            title="Edit Campaign"
                          >
                            <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setCampaignToDelete(campaign.id); }}
                            className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors active:scale-95"
                            title="Delete Campaign"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mb-4 sm:mb-5 lg:mb-6 flex-1">
                        <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 sm:mb-1.5 line-clamp-1 transition-colors">
                          {campaign.companyName || campaign.company_name || "Your Company"}
                        </div>
                        <h2 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 dark:text-white mb-2 sm:mb-3 leading-tight line-clamp-2 transition-colors">
                          {campaign.title}
                        </h2>
                        
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] lg:text-xs font-medium text-slate-500 dark:text-slate-400 transition-colors">
                          <CalendarDays className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {new Date(campaign.created_at || campaign.createdAt || Date.now()).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 lg:p-4 mb-4 sm:mb-5 lg:mb-6 border border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-1 sm:gap-2 transition-colors">
                        <div className="text-center flex flex-col items-center justify-center">
                          <div className="text-sm sm:text-base lg:text-lg font-black text-blue-600 dark:text-blue-500 leading-none mb-1">{countNew}</div>
                          <div className="text-[8px] sm:text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">New</div>
                        </div>
                        <div className="text-center flex flex-col items-center justify-center border-l border-slate-200 dark:border-slate-800 transition-colors">
                          <div className="text-sm sm:text-base lg:text-lg font-black text-amber-500 dark:text-amber-500 leading-none mb-1">{countReviewing}</div>
                          <div className="text-[8px] sm:text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Rev</div>
                        </div>
                        <div className="text-center flex flex-col items-center justify-center border-l border-slate-200 dark:border-slate-800 transition-colors">
                          <div className="text-sm sm:text-base lg:text-lg font-black text-emerald-500 dark:text-emerald-500 leading-none mb-1">{countOnboarding}</div>
                          <div className="text-[8px] sm:text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Onb</div>
                        </div>
                        <div className="text-center flex flex-col items-center justify-center border-l border-slate-200 dark:border-slate-800 transition-colors">
                          <div className="text-sm sm:text-base lg:text-lg font-black text-rose-500 dark:text-rose-500 leading-none mb-1">{countDeclined}</div>
                          <div className="text-[8px] sm:text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Dec</div>
                        </div>
                      </div>

                      <button 
                        onClick={() => router.push(`/dashboard/employer/campaigns/${campaign.id}`)}
                        className="w-full bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-bold py-3 sm:py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 group/btn shadow-sm text-xs sm:text-sm lg:text-base outline-none focus-visible:ring-4 focus-visible:ring-slate-500/20 dark:focus-visible:ring-blue-500/40 active:scale-[0.98]"
                      >
                        View Pipeline 
                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Talent Pool Tab Content */}
        {activeTab === "talent-pool" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {candidates.length === 0 ? (
              <div className="col-span-full py-16 sm:py-20 text-center">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3 sm:mb-4 transition-colors" />
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1.5 sm:mb-2 transition-colors">No candidates found</h3>
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 transition-colors">There are currently no registered candidates in the system.</p>
              </div>
            ) : (
              candidates.map(candidate => {
                const fullName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 'Anonymous';
                const initials = fullName.substring(0, 2).toUpperCase();
                const location = [candidate.city, candidate.state].filter(Boolean).join(', ');
                
                let niches = [];
                try {
                  niches = typeof candidate.niches === 'string' ? JSON.parse(candidate.niches) : (candidate.niches || []);
                } catch(e) {}

                return (
                  <div key={candidate.id} className="bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200/60 dark:border-slate-800 p-4 sm:p-6 flex flex-col shadow-sm hover:shadow-md dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-all relative">
                    
                    <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        {candidate.avatar_url ? (
                          <img src={candidate.avatar_url} alt="Avatar" className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border border-slate-100 dark:border-slate-800 bg-white shrink-0 transition-colors" />
                        ) : (
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-base sm:text-lg border border-slate-200 dark:border-slate-700 shrink-0 transition-colors">
                            {initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate transition-colors" title={fullName}>{fullName}</h3>
                          {location && (
                            <div className="flex items-center gap-1 text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 truncate transition-colors">
                              <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{location}</span>
                            </div>
                          )}
                          {candidate.created_at && (
                            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1 sm:mt-1.5 truncate transition-colors">
                              <CalendarDays className="w-3 h-3 shrink-0" /> {new Date(candidate.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setCandidateToDelete(candidate.id)}
                        className="p-1.5 sm:p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors shrink-0 active:scale-95"
                        title="Delete Candidate"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>

                    <div className="space-y-2 sm:space-y-2.5 mb-5 sm:mb-6">
                      <div className="flex items-center gap-2 text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors">
                        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500 shrink-0" /> <span className="truncate">{candidate.email}</span>
                      </div>
                      {candidate.phone && (
                        <div className="flex items-center gap-2 text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors">
                          <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500 shrink-0" /> {candidate.phone}
                        </div>
                      )}
                    </div>

                    <div className="mb-5 sm:mb-6 flex-1">
                      <div className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 sm:mb-2 transition-colors">Experience & Niches</div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2 sm:mb-2.5 transition-colors">{candidate.years_of_experience || 'Not specified'}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {niches.length > 0 ? niches.map((niche: string) => (
                          <span key={niche} className="px-2 sm:px-2.5 py-1 bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800 rounded-md text-[9px] sm:text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-colors">
                            {niche}
                          </span>
                        )) : <span className="text-[10px] sm:text-xs font-medium text-slate-400 dark:text-slate-500">No niches selected</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 sm:pt-5 transition-colors">
                      {candidate.linkedin_url ? (
                        <a href={candidate.linkedin_url} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors active:scale-95">
                          <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="text-[9px] sm:text-[10px] font-bold">LinkedIn</span>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-xl opacity-40 cursor-not-allowed text-slate-500 dark:text-slate-400">
                          <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="text-[9px] sm:text-[10px] font-bold">LinkedIn</span>
                        </div>
                      )}

                      {candidate.resume_url ? (
                        <button 
                          onClick={() => openResumeModal(candidate.resume_url, fullName)}
                          className="flex flex-col items-center justify-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="text-[9px] sm:text-[10px] font-bold">Resume</span>
                        </button>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-xl opacity-40 cursor-not-allowed text-slate-500 dark:text-slate-400">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="text-[9px] sm:text-[10px] font-bold">Resume</span>
                        </div>
                      )}

                      {candidate.video_pitch_url ? (
                        <button 
                          onClick={() => openVideoModal(candidate.video_pitch_url, fullName)}
                          className="flex flex-col items-center justify-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-500/10 text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                        >
                          <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="text-[9px] sm:text-[10px] font-bold">Video</span>
                        </button>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-xl opacity-40 cursor-not-allowed text-slate-500 dark:text-slate-400">
                          <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="text-[9px] sm:text-[10px] font-bold">Video</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      <button 
        onClick={() => signOut({ callbackUrl: '/' })} 
        className="fixed bottom-6 right-4 sm:right-6 lg:bottom-10 lg:right-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-xl text-rose-500 dark:text-rose-400 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full flex items-center gap-2 sm:gap-2.5 font-bold text-xs sm:text-sm hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:shadow-2xl transition-all z-50 group outline-none focus-visible:ring-4 focus-visible:ring-rose-500/40 active:scale-95"
      >
        <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-0.5 transition-transform" /> 
        <span className="hidden sm:inline">Log Out</span>
        <span className="sm:hidden">Exit</span>
      </button>

      {/* Campaign Delete Modal */}
      {campaignToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm p-4 transition-colors duration-300">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl sm:rounded-[2rem] p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200/60 dark:border-slate-800/60 animate-in fade-in zoom-in duration-200 transition-colors">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-4 sm:mb-6 mx-auto transition-colors shadow-inner ring-4 ring-white dark:ring-slate-900">
              <Trash2 className="w-6 h-6 sm:w-8 sm:h-8 text-rose-500 dark:text-rose-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2 sm:mb-3 text-center transition-colors">Delete Campaign?</h3>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mb-6 sm:mb-8 font-medium leading-relaxed text-center transition-colors">
              Are you sure you want to delete this campaign? All candidate applications will be removed. This cannot be undone.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
              <button 
                onClick={() => setCampaignToDelete(null)}
                disabled={isDeleting}
                className="w-full sm:flex-1 py-3 sm:py-3.5 font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50 active:scale-[0.98] outline-none focus-visible:ring-4 focus-visible:ring-slate-500/20"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                disabled={isDeleting}
                className="w-full sm:flex-1 py-3 sm:py-3.5 font-bold text-white bg-rose-600 dark:bg-rose-500 hover:bg-rose-700 dark:hover:bg-rose-600 rounded-xl transition-colors shadow-lg shadow-rose-600/20 dark:shadow-rose-900/20 flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98] outline-none focus-visible:ring-4 focus-visible:ring-rose-500/40"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Delete Modal */}
      {candidateToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm p-4 transition-colors duration-300">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl sm:rounded-[2rem] p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200/60 dark:border-slate-800/60 animate-in fade-in zoom-in duration-200 transition-colors">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-4 sm:mb-6 mx-auto transition-colors shadow-inner ring-4 ring-white dark:ring-slate-900">
              <Trash2 className="w-6 h-6 sm:w-8 sm:h-8 text-rose-500 dark:text-rose-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2 sm:mb-3 text-center transition-colors">Delete Candidate?</h3>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mb-6 sm:mb-8 font-medium leading-relaxed text-center transition-colors">
              Are you sure you want to delete this candidate account? This will permanently remove their data from the database.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
              <button 
                onClick={() => setCandidateToDelete(null)}
                disabled={isDeletingCandidate}
                className="w-full sm:flex-1 py-3 sm:py-3.5 font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50 active:scale-[0.98] outline-none focus-visible:ring-4 focus-visible:ring-slate-500/20"
              >
                Cancel
              </button>
              <button 
                onClick={executeDeleteCandidate}
                disabled={isDeletingCandidate}
                className="w-full sm:flex-1 py-3 sm:py-3.5 font-bold text-white bg-rose-600 dark:bg-rose-500 hover:bg-rose-700 dark:hover:bg-rose-600 rounded-xl transition-colors shadow-lg shadow-rose-600/20 dark:shadow-rose-900/20 flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98] outline-none focus-visible:ring-4 focus-visible:ring-rose-500/40"
              >
                {isDeletingCandidate ? <Loader2 className="w-5 h-5 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- VIDEO PITCH VIEW MODAL --- */}
      <AnimatePresence>
        {showVideoModal && currentMediaUrl && (
          <div 
            className="fixed inset-0 z-[9999] bg-slate-900/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 transition-colors duration-300"
            onClick={() => setShowVideoModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col border border-slate-200/60 dark:border-slate-800/60 transition-colors"
              onClick={(e) => e.stopPropagation()} 
            >
              <div className="p-4 sm:p-5 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center transition-colors">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2 transition-colors truncate pr-4">
                  <PlayCircle className="w-5 h-5 text-purple-500 dark:text-purple-400 shrink-0" /> Video Pitch: {currentCandidateName}
                </h3>
                <button 
                  onClick={() => setShowVideoModal(false)} 
                  className="p-1.5 sm:p-2 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full transition-colors active:scale-95 shrink-0"
                >
                  <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
              <div className="bg-black w-full aspect-video flex items-center justify-center relative">
                <video
                  src={currentMediaUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- RESUME VIEW MODAL --- */}
      <AnimatePresence>
        {showResumeModal && currentMediaUrl && (
          <div 
            className="fixed inset-0 z-[9999] bg-slate-900/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 transition-colors"
            onClick={() => setShowResumeModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200/60 dark:border-slate-800/60 transition-colors"
              onClick={(e) => e.stopPropagation()} 
            >
              <div className="p-4 sm:p-5 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center transition-colors shrink-0">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2 transition-colors truncate pr-4">
                  <FileText className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" /> Resume: {currentCandidateName}
                </h3>
                <button 
                  onClick={() => setShowResumeModal(false)} 
                  className="p-1.5 sm:p-2 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full transition-colors active:scale-95 shrink-0"
                >
                  <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
              <div className="flex-1 w-full bg-slate-100 dark:bg-slate-950/50 relative">
                <iframe
                  src={currentMediaUrl}
                  className="w-full h-full border-0"
                  title="Resume Viewer"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}