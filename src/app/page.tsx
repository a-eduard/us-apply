import Link from "next/link";
import { Building2, Flame, Video, ArrowRight, ShieldCheck, Target } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  let campaigns: any[] = [];

  try {
    campaigns = await prisma.campaigns.findMany({
      where: {
        status: "Active"
      },
      orderBy: { created_at: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch campaigns for HomePage:", error);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      
      {/* HERO SECTION (Dark, Aggressive, Premium US Style) */}
      <section className="bg-slate-900 relative overflow-hidden py-24 sm:py-32 border-b border-slate-800">
        {/* Subtle glow effects */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-rose-600/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-bold mb-8 uppercase tracking-widest shadow-xl">
            <ShieldCheck className="w-4 h-4 text-rose-500" />
            Vetted US Opportunities
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6">
            Prove You Can Sell. <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-blue-400">
              Land Top Offers.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-16 font-medium">
            Exclusive high-ticket roles for elite closers. No endless resumes. Submit your video pitch and let your closing skills do the talking.
          </p>

          {/* Stats Bar */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 max-w-4xl mx-auto bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <span className="text-3xl md:text-4xl font-extrabold text-white">$120k+</span>
              <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Average OTE</span>
            </div>
            <div className="w-px bg-white/10 hidden sm:block"></div>
            <div className="flex flex-col items-center">
              <span className="text-3xl md:text-4xl font-extrabold text-white">Top 5%</span>
              <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Acceptance Rate</span>
            </div>
            <div className="w-px bg-white/10 hidden sm:block"></div>
            <div className="flex flex-col items-center">
              <span className="text-3xl md:text-4xl font-extrabold text-white">100%</span>
              <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Video Pitch Based</span>
            </div>
          </div>
        </div>
      </section>

      {/* CAMPAIGNS GRID */}
      <section className="max-w-6xl mx-auto px-6 py-20 pb-32">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Active Opportunities</h2>
          <span className="text-sm font-bold text-slate-500 bg-slate-200/50 px-4 py-2 rounded-xl border border-slate-200">
            {campaigns.length} Roles Available
          </span>
        </div>

        {campaigns.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {campaigns.map((campaign) => {
              // Просто парсим цифры из OTE, чтобы понять, вешать ли плашку "High-Ticket"
              const oteNumber = parseInt(campaign.ote?.replace(/\D/g, '') || '0');
              const isHighTicket = oteNumber >= 100000;

              return (
                <Link
                  href={`/campaign/${campaign.id}`}
                  key={campaign.id}
                  className="group relative bg-white rounded-3xl border border-slate-200 hover:border-slate-400 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
                >
                  {/* Top colored accent line */}
                  <div className="h-2 w-full bg-slate-100 group-hover:bg-rose-600 transition-colors"></div>

                  <div className="p-8 flex-1 flex flex-col">
                    {/* Header: Logo & Badges */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
                        {campaign.logo_url ? (
                          <img src={campaign.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-7 h-7 text-slate-400" />
                        )}
                      </div>
                      
                      {/* Hot Badge (Auto-calculates based on OTE > 100k) */}
                      {isHighTicket && (
                        <div className="flex items-center gap-1 bg-rose-50 text-rose-600 px-3 py-1.5 rounded-full text-xs font-extrabold border border-rose-100 shadow-sm">
                          <Flame className="w-4 h-4" /> HIGH-TICKET
                        </div>
                      )}
                    </div>

                    {/* Company & Title */}
                    <div className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2">
                      {campaign.company_name || "Confidential"}
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-900 mb-6 leading-tight group-hover:text-rose-600 transition-colors">
                      {campaign.title}
                    </h3>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-8">
                      {campaign.niche && (
                        <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200/50">
                          {campaign.niche}
                        </span>
                      )}
                      {campaign.sales_type && (
                        <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200/50">
                          {campaign.sales_type}
                        </span>
                      )}
                    </div>

                    {/* BIG OTE Display */}
                    <div className="mt-auto mb-8 bg-slate-50 rounded-2xl p-5 border border-slate-100">
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" /> On-Target Earnings
                      </div>
                      <div className="text-3xl font-black text-slate-900 tracking-tight">
                        {campaign.ote || "Competitive"}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Video className="w-4 h-4 text-slate-400" /> Video Pitch Req.
                      </div>
                      <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:bg-rose-600 transition-colors shadow-lg group-hover:shadow-rose-600/25">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-200 shadow-sm">
            <ShieldCheck className="w-20 h-20 text-slate-200 mx-auto mb-6" />
            <h3 className="text-3xl font-extrabold text-slate-900 mb-4">No Active Roles</h3>
            <p className="text-slate-500 max-w-md mx-auto font-medium text-lg">We are currently vetting new partner companies. Check back soon for exclusive high-ticket opportunities.</p>
          </div>
        )}
      </section>
    </div>
  );
}