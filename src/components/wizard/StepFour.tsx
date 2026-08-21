"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle, FileSignature, CheckCircle2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StepFourProps {
  applicationId?: number | null;
  email?: string;
  firstName?: string;
  lastName?: string;
  onComplete: () => void;
}

export default function StepFour({ 
  applicationId, 
  email, 
  firstName, 
  lastName, 
  onComplete 
}: StepFourProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [docusealUrl, setDocusealUrl] = useState("");
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
          body: JSON.stringify({ applicationId, email, firstName, lastName }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to generate agreement link");
        }

        setDocusealUrl(data.docuseal_url);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchContractUrl();
  }, [applicationId, email, firstName, lastName]);

  const handleOpenDocument = () => {
    setIsOpened(true);
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-slate-200">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Sign the Agreement
        </h2>
        <p className="text-slate-600">
          Please review and sign the cooperation agreement to complete your application.
        </p>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 mb-6 text-red-700 bg-red-50 rounded-xl border border-red-100"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </motion.div>
      )}

      {loading && !docusealUrl ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
          <p className="text-slate-500 font-medium">Preparing your secure document...</p>
        </div>
      ) : docusealUrl ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center p-8 sm:p-12 bg-slate-50 rounded-2xl border border-slate-200 text-center"
        >
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
            <FileSignature className="w-10 h-10" />
          </div>
          
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
            Your Contract is Ready
          </h3>
          
          <p className="text-slate-600 mb-8 max-w-md mx-auto text-sm sm:text-base">
            For security reasons, the document will open in a new secure window. Please review all terms and sign it to proceed.
          </p>
          
          <a 
            href={docusealUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={handleOpenDocument}
            className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 mb-8 text-lg w-full sm:w-auto justify-center"
          >
            Open Document <ExternalLink className="w-5 h-5" />
          </a>

          <AnimatePresence>
            {isOpened && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="w-full"
              >
                <div className="w-full h-px bg-slate-200 mb-6"></div>
                <p className="text-sm text-slate-500 mb-4 font-medium">
                  Have you successfully signed the document?
                </p>
                <button 
                  onClick={onComplete} 
                  className="flex items-center justify-center gap-2 text-slate-700 font-bold bg-white border border-slate-300 px-6 py-3.5 rounded-xl hover:bg-slate-50 transition-colors w-full sm:w-auto mx-auto shadow-sm"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> 
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