"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Building2, Plus, Briefcase, ChevronRight, LogOut, Loader2, Edit2, Trash2, CalendarDays } from "lucide-react";

export default function EmployerClient() {
  const router = useRouter();
  
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login");
    },
  });

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [campaignToDelete, setCampaignToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCampaigns = () => {
    fetch("/api/employer/campaigns")
      .then((res) => res.json())
      .then((data) => {
        setCampaigns(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchCampaigns();
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
        fetchCampaigns();
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

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 relative">
      <nav className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => router.push('/')}>
          <img src="/usc_logo.png" alt="USclosers Logo" className="h-8 group-hover:opacity-80 transition-opacity shrink-0" />
          <span className="text-xl font-extrabold text-slate-800 tracking-tight group-hover:opacity-80 transition-opacity hidden sm:block">
            USclosers
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center justify-center px-3 py-1 bg-slate-100 border border-slate-200 rounded-md hidden sm:flex">
            <span className="text-xs font-black uppercase text-slate-700 tracking-widest">
              EMPLOYER
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 sm:p-8 mt-4">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">My Campaigns</h1>
            <p className="text-slate-500 font-medium">Manage your job postings and review candidates.</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/employer/campaigns/new')}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Create New Campaign
          </button>
        </div>

        {campaigns.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-slate-200 border-dashed p-12 md:p-20 text-center shadow-sm max-w-2xl mx-auto mt-10">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 mb-3">No campaigns yet</h3>
            <p className="text-slate-500 font-medium mb-8 text-lg">Create your first job posting to start receiving applications from top closers.</p>
            <button
              onClick={() => router.push('/dashboard/employer/campaigns/new')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 active:scale-[0.98] transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Campaign
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {campaigns.map((campaign) => {
              const apps = campaign.applications || [];
              
              const countNew = apps.filter((a: any) => !a.status || a.status === 'Applied' || a.status === 'New').length;
              const countReviewing = apps.filter((a: any) => ['Screening', 'Interview', 'Reviewing', 'Needs Revision'].includes(a.status)).length;
              const countOnboarding = apps.filter((a: any) => ['Offer', 'Employee', 'Hired', 'Shortlisted', 'Onboarding'].includes(a.status)).length;
              const countDeclined = apps.filter((a: any) => a.status === 'Declined').length;

              return (
                <div key={campaign.id} className="bg-white rounded-[2rem] border border-slate-200 p-6 flex flex-col relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300 transition-all duration-300">
                  
                  {/* Decorative top line on hover */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {/* Header: Logo & Actions */}
                  <div className="flex justify-between items-start mb-6">
                    {campaign.logoUrl || campaign.logo_url ? (
                      <img src={campaign.logoUrl || campaign.logo_url} alt="Logo" className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-slate-100 shadow-sm" />
                    ) : (
                      <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 shadow-sm">
                        <Building2 className="w-7 h-7" />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button 
                        onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/employer/campaigns/${campaign.id}/edit`); }}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-white rounded-lg transition-colors"
                        title="Edit Campaign"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setCampaignToDelete(campaign.id); }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body: Info */}
                  <div className="mb-6 flex-1">
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 line-clamp-1">
                      {campaign.companyName || campaign.company_name || "Your Company"}
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mb-3 leading-tight line-clamp-2">
                      {campaign.title}
                    </h2>
                    
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {new Date(campaign.created_at || campaign.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Pipeline Stats */}
                  <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100 grid grid-cols-4 gap-2">
                    <div className="text-center flex flex-col items-center justify-center">
                      <div className="text-lg font-black text-blue-600 leading-none mb-1">{countNew}</div>
                      <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">New</div>
                    </div>
                    <div className="text-center flex flex-col items-center justify-center border-l border-slate-200">
                      <div className="text-lg font-black text-amber-500 leading-none mb-1">{countReviewing}</div>
                      <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Rev</div>
                    </div>
                    <div className="text-center flex flex-col items-center justify-center border-l border-slate-200">
                      <div className="text-lg font-black text-emerald-500 leading-none mb-1">{countOnboarding}</div>
                      <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Onb</div>
                    </div>
                    <div className="text-center flex flex-col items-center justify-center border-l border-slate-200">
                      <div className="text-lg font-black text-rose-500 leading-none mb-1">{countDeclined}</div>
                      <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Dec</div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <button 
                    onClick={() => router.push(`/dashboard/employer/campaigns/${campaign.id}`)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 group/btn"
                  >
                    View Pipeline 
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                  
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal Overlay */}
      {campaignToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-6 mx-auto">
              <Trash2 className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 text-center">Delete Campaign?</h3>
            <p className="text-slate-500 mb-8 font-medium leading-relaxed text-center">
              Are you sure you want to delete this campaign? All candidate applications will be removed. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setCampaignToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex-1 py-3.5 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}