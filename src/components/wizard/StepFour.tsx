"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle, FileSignature, CheckCircle2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StepFourProps {
  email?: string;
  firstName?: string;
  lastName?: string;
  onComplete: (submissionId: string) => void;
}

export default function StepFour({ 
  email, 
  firstName, 
  lastName, 
  onComplete 
}: StepFourProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [docusealUrl, setDocusealUrl] = useState("");
  const [submissionId, setSubmissionId] = useState("");
  const [isOpened, setIsOpened] = useState(false);

  useEffect(() => {
    const fetchContractUrl = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/docuseal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, firstName, lastName }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to generate agreement link");
        }

        setDocusealUrl(data.docuseal_url);
        setSubmissionId(data.submission_id);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchContractUrl();
  }, [email, firstName, lastName]);

  const handleOpenDocument = () => {
    setIsOpened(true);
  };

  return (
    <div className="w-full max-w-[480px] sm:max-w-2xl mx-auto bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm sm:shadow-md border border-slate-200/60 dark:border-slate-800 transition-colors duration-300 mt-2 sm:mt-4 relative overflow-hidden">
      
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight transition-colors">
          Sign the Agreement
        </h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 transition-colors">
          Please review and sign the cooperation agreement to complete your application.
        </p>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 mb-6 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-100 dark:border-rose-500/20 shadow-sm transition-colors"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs sm:text-sm font-bold">{error}</p>
        </motion.div>
      )}

      {loading && !docusealUrl ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-blue-600 dark:text-blue-500 relative z-10 mb-4 transition-colors" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 font-bold text-sm sm:text-base transition-colors">Preparing your secure document...</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm mt-1.5 transition-colors">This will only take a moment</p>
        </div>
      ) : docusealUrl ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center p-6 sm:p-10 bg-slate-50 dark:bg-slate-950/50 rounded-2xl sm:rounded-[2rem] border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden transition-colors"
        >
          {/* Decorative background blur */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4 sm:mb-5 shadow-inner ring-4 ring-white dark:ring-slate-900 relative z-10 transition-colors">
            <FileSignature className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 relative z-10 transition-colors">
            Your Contract is Ready
          </h3>
          
          <p className="text-slate-600 dark:text-slate-400 mb-6 sm:mb-8 max-w-sm mx-auto text-xs sm:text-sm relative z-10 leading-relaxed transition-colors">
            For security reasons, the document will open in a new secure window. Please review all terms and sign it to proceed.
          </p>
          
          <a 
            href={docusealUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={handleOpenDocument}
            className="flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-500 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-lg shadow-blue-600/20 dark:shadow-blue-900/20 hover:shadow-xl active:scale-[0.98] mb-6 text-sm sm:text-base w-full sm:w-auto relative z-10 outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40"
          >
            Open Document <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 ml-1" />
          </a>

          <AnimatePresence>
            {isOpened && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: 10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                className="w-full relative z-10"
              >
                <div className="w-full h-px bg-slate-200 dark:bg-slate-800 mb-5 transition-colors"></div>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-3 sm:mb-4 font-bold uppercase tracking-wide transition-colors">
                  Have you successfully signed the document?
                </p>
                <button 
                  onClick={() => onComplete(submissionId)} 
                  className="flex items-center justify-center gap-2 text-slate-700 dark:text-slate-200 font-bold bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all w-full sm:w-auto mx-auto shadow-sm active:scale-[0.98] hover:border-emerald-500/50 dark:hover:border-emerald-500/50 group text-sm sm:text-base outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform" /> 
                  Yes, I have signed it
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ) : null}
    </div>
  );
}