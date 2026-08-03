"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Lock, Check } from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { cn } from "@/lib/utils";

import StepOne from "@/components/wizard/StepOne";
import StepTwo from "@/components/wizard/StepTwo";
import StepThree from "@/components/wizard/StepThree";

const STEPS = ["Basic Info", "Experience", "Video Pitch"];

interface WizardClientProps {
  initialStep: number;
}

export default function WizardClient({ initialStep }: WizardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepRef = useRef<any>(null);
  
  const { data: session, status } = useSession();

  const [step, setStep] = useState(initialStep);
  const [maxReachedStep, setMaxReachedStep] = useState(initialStep);
  const [shake, setShake] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  
  const { width, height } = useWindowSize();
  const campaignId = searchParams.get("campaignId") || "";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    yearsOfExperience: "",
    niches: [] as string[],
    linkedinUrl: "",
    videoPitchUrl: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      const returnUrl = `/wizard/step-1?campaignId=${campaignId}`;
      router.push(`/register?callbackUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [status, campaignId, router]);

  useEffect(() => {
    setMaxReachedStep((prev) => Math.max(prev, step));
  }, [step]);

  useEffect(() => {
    const fetchDraft = async () => {
      if (status === "authenticated" && campaignId) {
        try {
          const res = await fetch(`/api/applications/draft?campaignId=${campaignId}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.draft_data) {
              setFormData((prev) => ({
                ...prev,
                ...data.draft_data,
                city: data.city || prev.city,
                state: data.state || prev.state,
              }));
            }
          }
        } catch (error) {
          console.error("Failed to load draft:", error);
        } finally {
          setIsDraftLoaded(true);
        }
      }
    };

    if (status === "authenticated") {
      fetchDraft();
    }
  }, [status, campaignId]);

  const handleNext = () => {
    const nextStep = Math.min(step + 1, STEPS.length - 1);
    router.push(`/wizard/step-${nextStep + 1}?campaignId=${campaignId}`);
  };

  const handleFormDataChange = (data: any) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleSubmit = async (finalData: any = formData) => {
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaign_id: campaignId ? parseInt(campaignId, 10) : undefined,
          application_data: finalData
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit application');
      }

      setShowSuccess(true);
    } catch (error) {
      console.error("Submission error:", error);
      alert("Something went wrong during submission. Please try again.");
    }
  };

  if (status === "loading" || status === "unauthenticated" || (!isDraftLoaded && status === "authenticated")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <Confetti width={width} height={height} recycle={false} numberOfPieces={500} gravity={0.1} />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-3xl max-w-md w-full shadow-2xl relative z-10"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Application Submitted!</h2>
          <p className="text-slate-600 mb-8 text-lg">Your application has been successfully sent to the employer for this position.</p>
          <button 
            onClick={() => router.push('/dashboard/candidate')}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
          >
            Go to My Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* Navbar with Correct Logo */}
      <nav className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0 shadow-sm relative z-50">
        <div 
          className="flex items-center gap-2 cursor-pointer group" 
          onClick={() => router.push('/')}
        >
          <img src="/usc_logo.png" alt="USclosers Logo" className="h-8 group-hover:opacity-80 transition-opacity shrink-0" />
          <span className="text-xl font-extrabold text-slate-800 tracking-tight group-hover:opacity-80 transition-opacity hidden sm:block">
            USclosers
          </span>
        </div>
      </nav>

      {/* Stepper Header */}
      <div className="bg-white px-4 sm:px-12 py-6 flex justify-center shrink-0 shadow-sm z-10 relative">
        <div className="flex items-center w-full max-w-3xl justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 z-0"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-600 z-0 transition-all duration-500 ease-in-out"
            style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
          ></div>

          {STEPS.map((s, i) => {
            const isCompleted = maxReachedStep > i || step > i;
            const isActive = step === i;
            const isLocked = i > maxReachedStep;
            
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (i === step || isLocked) {
                    if (isLocked) {
                      setShake(true);
                      setTimeout(() => setShake(false), 500);
                    }
                    return;
                  }
                  router.push(`/wizard/step-${i + 1}?campaignId=${campaignId}`);
                }}
                className={cn(
                  "flex items-center gap-2.5 focus:outline-none bg-white z-10 px-2", 
                  !isLocked ? "cursor-pointer hover:opacity-80 transition-opacity" : "cursor-not-allowed"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-full text-xs flex items-center justify-center font-bold shrink-0 transition-colors shadow-sm",
                  isCompleted && !isActive ? "bg-emerald-500 text-white border border-emerald-500" : 
                  isActive ? "bg-blue-600 text-white border border-blue-600" : 
                  "bg-white border-2 border-slate-200 text-slate-400"
                )}>
                  {isCompleted && !isActive ? <Check className="w-4 h-4 stroke-[3]" /> : i + 1}
                </div>
                <span className={cn(
                  "hidden sm:flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest whitespace-nowrap transition-colors",
                  isActive ? "text-blue-600" : 
                  isCompleted ? "text-slate-900" : "text-slate-400"
                )}>
                  {s}
                  {isLocked && <Lock className="w-3.5 h-3.5 text-slate-300" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-grow flex flex-col p-4 sm:p-10 overflow-y-auto w-full max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className={cn("w-full", shake && "animate-shake")}
          >
            {step === 0 && (
              <StepOne 
                ref={stepRef} 
                defaultValues={formData} 
                onNext={handleNext}
                onChange={handleFormDataChange}
                campaignId={campaignId}
              />
            )}
            {step === 1 && (
              <StepTwo 
                ref={stepRef} 
                defaultValues={formData} 
                onNext={handleNext}
                campaignId={campaignId}
                onChange={handleFormDataChange}
              />
            )}
            {step === 2 && (
              <StepThree 
                ref={stepRef} 
                defaultValues={formData} 
                onNext={(data: any) => {
                  handleFormDataChange(data);
                  handleSubmit({ ...formData, ...data });
                }}
                campaignId={campaignId}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}