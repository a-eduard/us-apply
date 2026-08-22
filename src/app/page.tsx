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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans transition-colors duration-300 flex flex-col w-full overflow-x-hidden">
      
      {/* HERO SECTION - Compacted & Premium */}
      <section className="bg-slate-900 dark:bg-slate-950 relative overflow-hidden py-16 sm:py-20 md:py-24 border-b border-slate-800 dark:border-slate-800/50 transition-colors duration-300 w-full">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 sm:w-80 h-64 sm:h-80 bg-rose-600/15 blur-[80px] sm:blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 sm:w-80 h-64 sm:h-80 bg-blue-600/15 blur-[80px] sm:blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-4 sm:mb-6 leading-[1.1]">
            Prove You Can Sell. <br className="hidden sm:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-blue-400">
              Land Top Offers.
            </span>
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg text-slate-400 dark:text-slate-500 max-w-xl mx-auto font-medium leading-relaxed px-2 sm:px-0">
            Exclusive roles for elite closers. No endless resumes. Submit your video pitch and let your closing skills do the talking.
          </p>
        </div>
      </section>

      {/* CAMPAIGNS GRID */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 pb-20 sm:pb-24 w-full">
        {campaigns.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
            {campaigns.map((campaign) => {
              return (
                <Link
                  href={`/campaign/${campaign.id}`}
                  key={campaign.id}
                  className="group relative bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-2xl dark:hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] hover:-translate-y-1 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 flex flex-col overflow-hidden h-full"
                >
                  <div className="h-1.5 sm:h-2 w-full bg-slate-100 dark:bg-slate-800 group-hover:bg-rose-600 dark:group-hover:bg-rose-500 transition-colors shrink-0"></div>

                  <div className="p-6 sm:p-8 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-5 sm:mb-6">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden shadow-sm transition-colors">
                        {campaign.logo_url ? (
                          <img src={campaign.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-slate-400 dark:text-slate-500" />
                        )}
                      </div>
                    </div>

                    <div className="text-[10px] sm:text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 sm:mb-2 transition-colors">
                      {campaign.company_name || "Confidential"}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-3 sm:mb-4 leading-tight group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                      {campaign.title}
                    </h3>

                    <div className="flex flex-wrap gap-2 mb-5 sm:mb-6">
                      {campaign.niche && (
                        <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] sm:text-xs font-bold rounded-lg border border-slate-200/50 dark:border-slate-700/50 transition-colors">
                          {campaign.niche}
                        </span>
                      )}
                      {campaign.sales_type && (
                        <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] sm:text-xs font-bold rounded-lg border border-slate-200/50 dark:border-slate-700/50 transition-colors">
                          {campaign.sales_type}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto">
                      {campaign.short_description ? (
                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed transition-colors">
                          {campaign.short_description}
                        </p>
                      ) : (
                        <p className="text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-500 italic transition-colors">
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
          <div className="text-center py-16 sm:py-24 px-4 bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
            <ShieldCheck className="w-16 h-16 sm:w-20 sm:h-20 text-slate-200 dark:text-slate-700 mx-auto mb-4 sm:mb-6 transition-colors" />
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3 sm:mb-4 transition-colors">No Active Roles</h3>
            <p className="text-sm sm:text-lg text-slate-500 dark:text-slate-400 max-w-md mx-auto font-medium transition-colors">We are currently vetting new partner companies. Check back soon for exclusive opportunities.</p>
          </div>
        )}
      </section>
    </div>
  );
}