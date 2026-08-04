"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Если есть параметр campaignId, прокидываем его дальше. 
    // Если нет - это "Общая регистрация". В любом случае отправляем в Визард.
    const campaignId = searchParams.get("campaignId");
    const query = campaignId ? `?campaignId=${campaignId}` : "";
    
    router.replace(`/wizard/step-1${query}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-bold text-slate-500 animate-pulse">Setting up your registration...</p>
      </div>
    </div>
  );
}