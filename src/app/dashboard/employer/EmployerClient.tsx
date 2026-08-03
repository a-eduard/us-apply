"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Building2, Plus, Briefcase, ChevronRight, LogOut, Loader2, Edit2, Trash2 } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const userName = session?.user?.name || session?.user?.email || "Employer";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 relative">
      <nav className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => router.push('/')}>
          <img src="/usc_logo.png" alt="USclosers Logo" className="h-8 group-hover:opacity-80 transition-opacity shrink-0" />
          <span className="text-xl font-extrabold text-slate-800 tracking-tight group-hover:opacity-80 transition-opacity hidden sm:block">
            USclosers
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-widest hidden sm:block">
              Employer:
            </span>
            <span className="text-sm font-bold text-slate-900">
              {userName}
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

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-8 mt-4">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">My Campaigns</h1>
            <p className="text-slate-500 font-medium">Manage your job postings and review candidates.</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/employer/campaigns/new')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Create New Campaign
          </button>
        </div>

        {campaigns.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No campaigns yet</h3>
            <p className="text-slate-500 font-medium mb-6">Create your first job posting to start receiving applications.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {campaigns.map((campaign) => {
              const apps = campaign.applications || [];
              const applied = apps.filter((a: any) => a.status === 'Applied').length;
              const screening = apps.filter((a: any) => a.status === 'Screening' || a.status === 'Needs Revision').length;
              const interview = apps.filter((a: any) => a.status === 'Interview').length;
              const hired = apps.filter((a: any) => a.status === 'Employee' || a.status === 'Hired').length;

              return (
                <div key={campaign.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                  
                  {/* FIX: Added flex-1 and min-w-0 here to prevent text from pushing the layout */}
                  <div className="flex gap-4 items-start flex-1 min-w-0">
                    {campaign.logoUrl || campaign.logo_url ? (
                      <img src={campaign.logoUrl || campaign.logo_url} alt="Logo" className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100" />
                    ) : (
                      <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center shrink-0">
                        <Building2 className="w-6 h-6" />
                      </div>
                    )}
                    {/* FIX: Added min-w-0 to the text container */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 truncate">
                        {campaign.companyName || campaign.company_name || "Your Company"}
                      </div>
                      {/* FIX: Added truncate to the title */}
                      <h2 className="text-xl font-extrabold text-slate-900 mb-1 leading-tight truncate" title={campaign.title}>
                        {campaign.title}
                      </h2>
                      <div className="text-xs font-medium text-slate-500">
                        Created on {new Date(campaign.created_at || campaign.createdAt || Date.now()).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* FIX: Added shrink-0 to the right-side actions block */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 lg:gap-8 bg-slate-50 lg:bg-transparent p-4 lg:p-0 rounded-xl border border-slate-200 lg:border-none shrink-0">
                    <div className="flex gap-4 text-center w-full sm:w-auto justify-between sm:justify-start">
                      <div>
                        <div className="text-xl font-bold text-slate-700">{applied}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Applied</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-slate-700">{screening}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Screening</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-blue-600">{interview}</div>
                        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">Interview</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-emerald-600">{hired}</div>
                        <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Hired</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => router.push(`/dashboard/employer/campaigns/${campaign.id}/edit`)}
                        className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors bg-white lg:bg-transparent border lg:border-none border-slate-200"
                        title="Edit Campaign"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>

                      <button 
                        onClick={() => setCampaignToDelete(campaign.id)}
                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors bg-white lg:bg-transparent border lg:border-none border-slate-200"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>

                      <button 
                        onClick={() => router.push(`/dashboard/employer/campaigns/${campaign.id}`)}
                        className="flex-1 sm:flex-none ml-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl transition-colors inline-flex items-center justify-center gap-2 shadow-md active:scale-[0.98]"
                      >
                        View Candidates <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal Overlay */}
      {campaignToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Campaign?</h3>
            <p className="text-slate-500 mb-8 font-medium leading-relaxed">
              Are you sure you want to delete this campaign? All associated candidate applications will also be removed. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setCampaignToDelete(null)}
                disabled={isDeleting}
                className="px-5 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-70 min-w-[120px]"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}