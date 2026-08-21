"use client";

import { useState, useEffect } from "react";
import { DocusealForm } from "@docuseal/react";
import { Loader2, AlertCircle } from "lucide-react";
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
          // Backend will auto-resolve applicationId if it's undefined
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
    <div className="w-full max-w-3xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-slate-200">
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
          className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 min-h-[600px]"
        >
          <DocusealForm
            host={new URL(docusealUrl).host}
            src={docusealUrl}
            email={email || ""}
            onComplete={onComplete}
          />
        </motion.div>
      ) : null}
    </div>
  );
}