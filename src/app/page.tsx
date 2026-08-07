export const dynamic = "force-dynamic"; // <--- ОТКЛЮЧАЕТ КЭШ, ДАННЫЕ БУДУТ ВСЕГДА СВЕЖИМИ

import Link from "next/link";
import { Building2, ShieldCheck } from "lucide-react";
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
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-rose-600/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6">
            Prove You Can Sell. <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-blue-400">
              Land Top Offers.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium">
            Exclusive roles for elite closers. No endless resumes. Submit your video pitch and let your closing skills do the talking.
          </p>
        </div>
      </section>

      {/* CAMPAIGNS GRID */}
      <section className="max-w-6xl mx-auto px-6 py-20 pb-32">
        {campaigns.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {campaigns.map((campaign) => {
              return (
                <Link
                  href={`/campaign/${campaign.id}`}
                  key={campaign.id}
                  className="group relative bg-white rounded-3xl border border-slate-200 hover:border-slate-400 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden h-full"
                >
                  <div className="h-2 w-full bg-slate-100 group-hover:bg-rose-600 transition-colors shrink-0"></div>

                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
                        {campaign.logo_url ? (
                          <img src={campaign.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-7 h-7 text-slate-400" />
                        )}
                      </div>
                    </div>

                    <div className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2">
                      {campaign.company_name || "Confidential"}
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-900 mb-4 leading-tight group-hover:text-rose-600 transition-colors">
                      {campaign.title}
                    </h3>

                    <div className="flex flex-wrap gap-2 mb-6">
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

                    <div className="mt-auto">
                      {campaign.short_description ? (
                        <p className="text-sm font-medium text-slate-500 line-clamp-3 leading-relaxed">
                          {campaign.short_description}
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-slate-400 italic">
                          Click to view details...
                        </p>
                      )}
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
            <p className="text-slate-500 max-w-md mx-auto font-medium text-lg">We are currently vetting new partner companies. Check back soon for exclusive opportunities.</p>
          </div>
        )}
      </section>
    </div>
  );
}