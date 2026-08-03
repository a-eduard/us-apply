import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Building2, DollarSign, Target, Percent } from "lucide-react";

export default async function CampaignPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id, 10);

  if (isNaN(campaignId)) {
    notFound();
  }

  const campaign = await prisma.campaigns.findUnique({
    where: { id: campaignId },
    include: {
      users: { 
        select: {
          first_name: true,
          last_name: true,
        }
      }
    }
  });

  if (!campaign) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-28 relative">
      {/* Dark Hero Background */}
      <div className="absolute top-0 left-0 right-0 h-[35vh] bg-[#0f172a] z-0"></div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 relative z-10">
        {/* Main Overlapping Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="p-8 sm:p-12">
            
            {/* Header Info with Logo */}
            <div className="flex items-center gap-3 text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">
              {campaign.logo_url ? (
                <img src={campaign.logo_url} alt="Logo" className="w-8 h-8 rounded-lg object-cover border border-slate-100 shadow-sm" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
              )}
              {campaign.company_name || "Confidential"}
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-10 tracking-tight">
              {campaign.title}
            </h1>
            
            {/* Financial Details Grid - Now Dynamic */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <DollarSign className="w-4 h-4" /> Base Salary
                </div>
                <div className="text-xl font-bold text-slate-900">
                  {campaign.base_salary || "Not specified"}
                </div>
              </div>
              
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <Target className="w-4 h-4" /> OTE
                </div>
                <div className="text-xl font-bold text-slate-900">
                  {campaign.ote || "Not specified"}
                </div>
              </div>
              
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <Percent className="w-4 h-4" /> Commission
                </div>
                <div className="text-xl font-bold text-slate-900">
                  {campaign.commission || "Not specified"}
                </div>
              </div>
            </div>

            {/* About the Role */}
            {campaign.description && (
              <div className="mb-10">
                <h2 className="text-xl font-bold text-slate-900 mb-4">About the Role</h2>
                <div className="prose prose-slate max-w-none text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {campaign.description}
                </div>
              </div>
            )}

            {/* Requirements */}
            {campaign.requirements && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Requirements</h2>
                <div className="prose prose-slate max-w-none text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {campaign.requirements}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="hidden sm:block">
            <div className="text-sm font-bold text-slate-900">{campaign.title}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">
              {campaign.company_name || "Confidential"}
            </div>
          </div>
          
          <Link
            href={`/wizard/step-1?campaignId=${campaign.id}`}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-10 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] text-center"
          >
            Apply Now
          </Link>
        </div>
      </div>
    </div>
  );
}