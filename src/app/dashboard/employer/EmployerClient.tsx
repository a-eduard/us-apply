"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Building2, Plus, Briefcase, ChevronRight, LogOut, Loader2, Edit2, Trash2, CalendarDays, Users, MapPin, Mail, Phone, Globe, FileText, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EmployerClient() {
  const router = useRouter();
  
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login");
    },
  });

  const [activeTab, setActiveTab] = useState<"campaigns" | "talent-pool">("campaigns");

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Состояния для удаления кампании
  const [campaignToDelete, setCampaignToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Состояния для удаления кандидата
  const [candidateToDelete, setCandidateToDelete] = useState<number | null>(null);
  const [isDeletingCandidate, setIsDeletingCandidate] = useState(false);

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

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 relative">
      <nav className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => router.push('/')}>
          <img src="/usc_logo.png" alt="USclosers Logo" className="h-7 sm:h-8 group-hover:opacity-80 transition-opacity shrink-0" />
          <span className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight group-hover:opacity-80 transition-opacity hidden sm:block">
            USclosers
          </span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden sm:flex items-center justify-center px-3 py-1 bg-slate-100 border border-slate-200 rounded-md">
            <span className="text-xs font-black uppercase text-slate-700 tracking-widest">
              EMPLOYER
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors p-2 sm:p-0"
          >
            <LogOut className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 sm:p-8 mt-2 sm:mt-4">
        {/* Header & Create Button */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1 sm:mb-2">Employer Dashboard</h1>
            <p className="text-sm sm:text-base text-slate-500 font-medium">Manage your job postings and explore top talent.</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/employer/campaigns/new')}
            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Create New Campaign
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-slate-200 mb-8 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab("campaigns")}
            className={cn(
              "pb-4 text-sm sm:text-base font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2",
              activeTab === "campaigns" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <Briefcase className="w-5 h-5" /> My Campaigns
          </button>
          <button
            onClick={() => setActiveTab("talent-pool")}
            className={cn(
              "pb-4 text-sm sm:text-base font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2",
              activeTab === "talent-pool" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <Users className="w-5 h-5" /> Talent Pool
          </button>
        </div>

        {/* Campaigns Tab Content */}
        {activeTab === "campaigns" && (
          <>
            {campaigns.length === 0 ? (
              <div className="bg-white rounded-[2rem] border border-slate-200 border-dashed p-8 sm:p-12 md:p-20 text-center shadow-sm max-w-2xl mx-auto mt-6 sm:mt-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Briefcase className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" />
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2 sm:mb-3">No campaigns yet</h3>
                <p className="text-sm sm:text-lg text-slate-500 font-medium mb-6 sm:mb-8">Create your first job posting to start receiving applications from top closers.</p>
                <button
                  onClick={() => router.push('/dashboard/employer/campaigns/new')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 active:scale-[0.98] transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Create Campaign
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {campaigns.map((campaign) => {
                  const apps = campaign.applications || [];
                  
                  const countNew = apps.filter((a: any) => !a.status || a.status === 'Applied' || a.status === 'New').length;
                  const countReviewing = apps.filter((a: any) => ['Screening', 'Interview', 'Reviewing', 'Needs Revision'].includes(a.status)).length;
                  const countOnboarding = apps.filter((a: any) => ['Offer', 'Employee', 'Hired', 'Shortlisted', 'Onboarding'].includes(a.status)).length;
                  const countDeclined = apps.filter((a: any) => a.status === 'Declined').length;

                  return (
                    <div key={campaign.id} className="bg-white rounded-3xl sm:rounded-[2rem] border border-slate-200 p-5 sm:p-6 flex flex-col relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300 transition-all duration-300">
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 to-blue-500 opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300"></div>

                      <div className="flex justify-between items-start mb-5 sm:mb-6">
                        {campaign.logoUrl || campaign.logo_url ? (
                          <img src={campaign.logoUrl || campaign.logo_url} alt="Logo" className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover shrink-0 border border-slate-100 shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 shadow-sm">
                            <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                          <button 
                            onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/employer/campaigns/${campaign.id}/edit`); }}
                            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-white rounded-lg transition-colors"
                            title="Edit Campaign"
                          >
                            <Edit2 className="w-4 h-4 sm:w-4 sm:h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setCampaignToDelete(campaign.id); }}
                            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                            title="Delete Campaign"
                          >
                            <Trash2 className="w-4 h-4 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mb-5 sm:mb-6 flex-1">
                        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2 line-clamp-1">
                          {campaign.companyName || campaign.company_name || "Your Company"}
                        </div>
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 mb-2 sm:mb-3 leading-tight line-clamp-2">
                          {campaign.title}
                        </h2>
                        
                        <div className="flex items-center gap-2 text-[11px] sm:text-xs font-medium text-slate-500">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {new Date(campaign.created_at || campaign.createdAt || Date.now()).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-3 sm:p-4 mb-5 sm:mb-6 border border-slate-100 grid grid-cols-4 gap-1 sm:gap-2">
                        <div className="text-center flex flex-col items-center justify-center">
                          <div className="text-base sm:text-lg font-black text-blue-600 leading-none mb-1">{countNew}</div>
                          <div className="text-[8px] sm:text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">New</div>
                        </div>
                        <div className="text-center flex flex-col items-center justify-center border-l border-slate-200">
                          <div className="text-base sm:text-lg font-black text-amber-500 leading-none mb-1">{countReviewing}</div>
                          <div className="text-[8px] sm:text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Rev</div>
                        </div>
                        <div className="text-center flex flex-col items-center justify-center border-l border-slate-200">
                          <div className="text-base sm:text-lg font-black text-emerald-500 leading-none mb-1">{countOnboarding}</div>
                          <div className="text-[8px] sm:text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Onb</div>
                        </div>
                        <div className="text-center flex flex-col items-center justify-center border-l border-slate-200">
                          <div className="text-base sm:text-lg font-black text-rose-500 leading-none mb-1">{countDeclined}</div>
                          <div className="text-[8px] sm:text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Dec</div>
                        </div>
                      </div>

                      <button 
                        onClick={() => router.push(`/dashboard/employer/campaigns/${campaign.id}`)}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 sm:py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 group/btn"
                      >
                        View Pipeline 
                        <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {candidates.length === 0 ? (
              <div className="col-span-full py-20 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">No candidates found</h3>
                <p className="text-slate-500">There are currently no registered candidates in the system.</p>
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
                  <div key={candidate.id} className="bg-white rounded-[2rem] border border-slate-200 p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow relative">
                    
                    {/* Header с кнопкой удаления */}
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {candidate.avatar_url ? (
                          <img src={candidate.avatar_url} alt="Avatar" className="w-14 h-14 rounded-full object-cover border border-slate-100 shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg border border-slate-200 shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-extrabold text-slate-900 truncate" title={fullName}>{fullName}</h3>
                          {location && (
                            <div className="flex items-center gap-1 text-xs font-medium text-slate-500 mt-1 truncate">
                              <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{location}</span>
                            </div>
                          )}
                          {/* ДОБАВЛЕНА ДАТА РЕГИСТРАЦИИ */}
                          {candidate.created_at && (
                            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 mt-1 truncate">
                              <CalendarDays className="w-3 h-3 shrink-0" /> Registered: {new Date(candidate.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setCandidateToDelete(candidate.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                        title="Delete Candidate"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" /> <span className="truncate">{candidate.email}</span>
                      </div>
                      {candidate.phone && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" /> {candidate.phone}
                        </div>
                      )}
                    </div>

                    <div className="mb-6 flex-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Experience & Niches</div>
                      <div className="text-sm font-bold text-slate-900 mb-2">{candidate.years_of_experience || 'Not specified'}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {niches.length > 0 ? niches.map((niche: string) => (
                          <span key={niche} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[10px] font-bold text-slate-600">
                            {niche}
                          </span>
                        )) : <span className="text-xs text-slate-400">No niches selected</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-5">
                      {candidate.linkedin_url ? (
                        <a href={candidate.linkedin_url} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors">
                          <Globe className="w-5 h-5" />
                          <span className="text-[10px] font-bold">LinkedIn</span>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl opacity-40 cursor-not-allowed">
                          <Globe className="w-5 h-5" />
                          <span className="text-[10px] font-bold">LinkedIn</span>
                        </div>
                      )}

                      {candidate.resume_url ? (
                        <a href={candidate.resume_url} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition-colors">
                          <FileText className="w-5 h-5" />
                          <span className="text-[10px] font-bold">Resume</span>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl opacity-40 cursor-not-allowed">
                          <FileText className="w-5 h-5" />
                          <span className="text-[10px] font-bold">Resume</span>
                        </div>
                      )}

                      {candidate.video_pitch_url ? (
                        <a href={candidate.video_pitch_url} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors">
                          <PlayCircle className="w-5 h-5" />
                          <span className="text-[10px] font-bold">Video</span>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl opacity-40 cursor-not-allowed">
                          <PlayCircle className="w-5 h-5" />
                          <span className="text-[10px] font-bold">Video</span>
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

      {/* Campaign Delete Modal */}
      {campaignToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl sm:rounded-[2rem] p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-50 flex items-center justify-center mb-5 sm:mb-6 mx-auto">
              <Trash2 className="w-7 h-7 sm:w-8 sm:h-8 text-rose-500" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 sm:mb-3 text-center">Delete Campaign?</h3>
            <p className="text-sm sm:text-base text-slate-500 mb-6 sm:mb-8 font-medium leading-relaxed text-center">
              Are you sure you want to delete this campaign? All candidate applications will be removed. This cannot be undone.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
              <button 
                onClick={() => setCampaignToDelete(null)}
                disabled={isDeleting}
                className="w-full sm:flex-1 py-3 sm:py-3.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                disabled={isDeleting}
                className="w-full sm:flex-1 py-3 sm:py-3.5 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Delete Modal */}
      {candidateToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl sm:rounded-[2rem] p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-50 flex items-center justify-center mb-5 sm:mb-6 mx-auto">
              <Trash2 className="w-7 h-7 sm:w-8 sm:h-8 text-rose-500" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 sm:mb-3 text-center">Delete Candidate?</h3>
            <p className="text-sm sm:text-base text-slate-500 mb-6 sm:mb-8 font-medium leading-relaxed text-center">
              Are you sure you want to delete this candidate account? This will permanently remove their data from the database.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
              <button 
                onClick={() => setCandidateToDelete(null)}
                disabled={isDeletingCandidate}
                className="w-full sm:flex-1 py-3 sm:py-3.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={executeDeleteCandidate}
                disabled={isDeletingCandidate}
                className="w-full sm:flex-1 py-3 sm:py-3.5 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isDeletingCandidate ? <Loader2 className="w-5 h-5 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}