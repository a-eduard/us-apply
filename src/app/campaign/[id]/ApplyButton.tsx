"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

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

  // The modal content
  const modalContent = showModal ? (
    <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200">
        
        {!isSuccess ? (
          <>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Quick Apply</h3>
            <p className="text-slate-500 font-medium text-sm mb-6">
              Do you want to submit your application for this position using your current profile details and resume?
            </p>

            {error && (
              <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setShowModal(false)}
                disabled={isApplying}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmApply}
                disabled={isApplying}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-70"
              >
                {isApplying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Yes, Submit"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Application Sent!</h3>
            <p className="text-slate-500 font-medium">Redirecting to your dashboard...</p>
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
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-10 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] text-center disabled:opacity-70 flex items-center justify-center"
      >
        {status === "loading" ? <Loader2 className="w-5 h-5 animate-spin" /> : "Apply Now"}
      </button>

      {/* Render modal directly into the body using Portal */}
      {mounted && createPortal(modalContent, document.body)}
    </>
  );
}