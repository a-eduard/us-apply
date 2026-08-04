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
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-bold text-slate-500 animate-pulse">
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
      <LoadingFallback />
    </Suspense>
  );
}