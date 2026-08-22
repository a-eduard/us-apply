import Link from "next/link";
import { ChevronLeft, FileText } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-8">
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 sm:p-12 shadow-sm border border-slate-200/60 dark:border-slate-800 transition-colors duration-300">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center mb-6">
            <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-3xl font-extrabold mb-8 tracking-tight">Terms of Service</h1>
          
          <div className="space-y-6 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>Last updated: August 2026</p>
            
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>By accessing and using the USclosers platform, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>
            
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">2. Description of Service</h2>
            <p>USclosers provides a platform connecting elite sales professionals with top-tier companies. We reserve the right to modify or discontinue, temporarily or permanently, the Service with or without notice.</p>
            
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">3. User Conduct</h2>
            <p>You agree to use the Service only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the Service.</p>
            
            <div className="mt-12 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
              Note: This is a template. Please replace with your official legal text.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}