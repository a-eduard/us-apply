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
import StepFour from "@/components/wizard/StepFour"; // ADDED: StepFour import

const STEPS = ["Basic Info", "Experience", "Video Pitch", "Contract"]; // ALREADY UPDATED

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
  
  // ADDED: State to store the created Application ID for DocuSeal
  const [applicationId, setApplicationId] = useState<number | null>(null);

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
    setMaxReachedStep((prev) => Math.max(prev, step));
  }, [step]);

  // ЗАЩИТА: Не даем гостям прыгать сразу на 2 или 3 шаг
  useEffect(() => {
    if (status === "unauthenticated" && step > 0) {
      const query = campaignId ? `?campaignId=${campaignId}` : '';
      router.replace(`/wizard/step-1${query}`);
    }
  }, [status, step, router, campaignId]);

  useEffect(() => {
    const fetchDraft = async () => {
      // Если это просто регистрация без кампании, пропускаем черновик
      if (!campaignId) {
        setIsDraftLoaded(true);
        return;
      }

      if (status === "authenticated") {
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

    if (status === "authenticated" || status === "unauthenticated") {
      fetchDraft();
    }
  }, [status, campaignId]);

  const handleNext = () => {
    const nextStep = Math.min(step + 1, STEPS.length - 1);
    const query = campaignId ? `?campaignId=${campaignId}` : '';
    router.push(`/wizard/step-${nextStep + 1}${query}`);
  };

  const handleFormDataChange = (data: any) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleSubmit = async (finalData: any = formData) => {
    // 1. Если нет кампании (Простая регистрация),
    // данные в профиль уже сохранились на Шаге 1 и 2. Мы просто перекидываем в Дашборд.
    if (!campaignId) {
      router.push('/dashboard/candidate');
      return;
    }

    // 2. Если есть кампания - отправляем финальную заявку
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaign_id: parseInt(campaignId, 10),
          application_data: finalData
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit application');
      }

      const responseData = await res.json();
      
      // UPDATED: Instead of showing success immediately, save ID and go to Step 4 (Contract)
      if (responseData.id || responseData.applicationId) {
        setApplicationId(responseData.id || responseData.applicationId);
        setStep(3); // Move UI to Step 4 (index 3)
        router.push(`/wizard/step-4?campaignId=${campaignId}`);
      } else {
        // Fallback just in case ID is not returned
        setShowSuccess(true);
      }

    } catch (error) {
      console.error("Submission error:", error);
      alert("Something went wrong during submission. Please try again.");
    }
  };

  const handleContractComplete = () => {
    // Called when DocuSeal finishes successfully
    setShowSuccess(true);
  };

  if (status === "loading" || (!isDraftLoaded && status === "authenticated")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
        <Confetti width={width} height={height} recycle={false} numberOfPieces={500} gravity={0.1} />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 sm:p-12 rounded-3xl max-w-md w-full shadow-2xl relative z-10 mx-4"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">Application Submitted!</h2>
          <p className="text-sm sm:text-lg text-slate-600 mb-6 sm:mb-8">Your application has been successfully sent to the employer for this position.</p>
          <button 
            onClick={() => router.push('/dashboard/candidate')}
            className="w-full bg-blue-600 text-white font-bold py-3.5 sm:py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
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
      <nav className="h-14 sm:h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 shadow-sm relative z-50">
        <div 
          className="flex items-center gap-2 cursor-pointer group" 
          onClick={() => router.push('/')}
        >
          <img src="/usc_logo.png" alt="USclosers Logo" className="h-6 sm:h-8 group-hover:opacity-80 transition-opacity shrink-0" />
          <span className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight group-hover:opacity-80 transition-opacity hidden sm:block">
            USclosers
          </span>
        </div>
      </nav>

      {/* Stepper Header */}
      <div className="bg-white px-4 sm:px-12 py-4 sm:py-6 flex flex-col items-center shrink-0 shadow-sm z-10 relative">
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
                  const query = campaignId ? `?campaignId=${campaignId}` : '';
                  router.push(`/wizard/step-${i + 1}${query}`);
                }}
                className={cn(
                  "flex items-center gap-2.5 focus:outline-none bg-white z-10 px-2 sm:px-3", 
                  !isLocked ? "cursor-pointer hover:opacity-80 transition-opacity" : "cursor-not-allowed"
                )}
              >
                <div className={cn(
                  "w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[10px] sm:text-xs flex items-center justify-center font-bold shrink-0 transition-colors shadow-sm",
                  isCompleted && !isActive ? "bg-emerald-500 text-white border border-emerald-500" : 
                  isActive ? "bg-blue-600 text-white border border-blue-600" : 
                  "bg-white border-2 border-slate-200 text-slate-400"
                )}>
                  {isCompleted && !isActive ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" /> : i + 1}
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
        
        {/* Mobile Step Label (Visible only on small screens) */}
        <div className="mt-3 text-center sm:hidden w-full">
          <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest">
            Step {step + 1}: {STEPS[step]}
          </span>
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
            {/* ADDED: StepFour implementation */}
            {step === 3 && (
              <StepFour 
                applicationId={applicationId as number} 
                email={formData.email || session?.user?.email || ""}
                firstName={formData.firstName}
                lastName={formData.lastName}
                onComplete={handleContractComplete}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}