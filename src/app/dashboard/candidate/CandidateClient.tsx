"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Briefcase,
  Loader2,
  LogOut,
  User,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import CandidateApplicationCard from "@/components/dashboard/CandidateApplicationCard";

export default function CandidateClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login");
    },
  });

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exploreCampaigns, setExploreCampaigns] = useState<any[]>([]);
  const [hasUnreadUpdates, setHasUnreadUpdates] = useState(false);

  const userId = (session?.user as any)?.id;

  const updateApplication = (id: number, newData: any) => {
    setApplications((apps) =>
      apps?.map((a) => (a.id === id ? { ...a, ...newData } : a))
    );
    fetchApplications();
  };

  const fetchApplications = () => {
    if (!userId) return;

    fetch(`/api/users/${userId}/applications?_t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        setApplications(Array.isArray(data) ? data : []);

        fetch("/api/campaigns/explore")
          .then((res) => res.json())
          .then((data) => {
            setExploreCampaigns(Array.isArray(data) ? data : []);
          })
          .catch(() => {});

        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (status === "authenticated" && userId) {
      fetchApplications();
      const interval = setInterval(fetchApplications, 15000);

      const eventSource = new EventSource(`/api/events/candidate`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "STATUS_UPDATE") {
            setHasUnreadUpdates(true);
            fetchApplications();
          }
        } catch (e) {}
      };

      return () => {
        clearInterval(interval);
        eventSource.close();
      };
    }
  }, [status, userId]);

  const [withdrawingApp, setWithdrawingApp] = useState<any>(null);

  const handleSimulateHire = async (appId: number) => {
    try {
      const res = await fetch(`/api/applications/${appId}/hire`, {
        method: "POST",
      });
      if (res.ok) {
        fetchApplications();
      }
    } catch (e) {}
  };

  const handleQuickApply = async (campaignId: number) => {
    try {
      const res = await fetch(`/api/applications/quick-apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ campaignId, screeningAnswers: {} }),
      });
      if (res.ok) {
        router.replace("?success=true", { scroll: false });
        fetchApplications();
        fetch("/api/campaigns/explore")
          .then((r) => r.json())
          .then((d) => setExploreCampaigns(Array.isArray(d) ? d : []));
      } else {
        const err = await res.json();
        alert(err.error || "Failed to apply.");
      }
    } catch (e) {
      alert("Error submitting application");
    }
  };

  const [activeTab, setActiveTab] = useState<"active" | "archived" | "explore">("active");

  const activeApps = applications.filter(
    (a) =>
      ![
        "Rejected",
        "Disqualified",
        "Offer Declined",
        "Withdrawn",
        "Hired",
        "Talent Pool",
      ].includes(a.status)
  );
  const archivedApps = applications.filter((a) =>
    [
      "Rejected",
      "Disqualified",
      "Offer Declined",
      "Withdrawn",
      "Hired",
      "Talent Pool",
    ].includes(a.status)
  );

  const displayedApps = activeTab === "active" ? activeApps : archivedApps;

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Генерация инициалов
  const userInitials = session?.user?.name
    ? session.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
    : session?.user?.email?.[0].toUpperCase() || 'C';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 relative">
      {/* Hide Global Header via CSS for this specific Dashboard */}
      <style>{`header { display: none !important; }`}</style>

      {/* Candidate Navbar */}
      <nav className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-40 shadow-sm">
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
          onClick={() => router.push('/')}
        >
          <img src="/usc_logo.png" alt="USclosers Logo" className="h-8 shrink-0" />
          <span className="font-extrabold text-xl tracking-tight text-slate-900 hidden sm:block">
            USclosers
          </span>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex items-center gap-3 mr-2">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shadow-inner">
              {userInitials}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 leading-tight">
                {session?.user?.name || "Candidate"}
              </span>
              <span className="text-xs font-medium text-slate-500 leading-tight">Candidate Account</span>
            </div>
          </div>
          
          <button
            onClick={() => alert("Profile page coming next!")}
            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-700 transition-colors bg-white border border-slate-200 hover:border-blue-200 hover:bg-blue-50 px-3.5 py-2 rounded-xl shadow-sm"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">My Profile</span>
          </button>

          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center justify-center text-slate-500 hover:text-red-600 transition-colors bg-slate-100 hover:bg-red-50 p-2 rounded-xl"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-8 mt-4">
        
        {/* Page Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">My Applications</h1>
            <p className="text-slate-500 font-medium">Track your application status and next steps.</p>
          </div>
          <button
            onClick={() => setActiveTab("explore")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98] whitespace-nowrap"
          >
            Find more jobs
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 mb-8 border-b border-slate-200">
          <button
            onClick={() => {
              setActiveTab("active");
              setHasUnreadUpdates(false);
            }}
            className={cn(
              "pb-4 px-1 font-bold text-sm transition-colors relative flex items-center",
              activeTab === "active" ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
            )}
          >
            Active Applications
            <span className={cn(
              "ml-2 px-2 py-0.5 rounded-full text-xs transition-colors",
              activeTab === "active" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
            )}>
              {activeApps.length}
            </span>
            {hasUnreadUpdates && <span className="ml-2 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
            {activeTab === "active" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
          </button>
          
          <button
            onClick={() => setActiveTab("archived")}
            className={cn(
              "pb-4 px-1 font-bold text-sm transition-colors relative flex items-center",
              activeTab === "archived" ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
            )}
          >
            Archive
            <span className={cn(
              "ml-2 px-2 py-0.5 rounded-full text-xs transition-colors",
              activeTab === "archived" ? "bg-slate-200 text-slate-900" : "bg-slate-100 text-slate-600"
            )}>
              {archivedApps.length}
            </span>
            {activeTab === "archived" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-t-full"></div>}
          </button>

          <button
            onClick={() => {
              setActiveTab("explore");
              setHasUnreadUpdates(false);
            }}
            className={cn(
              "pb-4 px-1 font-bold text-sm transition-colors relative flex items-center",
              activeTab === "explore" ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
            )}
          >
            Job Board
            {activeTab === "explore" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "explore" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exploreCampaigns
                .filter(
                  (c) =>
                    !applications.find((a) => a.campaignId === c.id)
                )
                ?.map((campaign) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={campaign.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-6 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {campaign.logoUrl ? (
                        <img
                          src={campaign.logoUrl}
                          alt="Logo"
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-lg shrink-0">
                          {campaign.companyName?.charAt(0) || "C"}
                        </div>
                      )}
                      <h3 className="font-extrabold text-slate-900 text-lg leading-tight">
                        {campaign.title}
                      </h3>
                    </div>
                    
                    <button
                      onClick={() => handleQuickApply(campaign.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors active:scale-[0.98] shadow-sm"
                    >
                      Apply Now
                    </button>
                  </motion.div>
                ))}
              {exploreCampaigns.length === 0 && (
                <div className="col-span-full bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-center shadow-sm">
                  <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No new jobs available</h3>
                  <p className="text-slate-500 font-medium">Check back later for new opportunities.</p>
                </div>
              )}
            </div>
          </div>
        ) : displayedApps.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No applications yet</h3>
            <p className="text-slate-500 font-medium">Head over to the Job Board to find your next role.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedApps?.map((app) => (
              <CandidateApplicationCard
                key={app.id}
                app={app}
                handleSimulateHire={handleSimulateHire}
                setWithdrawingApp={setWithdrawingApp}
                setActiveTab={setActiveTab}
                onUpdate={updateApplication}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}