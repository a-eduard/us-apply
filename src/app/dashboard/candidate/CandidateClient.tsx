"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Briefcase,
  Bell,
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
  ArrowUpRight
} from "lucide-react";
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

  const [applications, setApplications] = useState<any[]>([]);
  const [exploreCampaigns, setExploreCampaigns] = useState<any[]>([]); 
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"dashboard" | "applications" | "settings">("dashboard");

  const isFirstLoad = useRef(true);
  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.role;

  const fetchApplications = () => {
    if (!userId) return;

    // ИСПРАВЛЕНО: Добавлен сброс кэша ?_t=${Date.now()} чтобы профили не смешивались
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
      // ИСПРАВЛЕНО: Жесткое разделение ролей. Если это работодатель, выкидываем его отсюда
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
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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

  const NAV_ITEMS = [
    { id: "dashboard", label: "My Dashboard", icon: LayoutDashboard },
    { id: "applications", label: "Applications", icon: Briefcase },
  ] as const;

  return (
    <div className="flex h-screen bg-[#F4F6F9] font-sans text-slate-900 overflow-hidden">
      <style>{`header { display: none !important; }`}</style>

      {/* SIDEBAR */}
      <aside className="w-[280px] bg-white flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 shrink-0">
        <div className="h-24 flex items-center px-10 cursor-pointer" onClick={() => router.push('/')}>
          <img src="/usc_logo.png" alt="USclosers Logo" className="h-8 shrink-0 mr-3" />
          <span className="font-extrabold text-xl tracking-tight text-slate-900">USclosers</span>
        </div>

        <nav className="flex-1 px-6 py-4 space-y-2 mt-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300",
                  isActive
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-100 space-y-2">
          <button
            onClick={() => setActiveTab("settings")}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-semibold text-sm transition-all",
              activeTab === "settings" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Settings className={cn("w-5 h-5", activeTab === "settings" ? "text-white" : "text-slate-400")} />
            Settings
          </button>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-semibold text-sm text-rose-500 hover:bg-rose-50 transition-all">
            <LogOut className="w-5 h-5 text-rose-400" />
            Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">

        {/* TOP HEADER */}
        <header className="h-24 px-10 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {activeTab === 'dashboard' && 'Welcome back, ' + dbFirstName}
              {activeTab === 'applications' && 'Job Board & Applications'}
              {activeTab === 'settings' && 'Profile Settings'}
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              {activeTab === 'dashboard' && "Here is what's happening with your profile today."}
              {activeTab === 'settings' && "Manage your personal information and preferences."}
              {activeTab === 'applications' && "Browse available roles and track your application statuses."}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-400 hover:text-slate-900 transition-colors">
              <Bell className="w-6 h-6" />
              {activeApps.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border-2 border-[#F4F6F9]"></span>}
            </button>

            <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200/50 cursor-pointer hover:shadow-md transition-shadow">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                {userInitials}
              </div>
              <span className="font-bold text-sm text-slate-900 pr-2">{displayName}</span>
            </div>
          </div>
        </header>

        {/* SCROLLABLE DASHBOARD CONTENT */}
        <div className="flex-1 overflow-y-auto px-10 pb-10">

          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1400px]">

              {/* LEFT COLUMN: PROFILE CARD */}
              <div className="lg:col-span-4 xl:col-span-3 space-y-6">
                <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center">
                  {/* Avatar */}
                  {userProfile?.avatar_url ? (
                    <img src={userProfile.avatar_url} alt="Avatar" className="w-28 h-28 rounded-full object-cover mb-5 border-4 border-white shadow-lg bg-slate-100" />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-slate-900 text-white mb-5 flex items-center justify-center font-bold text-3xl shadow-lg shadow-slate-900/20">
                      {userInitials}
                    </div>
                  )}

                  {/* Name & Basic Info */}
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-1">{displayName}</h2>
                  <div className="flex flex-col items-center gap-2 mb-6">
                    {userLocation && (
                      <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                        <MapPin className="w-4 h-4 text-slate-400" /> {userLocation}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                      <Mail className="w-4 h-4 text-slate-400" /> {userProfile?.email || session?.user?.email}
                    </div>
                    {userProfile?.phone && (
                      <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                        <Phone className="w-4 h-4 text-slate-400" /> {userProfile.phone}
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="w-full h-px bg-slate-100 mb-6"></div>

                  {/* Experience & Niches */}
                  <div className="w-full text-left space-y-5 mb-8">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Experience</span>
                      <span className="text-sm font-semibold text-slate-900">{userProfile?.years_of_experience || "Not specified"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Top Niches</span>
                      <div className="flex flex-wrap gap-2">
                        {userNiches.length > 0 ? userNiches.map((niche: string) => (
                          <span key={niche} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                            {niche}
                          </span>
                        )) : (
                          <span className="text-sm font-medium text-slate-500">Not selected</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div className="w-full space-y-3 mb-8">
                    {userProfile?.linkedin_url && (
                      <a href={userProfile.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><Globe className="w-4 h-4" /></div>
                          <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">Web / LinkedIn</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600" />
                      </a>
                    )}
                    {userProfile?.resume_url && (
                      <a href={userProfile.resume_url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600"><FileText className="w-4 h-4" /></div>
                          <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700">Resume / CV</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600" />
                      </a>
                    )}
                    {userProfile?.video_pitch_url && (
                      <a href={userProfile.video_pitch_url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600"><Video className="w-4 h-4" /></div>
                          <span className="text-sm font-semibold text-slate-700 group-hover:text-purple-700">Video Pitch</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600" />
                      </a>
                    )}
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => setActiveTab("settings")}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl transition-all active:scale-[0.98]"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: ACTIVE APPLICATIONS WIDGET */}
              <div className="lg:col-span-8 xl:col-span-9 space-y-8">
                <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-extrabold text-xl text-slate-900">Active Applications</h3>
                      <p className="text-sm font-medium text-slate-500 mt-1">Track your ongoing interview processes.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab("applications")}
                      className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-3">
                    {activeApps.length === 0 ? (
                      <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                        <Briefcase className="w-10 h-10 text-slate-300 mb-3" />
                        <h4 className="font-bold text-slate-900 mb-1">No active applications</h4>
                        <p className="text-sm text-slate-500 font-medium">Head over to the Applications tab to find your next role.</p>
                        <button
                          onClick={() => setActiveTab("applications")}
                          className="mt-4 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition-all active:scale-[0.98]"
                        >
                          Find Jobs
                        </button>
                      </div>
                    ) : (
                      activeApps.map((app) => {
                        const companyName = app.campaign?.company_name || app.campaign?.companyName || "Unknown Company";
                        const campaignTitle = app.campaign?.title || "Unknown Role";
                        const logoUrl = app.campaign?.logo_url || app.campaign?.logoUrl;

                        return (
                          <div key={app.id} className="group flex items-center justify-between p-5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all bg-white">
                            <div className="flex items-center gap-5">
                              {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-12 h-12 rounded-xl object-cover border border-slate-100" />
                              ) : (
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-lg border border-blue-100">
                                  {companyName.charAt(0)}
                                </div>
                              )}
                              <div>
                                <h4 className="font-bold text-slate-900 text-base">{campaignTitle}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> {companyName}
                                  </div>
                                  <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                  <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    {app.created_at || app.createdAt
                                      ? new Date(app.created_at || app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                      : "Recently"
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-5">
                              <div className="px-4 py-1.5 rounded-full border border-blue-100 bg-blue-50 text-blue-700 text-xs font-bold">
                                {app.status}
                              </div>
                              <button
                                onClick={() => setActiveTab("applications")}
                                className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors text-slate-400"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ALL CAMPAIGNS & APPLICATIONS TAB */}
          {activeTab === "applications" && (
            <div className="max-w-[1400px]">
              {allCampaignsList.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm py-20 flex flex-col items-center">
                  <Briefcase className="w-16 h-16 text-slate-200 mb-4" />
                  <h2 className="text-2xl font-bold mb-2 text-slate-900">No opportunities available</h2>
                  <p className="text-slate-500 font-medium mb-6">There are currently no active job postings. Check back later!</p>
                </div>
              ) : (
                <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allCampaignsList.map(({ campaign, application }) => {
                      const companyName = campaign.company_name || campaign.companyName || "Confidential";
                      const campaignTitle = campaign.title || "Unknown Role";
                      const logoUrl = campaign.logo_url || campaign.logoUrl;

                      let statusBg = "bg-slate-100";
                      let statusText = "text-slate-600";
                      let statusBorder = "border-slate-200";
                      let statusLabel = "Not Applied";

                      if (application) {
                        statusLabel = application.status;
                        if (application.status === "Applied" || application.status === "Screening") {
                          statusBg = "bg-blue-50"; statusText = "text-blue-700"; statusBorder = "border-blue-100";
                        } else if (application.status === "Interview") {
                          statusBg = "bg-purple-50"; statusText = "text-purple-700"; statusBorder = "border-purple-100";
                        } else if (application.status === "Offer" || application.status === "Hired") {
                          statusBg = "bg-emerald-50"; statusText = "text-emerald-700"; statusBorder = "border-emerald-100";
                        } else if (["Rejected", "Disqualified", "Withdrawn"].includes(application.status)) {
                          statusBg = "bg-rose-50"; statusText = "text-rose-700"; statusBorder = "border-rose-100";
                        }
                      }

                      return (
                        <div key={campaign.id} className="flex flex-col p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all bg-white relative group">

                          <div className="flex justify-between items-start mb-6">
                            <div className="flex gap-4 items-start">
                              {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0" />
                              ) : (
                                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center font-bold text-lg border border-slate-100 shrink-0">
                                  {companyName.charAt(0)}
                                </div>
                              )}
                              <div>
                                <h4 className="font-bold text-slate-900 text-lg leading-tight mb-1 line-clamp-2 pr-4">{campaignTitle}</h4>
                                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{companyName}</div>
                              </div>
                            </div>

                            <a
                              href={`/campaign/${campaign.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors text-slate-400 shrink-0 border border-slate-100 hover:border-blue-600"
                              title="View job posting"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </a>
                          </div>

                          <div className="mt-auto pt-5 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                              <Clock className="w-4 h-4" />
                              {application
                                ? `Applied ${application.created_at || application.createdAt ? new Date(application.created_at || application.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Recently"}`
                                : `Posted ${campaign.created_at || campaign.createdAt ? new Date(campaign.created_at || campaign.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Recently"}`
                              }
                            </div>
                            <div className={cn("px-4 py-1.5 rounded-full border text-xs font-bold", statusBg, statusText, statusBorder)}>
                              {statusLabel}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === "settings" && (
            <div className="max-w-[1000px] pb-10">
              <ProfileSettingsForm
                userProfile={userProfile}
                userId={userId}
                session={session}
                onSaveSuccess={fetchApplications}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}