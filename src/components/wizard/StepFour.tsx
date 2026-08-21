"use client";

import { useState, useEffect } from "react";
import { DocusealForm } from "@docuseal/react";
import { Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

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

  return (
    <div className="w-full max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-slate-200">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Sign the Agreement
        </h2>
        <p className="text-slate-600">
          Please review and sign the cooperation agreement below to complete your application.
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
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
          <p className="text-slate-500 font-medium">Preparing your document...</p>
        </div>
      ) : docusealUrl ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-6"
        >
          {/* Fallback button to bypass iframe blocks completely */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-blue-800 font-medium">
              Having trouble viewing the document below? 
            </div>
            <a 
              href={docusealUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors whitespace-nowrap text-sm"
            >
              Open in New Tab <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 min-h-[600px] relative">
            <DocusealForm
              host={docusealUrl ? new URL(docusealUrl).host : undefined}
              src={docusealUrl}
              email={""} 
              onComplete={onComplete}
            />
          </div>
          
          <div className="text-center mt-4">
            <button 
              onClick={onComplete}
              className="text-sm text-slate-500 hover:text-slate-700 font-medium underline"
            >
              I have already signed the agreement
            </button>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}