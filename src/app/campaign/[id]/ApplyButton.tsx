"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApplyButtonProps {
  campaignId: number;
}

export default function ApplyButton({ campaignId }: ApplyButtonProps) {
  const { status } = useSession();
  const router = useRouter();
  
  const [showModal, setShowModal] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleApplyClick = () => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.push(`/wizard/step-1?campaignId=${campaignId}`);
    } else {
      setShowModal(true);
    }
  };

  const handleConfirmApply = async () => {
    setIsApplying(true);
    setError("");
    
    try {
      const res = await fetch("/api/applications/quick-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaignId })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit application");
      }

      setIsSuccess(true);
      
      setTimeout(() => {
        setShowModal(false);
        router.push("/dashboard/candidate");
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || "An error occurred while applying.");
    } finally {
      setIsApplying(false);
    }
  };

  const modalContent = showModal ? (
    <div className="fixed inset-0 z-[99999] bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 transition-colors duration-300">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl sm:rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border border-slate-200/60 dark:border-slate-800/60 p-6 sm:p-8 animate-in zoom-in-95 duration-200 transition-colors">
        
        {!isSuccess ? (
          <>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-2 transition-colors tracking-tight">Quick Apply</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-6 sm:mb-8 transition-colors leading-relaxed">
              Do you want to submit your application for this position using your current profile details and resume?
            </p>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-bold rounded-xl border border-rose-100 dark:border-rose-500/20 flex items-center gap-2.5 transition-colors shadow-sm animate-in fade-in">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 sm:mt-8">
              <button 
                onClick={() => setShowModal(false)}
                disabled={isApplying}
                className="w-full sm:flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 text-sm sm:text-base active:scale-[0.98] outline-none focus-visible:ring-4 focus-visible:ring-slate-500/20"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmApply}
                disabled={isApplying}
                className="w-full sm:flex-1 py-3.5 bg-blue-600 dark:bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 dark:shadow-blue-900/20 disabled:opacity-70 text-sm sm:text-base active:scale-[0.98] outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40"
              >
                {isApplying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Yes, Submit"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6 animate-in zoom-in shadow-inner ring-4 ring-white dark:ring-slate-900">
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-2 transition-colors">Application Sent!</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors">Redirecting to your dashboard...</p>
          </div>
        )}

      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        onClick={handleApplyClick}
        disabled={status === "loading"}
        className="w-full sm:w-auto bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold py-3.5 sm:py-4 px-8 sm:px-12 rounded-xl transition-all shadow-lg shadow-blue-600/20 dark:shadow-blue-900/20 active:scale-[0.98] text-center disabled:opacity-70 flex items-center justify-center text-sm sm:text-base outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40"
      >
        {status === "loading" ? <Loader2 className="w-5 h-5 animate-spin" /> : "Apply Now"}
      </button>

      {mounted && createPortal(modalContent, document.body)}
    </>
  );
}