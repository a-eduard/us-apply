import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Building2, DollarSign, Target, Percent, Flame, ArrowLeft, CheckCircle2 } from "lucide-react";
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

  // Логика бейджа High-Ticket
  const oteNumber = parseInt(campaign.ote?.replace(/\D/g, '') || '0');
  const isHighTicket = oteNumber >= 100000;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-28 relative">
      
      {/* Dark Hero Background matching Home Page */}
      <div className="absolute top-0 left-0 right-0 h-[45vh] bg-slate-900 z-0 border-b border-slate-800 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-rose-600/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 relative z-10">
        
        {/* Back Navigation */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          Back to Opportunities
        </Link>

        {/* Main Premium Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden mb-8">
          
          {/* Top colored accent line */}
          <div className="h-2 w-full bg-gradient-to-r from-rose-500 to-blue-600"></div>

          <div className="p-8 sm:p-12">
            
            {/* Header Info: Logo & Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                  {campaign.logo_url ? (
                    <img src={campaign.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-7 h-7 text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                    {campaign.company_name || "Confidential"}
                  </div>
                  <div className="flex gap-2">
                    {campaign.niche && (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md border border-slate-200/50 uppercase tracking-wider">
                        {campaign.niche}
                      </span>
                    )}
                    {campaign.sales_type && (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md border border-slate-200/50 uppercase tracking-wider">
                        {campaign.sales_type}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isHighTicket && (
                <div className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-sm font-extrabold border border-rose-100 shadow-sm shrink-0">
                  <Flame className="w-5 h-5" /> HIGH-TICKET ROLE
                </div>
              )}
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-12 tracking-tight leading-tight">
              {campaign.title}
            </h1>
            
            {/* Numbers Grid - Premium Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
              
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-center relative overflow-hidden group hover:border-slate-300 transition-colors">
                <div className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Base Salary
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">
                  {campaign.base_salary || "N/A"}
                </div>
              </div>
              
              {/* OTE receives a special highlight (Sales people care about this the most) */}
              <div className="bg-rose-50/50 rounded-3xl p-6 border border-rose-100 flex flex-col justify-center relative overflow-hidden group hover:border-rose-200 transition-colors">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl"></div>
                <div className="text-xs font-extrabold text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-2 relative z-10">
                  <Target className="w-4 h-4" /> On-Target Earnings
                </div>
                <div className="text-3xl sm:text-4xl font-black text-rose-700 relative z-10 tracking-tight">
                  {campaign.ote || "N/A"}
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-center relative overflow-hidden group hover:border-slate-300 transition-colors">
                <div className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Percent className="w-4 h-4" /> Commission
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">
                  {campaign.commission || "N/A"}
                </div>
              </div>

            </div>

            <div className="w-full h-px bg-slate-100 mb-12"></div>

            {/* About the Role */}
            {campaign.description && (
              <div className="mb-12">
                <h2 className="text-2xl font-extrabold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  About the Role
                </h2>
                <div className="prose prose-slate prose-lg max-w-none text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {campaign.description}
                </div>
              </div>
            )}

            {/* Requirements */}
            {campaign.requirements && (
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  Requirements
                </h2>
                <div className="prose prose-slate prose-lg max-w-none text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-8 rounded-3xl border border-slate-100">
                  {campaign.requirements}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="hidden sm:block">
            <div className="text-base font-extrabold text-slate-900">{campaign.title}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {campaign.company_name || "Confidential"}
            </div>
          </div>
          
          <ApplyButton campaignId={campaign.id} />
          
        </div>
      </div>
    </div>
  );
}