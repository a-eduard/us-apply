import Link from "next/link";
import { Building2 } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  // Fetching active campaigns
  const campaigns = await prisma.campaigns.findMany({
    where: {
      status: "Active"
    },
    orderBy: { created_at: "desc" },
    take: 6, // Increased to 6 so you can see all your new campaigns
  });

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-20">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
          Find Your Next <span className="text-emerald-600">Sales Role</span>
        </h1>
        <p className="text-lg text-slate-600">
          Browse top opportunities from vetted companies looking for exceptional sales talent.
        </p>
      </div>

      {/* Campaigns Grid */}
      {campaigns.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <Link 
              href={`/campaign/${campaign.id}`} 
              key={campaign.id}
              className="bg-white rounded-2xl border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group"
            >
              {/* Top Banner */}
              <div className="h-24 bg-emerald-100/50 relative">
                {/* Logo overlapping the banner */}
                <div className="absolute -bottom-6 left-6 w-12 h-12 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 overflow-hidden">
                  {campaign.logo_url ? (
                    <img src={campaign.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-6 h-6" />
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="px-6 pt-10 pb-6 flex-1 flex flex-col">
                <div className="text-xs font-bold text-emerald-600 mb-1 uppercase tracking-wider">
                  {campaign.company_name || "Confidential"}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4 line-clamp-2">
                  {campaign.title}
                </h3>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {campaign.niche ? (
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md">
                      {campaign.niche}
                    </span>
                  ) : null}
                  {campaign.sales_type ? (
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md">
                      {campaign.sales_type}
                    </span>
                  ) : null}
                </div>

                {/* Footer */}
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">
                    {campaign.ote ? `${campaign.ote} OTE` : "Competitive OTE"}
                  </span>
                  <span className="text-sm font-bold text-emerald-600 group-hover:text-emerald-700 transition-colors">
                    View details
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
          <p className="text-slate-500">No campaigns available at the moment. Check back later!</p>
        </div>
      )}
    </div>
  );
}