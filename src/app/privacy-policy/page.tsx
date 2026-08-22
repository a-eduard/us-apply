import Link from "next/link";
import { ChevronLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-8">
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 sm:p-12 shadow-sm border border-slate-200/60 dark:border-slate-800 transition-colors duration-300">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-6">
            <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-extrabold mb-8 tracking-tight">Privacy Policy</h1>
          
          <div className="space-y-6 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>Last updated: August 2026</p>
            
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">1. Information We Collect</h2>
            <p>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us.</p>
            
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">2. How We Use Information</h2>
            <p>We may use the information we collect about you to provide, maintain, and improve our services, including, for example, to facilitate payments, send receipts, provide products and services you request, and develop new features.</p>
            
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">3. Data Security</h2>
            <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>
            
            {/* Add actual legal copy here later */}
            <div className="mt-12 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
              Note: This is a template. Please replace with your official legal text.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}