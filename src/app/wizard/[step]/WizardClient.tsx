"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Lock, Check, Moon, Sun, FileSignature, AlertTriangle } from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { useTheme } from "next-themes";
import Link from "next/link";
import { cn } from "@/lib/utils";

import StepOne from "@/components/wizard/StepOne";
import StepTwo from "@/components/wizard/StepTwo";
import StepThree from "@/components/wizard/StepThree";
import StepFour from "@/components/wizard/StepFour"; 

const STEPS = ["Basic Info", "Experience", "Video Pitch", "Contract"];

interface WizardClientProps {
  initialStep: number;
}

export default function WizardClient({ initialStep }: WizardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepRef = useRef<any>(null);
  
  const { theme, setTheme } = useTheme();

  const [step, setStep] = useState(initialStep);
  const [maxReachedStep, setMaxReachedStep] = useState(initialStep);
  const [shake, setShake] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [finalSubmitError, setFinalSubmitError] = useState<string | null>(null);
  
  const { width, height } = useWindowSize();
  
  const campaignId = searchParams.get("campaignId") || "";

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (campaignId) params.append("campaignId", campaignId);
    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  };

  // Initialize state from sessionStorage to prevent data loss on refresh
  const [formData, setFormData] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("wizard_data");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      city: "",
      country: "",
      yearsOfExperience: "",
      niches: [] as string[],
      linkedinUrl: "",
      videoPitchUrl: "",
      avatarUrl: "",
      resumeUrl: "",
    };
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Save to sessionStorage whenever formData changes
  useEffect(() => {
    if (mounted) {
      sessionStorage.setItem("wizard_data", JSON.stringify(formData));
    }
  }, [formData, mounted]);

  useEffect(() => {
    setMaxReachedStep((prev) => Math.max(prev, step));
  }, [step]);

  const handleNext = () => {
    const nextStep = Math.min(step + 1, STEPS.length - 1);
    router.push(`/wizard/step-${nextStep + 1}${buildQueryString()}`);
  };

  const handleFormDataChange = (data: any) => {
    setFormData((prev: any) => ({ ...prev, ...data }));
  };

  // 🚀 The Climax: Final API call to create User, Application, and Auto-Login
  const handleFinalSubmit = async (docusealSubmissionId: string) => {
    setIsSubmittingFinal(true);
    setFinalSubmitError(null);

    try {
      const res = await fetch('/api/wizard/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          campaignId: campaignId ? parseInt(campaignId, 10) : undefined,
          docusealSubmissionId
        }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to complete registration');
      }

      // Auto login user after successful creation
      const signInRes = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (signInRes?.error) {
        console.warn("Auto-login failed:", signInRes.error);
        // We still show success, but user might need to log in manually later
      }

      // Clear session storage
      sessionStorage.removeItem("wizard_data");
      setShowSuccess(true);
      
    } catch (error: any) {
      console.error("Final submission error:", error);
      setFinalSubmitError(error.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmittingFinal(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-center relative overflow-hidden transition-colors duration-300">
        <Confetti width={width} height={height} recycle={false} numberOfPieces={500} gravity={0.15} />
        
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-8 sm:p-12 rounded-3xl max-w-md w-full shadow-2xl dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative z-10 mx-4 border border-slate-200/60 dark:border-slate-800/60 transition-colors"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-white dark:ring-slate-900">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3 sm:mb-4 tracking-tight transition-colors">
            Application Submitted!
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-8 sm:mb-10 font-medium transition-colors">
            Your account has been created and your application is successfully processed. We will be in touch soon.
          </p>
          <button 
            onClick={() => router.push('/dashboard/candidate')}
            className="w-full bg-blue-600 dark:bg-blue-500 text-white font-bold py-3.5 sm:py-4 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-lg shadow-blue-600/30 dark:shadow-blue-900/30 active:scale-[0.98] outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40 text-sm sm:text-base"
          >
            Go to My Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-300">
      
      {/* Loading Overlay during Final Submission */}
      <AnimatePresence>
        {isSubmittingFinal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex flex-col items-center justify-center"
          >
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-white font-bold text-lg tracking-wide animate-pulse">Finalizing your application...</p>
            <p className="text-slate-300 text-sm mt-2">Setting up your account securely.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 px-4 sm:px-6 md:px-8 flex items-center justify-between shrink-0 shadow-sm relative z-50 transition-colors duration-300">
        <Link 
          href="/"
          className="flex items-center gap-2 cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-0.5" 
        >
          <img src="/usc_logo.png" alt="USclosers Logo" className="h-6 sm:h-7 md:h-8 group-hover:opacity-80 transition-opacity shrink-0" />
          <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight group-hover:opacity-80 transition-opacity hidden sm:block">
            USclosers
          </span>
        </Link>

        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98] shrink-0"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        )}
      </nav>

      {/* Progress Bar Container */}
      <div className="bg-white/60 dark:bg-slate-950/60 backdrop-blur-md px-4 sm:px-8 py-5 sm:py-8 flex flex-col items-center shrink-0 border-b border-slate-200/60 dark:border-slate-800/60 z-10 sticky top-0 transition-colors duration-300">
        <div className="flex items-center w-full max-w-2xl justify-between relative px-2 sm:px-4">
          <div className="absolute left-6 right-6 sm:left-10 sm:right-10 top-1/2 -translate-y-1/2 h-1 rounded-full bg-slate-200 dark:bg-slate-800 z-0 transition-colors"></div>
          <div 
            className="absolute left-6 sm:left-10 top-1/2 -translate-y-1/2 h-1 rounded-full bg-blue-600 dark:bg-blue-500 z-0 transition-all duration-500 ease-in-out"
            style={{ width: `calc(${(step / (STEPS.length - 1)) * 100}% - ${step === 0 ? '0px' : step === STEPS.length - 1 ? '48px' : '24px'})` }}
          ></div>

          {STEPS.map((s, i) => {
            const isCompleted = maxReachedStep > i || step > i;
            const isActive = step === i;
            const isFutureLocked = i > maxReachedStep;
            const isClickable = !isFutureLocked && !isActive;
            
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (isActive) return;
                  if (isFutureLocked) {
                    setShake(true);
                    setTimeout(() => setShake(false), 500);
                    return;
                  }
                  router.push(`/wizard/step-${i + 1}${buildQueryString()}`);
                }}
                className={cn(
                  "relative flex flex-col items-center justify-center focus:outline-none z-10 group outline-none", 
                  isClickable ? "cursor-pointer hover:opacity-80 transition-opacity active:scale-95" : (isFutureLocked ? "cursor-not-allowed" : "cursor-default")
                )}
              >
                <div className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm flex items-center justify-center font-bold shrink-0 transition-all shadow-sm ring-4 ring-white/60 dark:ring-slate-950/60 z-10 group-focus-visible:ring-blue-300 dark:group-focus-visible:ring-blue-900/50",
                  isCompleted && !isActive 
                    ? "bg-emerald-500 text-white border-transparent" 
                    : isActive 
                      ? "bg-blue-600 dark:bg-blue-500 text-white border-transparent ring-blue-50 dark:ring-blue-900/30" 
                      : "bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                )}>
                  {isCompleted && !isActive ? <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" /> : i + 1}
                </div>
                
                <span className={cn(
                  "absolute top-full mt-2 sm:mt-3 hidden sm:flex items-center gap-1 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest whitespace-nowrap transition-colors",
                  isActive 
                    ? "text-blue-600 dark:text-blue-400" 
                    : isCompleted 
                      ? "text-slate-900 dark:text-slate-300" 
                      : "text-slate-400 dark:text-slate-600"
                )}>
                  {s}
                  {isFutureLocked && <Lock className="w-3 h-3 text-slate-300 dark:text-slate-600" />}
                </span>
              </button>
            );
          })}
        </div>
        
        <div className="mt-4 sm:hidden w-full text-center flex justify-center">
          <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-500/20 shadow-sm transition-colors flex items-center gap-1.5">
            Step {step + 1}: {STEPS[step]}
            {step === STEPS.length - 1 && <FileSignature className="w-3 h-3" />}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col px-4 py-6 sm:p-10 overflow-y-auto w-full max-w-4xl mx-auto z-0 relative">
        
        {finalSubmitError && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm rounded-xl text-center font-bold shadow-sm animate-in fade-in transition-colors flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            {finalSubmitError}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
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
                  handleNext();
                }}
                campaignId={campaignId}
              />
            )}
            {step === 3 && (
              <StepFour 
                email={formData.email}
                firstName={formData.firstName}
                lastName={formData.lastName}
                onComplete={handleFinalSubmit}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}