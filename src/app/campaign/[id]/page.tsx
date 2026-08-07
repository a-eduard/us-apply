import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Building2, ArrowLeft, CheckCircle2 } from "lucide-react";
import ApplyButton from "./ApplyButton";

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
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-24 sm:pb-28 relative">
      
      {/* Dark Hero Background matching Home Page */}
      <div className="absolute top-0 left-0 right-0 h-[35vh] sm:h-[45vh] bg-slate-900 z-0 border-b border-slate-800 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 sm:-mr-20 -mt-10 sm:-mt-20 w-64 sm:w-96 h-64 sm:h-96 bg-rose-600/10 blur-[80px] sm:blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-10 sm:-ml-20 -mb-10 sm:-mb-20 w-64 sm:w-96 h-64 sm:h-96 bg-blue-600/10 blur-[80px] sm:blur-[100px] rounded-full pointer-events-none"></div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-12 relative z-10">
        
        {/* Back Navigation */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs sm:text-sm font-bold mb-6 sm:mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          Back to Opportunities
        </Link>

        {/* Main Premium Card */}
        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden mb-8">
          
          {/* Top colored accent line */}
          <div className="h-1.5 sm:h-2 w-full bg-gradient-to-r from-rose-500 to-blue-600"></div>

          <div className="p-5 sm:p-8 md:p-12">
            
            {/* Header Info: Logo & Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6 mb-8 sm:mb-10">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                  {campaign.logo_url ? (
                    <img src={campaign.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1 truncate">
                    {campaign.company_name || "Confidential"}
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {campaign.niche && (
                      <span className="px-2 py-1 sm:px-2.5 sm:py-1 bg-slate-100 text-slate-600 text-[9px] sm:text-[10px] font-bold rounded-md border border-slate-200/50 uppercase tracking-wider truncate max-w-full">
                        {campaign.niche}
                      </span>
                    )}
                    {campaign.sales_type && (
                      <span className="px-2 py-1 sm:px-2.5 sm:py-1 bg-slate-100 text-slate-600 text-[9px] sm:text-[10px] font-bold rounded-md border border-slate-200/50 uppercase tracking-wider truncate max-w-full">
                        {campaign.sales_type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-8 sm:mb-12 tracking-tight leading-tight">
              {campaign.title}
            </h1>

            {/* Divider under title */}
            <div className="w-full h-px bg-slate-100 mb-8 sm:mb-12"></div>

            {/* About the Role */}
            {campaign.description && (
              <div className="mb-8 sm:mb-12">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-4 sm:mb-6 flex items-center gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  About the Role
                </h2>
                <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {campaign.description}
                </div>
              </div>
            )}

            {/* Requirements */}
            {campaign.requirements && (
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-4 sm:mb-6 flex items-center gap-3">
                  <div className="w-7 h-7 sm:w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  Requirements
                </h2>
                <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100">
                  {campaign.requirements}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-end">
          <div className="w-full sm:w-auto">
            <ApplyButton campaignId={campaign.id} />
          </div>
        </div>
      </div>
    </div>
  );
}