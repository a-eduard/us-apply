"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  Briefcase,
  Settings,
  LogOut,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  Video,
  ChevronRight,
  Building2,
  Clock,
  ArrowUpRight,
  Sun,
  Moon,
  Search,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ProfileSettingsForm from "@/components/dashboard/ProfileSettingsForm";

export default function CandidateClient() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login");
    },
  });

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [applications, setApplications] = useState<any[]>([]);
  const [exploreCampaigns, setExploreCampaigns] = useState<any[]>([]); 
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tabs for the main content area
  const [activeTab, setActiveTab] = useState<"active" | "explore" | "settings">("active");

  // Modal States
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  const isFirstLoad = useRef(true);
  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.role;

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchApplications = () => {
    if (!userId) return;

    fetch(`/api/users/${userId}/profile?_t=${Date.now()}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data && !data.error) setUserProfile(data); })
      .catch(() => { });

    Promise.all([
      fetch(`/api/users/${userId}/applications?_t=${Date.now()}`).then(res => res.ok ? res.json() : []),
      fetch(`/api/campaigns/explore?_t=${Date.now()}`).then(res => res.ok ? res.json() : [])
    ])
      .then(([appsData, campData]) => {
        if (Array.isArray(appsData)) setApplications(appsData);
        if (Array.isArray(campData)) setExploreCampaigns(campData);
      })
      .catch(() => console.warn("Background fetch failed."))
      .finally(() => {
        if (isFirstLoad.current) {
          isFirstLoad.current = false;
          setLoading(false);
        }
      });
  };

  useEffect(() => {
    if (status === "authenticated" && userId) {
      if (userRole === "Employer" || userRole === "Admin") {
        router.push("/dashboard/employer");
        return;
      }

      fetchApplications();
      const interval = setInterval(fetchApplications, 30000);
      return () => clearInterval(interval);
    }
  }, [status, userId, userRole]);

  if (loading && isFirstLoad.current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-blue-600 dark:text-blue-500" />
      </div>
    );
  }

  const dbFirstName = userProfile?.first_name || "";
  const dbLastName = userProfile?.last_name || "";
  const displayName = [dbFirstName, dbLastName].filter(Boolean).join(" ") || session?.user?.name || "Candidate";
  let userInitials = displayName.substring(0, 2).toUpperCase();

  const userLocation = [userProfile?.city, userProfile?.state].filter(Boolean).join(", ");
  const userNiches = userProfile?.niches ? (typeof userProfile.niches === 'string' ? JSON.parse(userProfile.niches) : userProfile.niches) : [];

  const activeApps = applications.filter(
    (a) => !["Rejected", "Disqualified", "Offer Declined", "Withdrawn", "Hired", "Talent Pool"].includes(a.status)
  );

  const combinedMap = new Map();
  exploreCampaigns.forEach(c => {
    combinedMap.set(c.id, { campaign: c, application: null });
  });
  applications.forEach(app => {
    if (app.campaign) {
      if (combinedMap.has(app.campaign.id)) {
        combinedMap.get(app.campaign.id).application = app;
      } else {
        combinedMap.set(app.campaign.id, { campaign: app.campaign, application: app });
      }
    }
  });

  const allCampaignsList = Array.from(combinedMap.values()).sort((a, b) => {
    if (a.application && !b.application) return -1;
    if (!a.application && b.application) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 relative pb-28">
      <style>{`header { display: none !important; }`}</style>

      {/* Clean Minimalist Header */}
      <nav className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          
          <div className="flex items-center cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-0.5" onClick={() => router.push('/')}>
            <img src="/usc_logo.png" alt="USclosers Logo" className="h-6 sm:h-7 md:h-8 shrink-0 mr-2 sm:mr-3 group-hover:opacity-80 transition-opacity" />
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white transition-colors group-hover:opacity-80 hidden sm:block">USclosers</span>
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

      {/* Main Centered Layout Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 lg:pt-12 w-full">
        
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-10 text-center lg:text-left">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2 transition-colors">
            Welcome back, {dbFirstName || "Candidate"}
          </h1>
          <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400 transition-colors">
            Here is what's happening with your profile and applications today.
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* LEFT COLUMN: Sticky Profile Card */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 sm:p-6 lg:p-8 shadow-sm border border-slate-200/60 dark:border-slate-800 transition-colors duration-300 flex flex-col items-center">
              
              <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full border-4 border-slate-50 dark:border-slate-950 shadow-md bg-slate-100 dark:bg-slate-800 mb-4 sm:mb-5 overflow-hidden flex items-center justify-center shrink-0 transition-colors">
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-xl sm:text-2xl lg:text-3xl text-slate-600 dark:text-slate-300">{userInitials}</span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1.5 transition-colors text-center">{displayName}</h2>
              
              <div className="flex flex-col items-center gap-2 mb-6 text-[10px] sm:text-xs lg:text-sm text-slate-500 dark:text-slate-400 font-medium w-full transition-colors">
                {userLocation && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{userLocation}</span></div>}
                <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{userProfile?.email || session?.user?.email}</span></div>
                {userProfile?.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{userProfile.phone}</span></div>}
              </div>

              <div className="w-full h-px bg-slate-100 dark:bg-slate-800/60 mb-5 sm:mb-6 transition-colors"></div>

              <div className="w-full text-left space-y-4 sm:space-y-5 mb-6 sm:mb-8">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block transition-colors">Experience</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-200 transition-colors">{userProfile?.years_of_experience || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 block transition-colors">Top Niches</span>
                  <div className="flex flex-wrap gap-2">
                    {userNiches.length > 0 ? userNiches.map((niche: string) => (
                      <span key={niche} className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800 rounded-lg text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors">
                        {niche}
                      </span>
                    )) : (
                      <span className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">Not selected</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full space-y-2.5 sm:space-y-3">
                {userProfile?.linkedin_url && (
                  <a href={userProfile.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors group active:scale-[0.98]">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 transition-colors shrink-0"><Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
                      <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">LinkedIn</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                  </a>
                )}
                {userProfile?.resume_url && (
                  <button 
                    onClick={() => setShowResumeModal(true)}
                    className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors group active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 transition-colors shrink-0"><FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
                      <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Resume</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                  </button>
                )}
                {userProfile?.video_pitch_url && (
                  <button 
                    onClick={() => setShowVideoModal(true)}
                    className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-500/30 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors group active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 transition-colors shrink-0"><Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
                      <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">Pitch</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Content Area */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">
            
            {/* Minimalist Tabs Navigation (Swipeable on mobile) */}
            <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl w-full sm:w-fit shadow-sm transition-colors overflow-x-auto flex-nowrap [&::-webkit-scrollbar]:hidden">
              <button
                onClick={() => setActiveTab("active")}
                className={cn(
                  "px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  activeTab === "active" 
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:scale-[0.98]"
                )}
              >
                <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Active 
                {activeApps.length > 0 && (
                  <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full text-[10px] ml-1">{activeApps.length}</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("explore")}
                className={cn(
                  "px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  activeTab === "explore" 
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:scale-[0.98]"
                )}
              >
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Job Board
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={cn(
                  "px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  activeTab === "settings" 
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:scale-[0.98]"
                )}
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Settings
              </button>
            </div>

            {/* TAB CONTENT: Active Applications */}
            {activeTab === "active" && (
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 sm:p-6 lg:p-8 shadow-sm border border-slate-200/60 dark:border-slate-800 transition-colors duration-300">
                <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white transition-colors">Active Applications</h3>
                    <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 transition-colors">Track your ongoing interview processes.</p>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {activeApps.length === 0 ? (
                    <div className="py-12 sm:py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50 px-4 transition-colors">
                      <Briefcase className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 dark:text-slate-600 mb-3 sm:mb-4" />
                      <h4 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-1.5 sm:mb-2 transition-colors">No active applications</h4>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mb-5 sm:mb-6 transition-colors">Head over to the Job Board to find your next role.</p>
                      <button
                        onClick={() => setActiveTab("explore")}
                        className="px-6 sm:px-8 py-2.5 sm:py-3 bg-blue-600 dark:bg-blue-500 text-white font-bold rounded-xl text-xs sm:text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20 dark:shadow-blue-900/20 outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40"
                      >
                        Explore Jobs
                      </button>
                    </div>
                  ) : (
                    activeApps.map((app) => {
                      const companyName = app.campaign?.company_name || app.campaign?.companyName || "Unknown Company";
                      const campaignTitle = app.campaign?.title || "Unknown Role";
                      const logoUrl = app.campaign?.logo_url || app.campaign?.logoUrl;

                      return (
                        <div key={app.id} onClick={() => router.push(`/campaign/${app.campaign?.id}`)} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-md transition-all bg-white dark:bg-slate-950/50 gap-4 sm:gap-0 cursor-pointer active:scale-[0.99] sm:active:scale-100">
                          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                            {logoUrl ? (
                              <img src={logoUrl} alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border border-slate-100 dark:border-slate-800 shrink-0 bg-white" />
                            ) : (
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center font-bold text-base sm:text-lg border border-blue-100 dark:border-blue-500/20 shrink-0 transition-colors">
                                {companyName.charAt(0)}
                              </div>
                            )}
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base line-clamp-1 transition-colors pr-2">{campaignTitle}</h4>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5">
                                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors">
                                  <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {companyName}
                                </div>
                                <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 transition-colors">
                                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                  {app.created_at || app.createdAt
                                    ? new Date(app.created_at || app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                    : "Recently"
                                  }
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
                            <div className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 text-[10px] sm:text-xs font-bold tracking-wide transition-colors">
                              {app.status}
                            </div>
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors text-slate-400 dark:text-slate-500 shrink-0">
                              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Job Board (Explore) */}
            {activeTab === "explore" && (
              <div className="space-y-3 sm:space-y-4">
                {allCampaignsList.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 lg:p-12 text-center border border-slate-200/60 dark:border-slate-800 shadow-sm py-12 sm:py-16 lg:py-20 flex flex-col items-center transition-colors">
                    <Search className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-slate-200 dark:text-slate-700 mb-4 sm:mb-5 transition-colors" />
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1.5 sm:mb-2 text-slate-900 dark:text-white transition-colors">No opportunities available</h2>
                    <p className="text-xs sm:text-sm lg:text-base text-slate-500 dark:text-slate-400 font-medium transition-colors">There are currently no active job postings. Check back later!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    {allCampaignsList.map(({ campaign, application }) => {
                      const companyName = campaign.company_name || campaign.companyName || "Confidential";
                      const campaignTitle = campaign.title || "Unknown Role";
                      const logoUrl = campaign.logo_url || campaign.logoUrl;

                      let statusBg = "bg-slate-50 dark:bg-slate-800";
                      let statusText = "text-slate-600 dark:text-slate-300";
                      let statusBorder = "border-slate-200 dark:border-slate-700";
                      let statusLabel = "Not Applied";

                      if (application) {
                        statusLabel = application.status;
                        if (application.status === "Applied" || application.status === "Screening") {
                          statusBg = "bg-blue-50 dark:bg-blue-500/10"; statusText = "text-blue-700 dark:text-blue-400"; statusBorder = "border-blue-200 dark:border-blue-500/20";
                        } else if (application.status === "Interview") {
                          statusBg = "bg-purple-50 dark:bg-purple-500/10"; statusText = "text-purple-700 dark:text-purple-400"; statusBorder = "border-purple-200 dark:border-purple-500/20";
                        } else if (application.status === "Offer" || application.status === "Hired") {
                          statusBg = "bg-emerald-50 dark:bg-emerald-500/10"; statusText = "text-emerald-700 dark:text-emerald-400"; statusBorder = "border-emerald-200 dark:border-emerald-500/20";
                        } else if (["Rejected", "Disqualified", "Withdrawn"].includes(application.status)) {
                          statusBg = "bg-rose-50 dark:bg-rose-500/10"; statusText = "text-rose-700 dark:text-rose-400"; statusBorder = "border-rose-200 dark:border-rose-500/20";
                        }
                      }

                      return (
                        <div key={campaign.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-md transition-all bg-white dark:bg-slate-900 group gap-4 sm:gap-0 active:scale-[0.99] sm:active:scale-100">
                          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                            {logoUrl ? (
                              <img src={logoUrl} alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border border-slate-100 dark:border-slate-800 shrink-0 bg-white" />
                            ) : (
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 rounded-xl flex items-center justify-center font-bold text-base sm:text-lg border border-slate-200 dark:border-slate-800 shrink-0 transition-colors">
                                {companyName.charAt(0)}
                              </div>
                            )}
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base line-clamp-1 transition-colors pr-2">{campaignTitle}</h4>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5">
                                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors">
                                  <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {companyName}
                                </div>
                                <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 transition-colors">
                                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                  {application
                                    ? `Applied ${application.created_at || application.createdAt ? new Date(application.created_at || application.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "Recently"}`
                                    : `Posted ${campaign.created_at || campaign.createdAt ? new Date(campaign.created_at || campaign.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "Recently"}`
                                  }
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
                            <div className={cn("px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg border text-[10px] sm:text-xs font-bold tracking-wide whitespace-nowrap transition-colors", statusBg, statusText, statusBorder)}>
                              {statusLabel}
                            </div>
                            <a
                              href={`/campaign/${campaign.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-colors text-slate-400 dark:text-slate-500 shrink-0 border border-slate-200/60 dark:border-slate-700 active:scale-95"
                              title="View job posting"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: Settings */}
            {activeTab === "settings" && (
              <div className="w-full">
                <ProfileSettingsForm
                  userProfile={userProfile}
                  userId={userId}
                  session={session}
                  onSaveSuccess={fetchApplications}
                />
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Floating Log Out Button - Optimized for mobile placement */}
      <button 
        onClick={() => signOut({ callbackUrl: '/' })} 
        className="fixed bottom-6 right-4 sm:right-6 lg:bottom-10 lg:right-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-xl text-rose-500 dark:text-rose-400 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full flex items-center gap-2 sm:gap-2.5 font-bold text-xs sm:text-sm hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:shadow-2xl transition-all z-50 group outline-none focus-visible:ring-4 focus-visible:ring-rose-500/40 active:scale-95"
      >
        <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-0.5 transition-transform" /> 
        <span className="hidden sm:inline">Log Out</span>
        <span className="sm:hidden">Exit</span>
      </button>

      {/* --- VIDEO PITCH VIEW MODAL --- */}
      <AnimatePresence>
        {showVideoModal && userProfile?.video_pitch_url && (
          <div 
            className="fixed inset-0 z-[9999] bg-slate-900/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 transition-colors"
            onClick={() => setShowVideoModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-200/60 dark:border-slate-800/60 flex flex-col transition-colors"
              onClick={(e) => e.stopPropagation()} 
            >
              <div className="p-4 sm:p-5 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center transition-colors">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
                  <Video className="w-5 h-5 text-purple-500 dark:text-purple-400" /> Your Video Pitch
                </h3>
                <button 
                  onClick={() => setShowVideoModal(false)} 
                  className="p-1.5 sm:p-2 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full transition-colors active:scale-95"
                >
                  <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
              <div className="bg-black w-full aspect-video flex items-center justify-center relative">
                <video
                  src={userProfile.video_pitch_url}
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
        {showResumeModal && userProfile?.resume_url && (
          <div 
            className="fixed inset-0 z-[9999] bg-slate-900/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 transition-colors"
            onClick={() => setShowResumeModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200/60 dark:border-slate-800/60 transition-colors"
              onClick={(e) => e.stopPropagation()} 
            >
              <div className="p-4 sm:p-5 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center transition-colors shrink-0">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
                  <FileText className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> Your Resume
                </h3>
                <button 
                  onClick={() => setShowResumeModal(false)} 
                  className="p-1.5 sm:p-2 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full transition-colors active:scale-95"
                >
                  <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
              <div className="flex-1 w-full bg-slate-100 dark:bg-slate-950/50 relative">
                <iframe
                  src={userProfile.resume_url}
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