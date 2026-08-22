import Link from "next/link";
import { ChevronLeft, FileText } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors duration-300 flex flex-col">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 relative z-10 flex-1 flex flex-col">
        
        {/* Back Navigation */}
        <div className="mb-6 sm:mb-10">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-sm text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 transition-all active:scale-95 group outline-none focus-visible:ring-4 focus-visible:ring-slate-500/20"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Home
          </Link>
        </div>
        
        {/* Main Content Card */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 lg:p-16 shadow-xl border border-slate-200/60 dark:border-slate-800/60 transition-colors duration-300 flex-1">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-10 sm:mb-14 border-b border-slate-100 dark:border-slate-800/60 pb-8 sm:pb-10">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-500/20 shadow-inner">
              <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-2 sm:mb-3 transition-colors">
                Terms of Service
              </h1>
              <p className="text-xs sm:text-sm font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-widest transition-colors">
                Last updated: August 2026
              </p>
            </div>
          </div>
          
          {/* Content Body */}
          <div className="space-y-8 sm:space-y-10 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">
            
            <section>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-3 sm:mb-4 tracking-tight transition-colors">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing and using the USclosers platform, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-3 sm:mb-4 tracking-tight transition-colors">
                2. Description of Service
              </h2>
              <p>
                USclosers provides a platform connecting elite sales professionals with top-tier companies. We reserve the right to modify or discontinue, temporarily or permanently, the Service with or without notice.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-3 sm:mb-4 tracking-tight transition-colors">
                3. User Conduct
              </h2>
              <p>
                You agree to use the Service only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the Service.
              </p>
            </section>

          </div>
        </div>

        {/* Simple Footer */}
        <div className="mt-8 text-center text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-600 transition-colors">
          &copy; {new Date().getFullYear()} USclosers. All rights reserved.
        </div>
      </div>
    </div>
  );
}