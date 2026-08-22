"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function RegisterRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // If campaignId parameter exists, pass it along.
    // Otherwise it's a general registration. Always redirect to Wizard.
    const campaignId = searchParams.get("campaignId");
    const query = campaignId ? `?campaignId=${campaignId}` : "";
    
    router.replace(`/wizard/step-1${query}`);
  }, [router, searchParams]);

  return null;
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="flex flex-col items-center gap-5">
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800 transition-colors duration-300">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-600 dark:text-blue-500" />
        </div>
        <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 animate-pulse tracking-wide transition-colors">
          Setting up your registration...
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RegisterRedirect />
    </Suspense>
  );
}