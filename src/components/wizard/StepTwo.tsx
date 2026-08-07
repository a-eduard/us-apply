"use client";

import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { StepTwoSchema } from '@/schemas/wizard';
import { cn } from '@/lib/utils';
import { Upload, Loader2, Plus, X } from 'lucide-react';

const DEFAULT_NICHES = [
  "IT / SaaS", "Real Estate", "EdTech", "Finance", 
  "Healthcare", "Marketing", "Consulting", "E-commerce"
];

const StepTwo = forwardRef(function StepTwo({ 
  defaultValues, 
  onNext, 
  campaignId, 
  onChange 
}: { 
  defaultValues: any, 
  onNext: (data: any) => void, 
  campaignId: string, 
  onChange?: (data: any) => void 
}, ref) {
  const { data: session } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  
  // States for Custom Niche
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customNicheValue, setCustomNicheValue] = useState("");

  const { register, handleSubmit, formState: { errors }, setFocus, setValue, watch, trigger, getValues } = useForm({
    resolver: zodResolver(StepTwoSchema),
    mode: 'onChange',
    reValidateMode: 'onBlur',
    defaultValues: {
      yearsOfExperience: defaultValues?.yearsOfExperience || '',
      niches: defaultValues?.niches || [],
      linkedinUrl: defaultValues?.linkedinUrl || defaultValues?.linkedInUrl || '',
      resumeFile: defaultValues?.resumeFile || null
    }
  });

  useEffect(() => {
    const subscription = watch((value: any) => {
      if (onChange) onChange(value);
    });
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  useImperativeHandle(ref, () => ({
    getValues: () => getValues(),
    validateAndSubmit: async () => {
      const isValid = await trigger();
      if (isValid) {
        return new Promise(resolve => {
          handleSubmit(async (data) => {
            const success = await onSubmit(data);
            resolve(success);
          })();
        });
      } else {
        onError(errors);
        return false;
      }
    }
  }));

  const niches = watch('niches') || [];
  const resumeFile = watch('resumeFile');
  const [nicheWarning, setNicheWarning] = useState(false);

  const toggleNiche = (niche: string) => {
    setNicheWarning(false);
    
    if (niches.includes(niche)) {
      setValue('niches', niches.filter((n: string) => n !== niche), { shouldValidate: true });
    } else {
      if (niches.length >= 3) {
        setNicheWarning(true);
        setTimeout(() => setNicheWarning(false), 3000);
        return;
      }
      setValue('niches', [...niches, niche], { shouldValidate: true });
    }
  };

  const handleAddCustomNiche = () => {
    const trimmedVal = customNicheValue.trim();
    if (!trimmedVal) {
      setShowCustomInput(false);
      return;
    }

    if (niches.length >= 3) {
      setNicheWarning(true);
      setTimeout(() => setNicheWarning(false), 3000);
      setShowCustomInput(false);
      setCustomNicheValue("");
      return;
    }

    if (!niches.includes(trimmedVal)) {
      setValue('niches', [...niches, trimmedVal], { shouldValidate: true });
    }
    
    setCustomNicheValue("");
    setShowCustomInput(false);
  };

  const onSubmit = async (data: any): Promise<boolean> => {
    setIsSaving(true);
    setSaveError('');
    try {
      let finalResumeUrl = defaultValues?.resumeUrl || '';

      // 1. UPLOAD RESUME TO AWS S3
      if (data.resumeFile instanceof File) {
        const fileData = new FormData();
        fileData.append("file", data.resumeFile);
        fileData.append("isVideo", "false");
        
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fileData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalResumeUrl = uploadData.publicUrl;
        } else {
          throw new Error("Failed to upload resume file");
        }
      }

      const userId = session?.user ? (session.user as any).id : null;

      // 2. UPDATE PROFILE
      if (userId) {
        const profileRes = await fetch(`/api/users/${userId}/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            years_of_experience: data.yearsOfExperience,
            niches: data.niches,
            linkedin_url: data.linkedinUrl,
            resume_url: finalResumeUrl || undefined
          })
        });
        if (!profileRes.ok) {
           const errData = await profileRes.json();
           throw new Error(errData.error || "Failed to update profile data");
        }
      }

      // 3. SAVE DRAFT (IF CAMPAIGN EXISTS)
      if (campaignId) {
        const draftPayload = {
          campaign_id: parseInt(campaignId, 10),
          yearsOfExperience: data.yearsOfExperience,
          niches: data.niches,
          linkedinUrl: data.linkedinUrl,
          resumeUrl: finalResumeUrl || undefined
        };

        const draftRes = await fetch('/api/applications/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draftPayload)
        });
        if (!draftRes.ok) {
           throw new Error("Failed to save application draft");
        }
      }

      onNext({ ...data, resumeUrl: finalResumeUrl, resumeFile: null });
      return true;
    } catch (error: any) {
      console.error("Failed to save Step 2:", error);
      setSaveError(error.message || "A database error occurred. Please try again.");
      return false; 
    } finally {
      setIsSaving(false);
    }
  };

  const onError = (errors: any) => {
    const firstError = Object.keys(errors)[0];
    if (firstError) {
      if (firstError === 'niches' || firstError === 'resumeFile') {
        const element = document.getElementById(firstError);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        setFocus(firstError as any);
        const element = document.getElementsByName(firstError)[0];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setValue('resumeFile', e.target.files[0], { shouldValidate: true });
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setValue('resumeFile', null, { shouldValidate: true });
  };

  const displayNiches = Array.from(new Set([...DEFAULT_NICHES, ...niches]));

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6 sm:space-y-8 bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-200 max-w-2xl mx-auto mt-4 sm:mt-8">
      
      {saveError && (
        <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-lg border border-red-100 text-center animate-in fade-in">
          {saveError}
        </div>
      )}

      {/* Years of Experience */}
      <div className="space-y-1.5 sm:space-y-2">
        <label className="text-sm font-bold text-slate-700">Years of Experience</label>
        <select 
          {...register('yearsOfExperience')}
          className={cn(
            "w-full px-4 py-3 sm:py-3 rounded-xl border outline-none bg-slate-50 transition-colors text-base sm:text-sm", 
            errors.yearsOfExperience ? "border-red-500 focus:ring-2 focus:ring-red-500/20" : "border-slate-300 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          )}
        >
          <option value="">Select your experience...</option>
          <option value="< 1 year">Less than 1 year</option>
          <option value="1-3 years">1-3 years</option>
          <option value="3-5 years">3-5 years</option>
          <option value="5+ years">5+ years</option>
        </select>
        {errors.yearsOfExperience && <p className="text-xs text-red-500 font-medium">{(errors.yearsOfExperience as any).message}</p>}
      </div>

      {/* Niches */}
      <div className="space-y-1.5 sm:space-y-2" id="niches">
        <label className="text-sm font-bold text-slate-700">Niches (up to 3)</label>
        <div className="flex flex-wrap gap-2 pt-1">
          {displayNiches.map(niche => (
            <button
              key={niche}
              type="button"
              onClick={() => toggleNiche(niche)}
              className={cn(
                "px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border shadow-sm",
                niches.includes(niche) 
                  ? "bg-blue-600 text-white border-blue-600" 
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-600/30 hover:bg-blue-50"
              )}
            >
              {niche}
            </button>
          ))}

          {/* Custom Niche Button / Input */}
          {!showCustomInput ? (
            <button
              type="button"
              onClick={() => {
                if (niches.length >= 3) {
                  setNicheWarning(true);
                  setTimeout(() => setNicheWarning(false), 3000);
                  return;
                }
                setShowCustomInput(true);
              }}
              className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border shadow-sm bg-white text-slate-500 border-slate-200 border-dashed hover:border-slate-400 hover:text-slate-700 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Other
            </button>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <input
                type="text"
                autoFocus
                placeholder="Type your niche..."
                value={customNicheValue}
                onChange={(e) => setCustomNicheValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomNiche();
                  } else if (e.key === 'Escape') {
                    setShowCustomInput(false);
                    setCustomNicheValue("");
                  }
                }}
                className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-blue-600 outline-none text-base sm:text-sm bg-blue-50/50 flex-1 sm:w-40 min-w-0"
              />
              <button
                type="button"
                onClick={handleAddCustomNiche}
                className="p-2 sm:p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4 sm:w-4 sm:h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomNicheValue("");
                }}
                className="p-2 sm:p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors shrink-0"
              >
                <X className="w-4 h-4 sm:w-4 sm:h-4" />
              </button>
            </div>
          )}
        </div>
        {nicheWarning && <p className="text-xs text-orange-500 font-bold mt-2 animate-in fade-in">You can select a maximum of 3 specializations</p>}
        {errors.niches && <p className="text-xs text-red-500 font-bold">{(errors.niches as any).message}</p>}
      </div>

      {/* LinkedIn URL */}
      <div className="space-y-1.5 sm:space-y-2">
        <label className="text-sm font-bold text-slate-700">
          LinkedIn URL <span className="text-red-500">*</span>
        </label>
        <input 
          type="text" 
          {...register('linkedinUrl')}
          placeholder="https://linkedin.com/in/username"
          className={cn(
            "w-full px-4 py-3 sm:py-3 rounded-xl border outline-none bg-slate-50 transition-colors text-base sm:text-sm", 
            errors.linkedinUrl ? "border-red-500 focus:ring-2 focus:ring-red-500/20" : "border-slate-300 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          )}
        />
        {errors.linkedinUrl && <p className="text-xs text-red-500 font-bold">{(errors.linkedinUrl as any).message}</p>}
      </div>

      {/* Resume Upload */}
      <div className="space-y-1.5 sm:space-y-2" id="resumeFile">
        <label className="text-sm font-bold text-slate-700">Resume (PDF)</label>
        <div className={cn(
          "border-2 border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center transition-colors relative", 
          errors.resumeFile ? "border-red-500 bg-red-50/50" : "bg-slate-50 border-slate-300 hover:border-blue-400 hover:bg-slate-100"
        )}>
          
          {/* Show input ONLY when there is no file selected */}
          {!resumeFile && (
            <input 
              type="file" 
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
            />
          )}

          {resumeFile ? (
            <div className="z-20 relative flex items-center gap-3 bg-white border border-blue-200 px-4 py-2 rounded-xl shadow-sm animate-in zoom-in-95 duration-200">
              <div className="text-xs sm:text-sm font-bold text-blue-600 truncate max-w-[200px] sm:max-w-[300px]">
                {resumeFile.name || "Resume file"}
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className={cn("w-5 h-5 sm:w-6 sm:h-6 mb-2 sm:mb-3", errors.resumeFile ? "text-red-400" : "text-slate-400")} />
              <div className="text-xs sm:text-sm font-bold text-slate-900 mb-1">Click or drag file</div>
              <div className="text-[10px] sm:text-xs text-slate-500 font-medium">Only PDF up to 5MB</div>
            </>
          )}
        </div>
        <p className="text-[10px] sm:text-xs text-slate-500 font-medium text-center sm:text-left">Optional. You can upload your resume later from your dashboard.</p>
        {errors.resumeFile && <p className="text-xs text-red-500 font-bold text-center sm:text-left">{(errors.resumeFile as any).message}</p>}
      </div>

      {/* Submit Button */}
      <div className="pt-2 sm:pt-4">
        <button 
          type="submit" 
          disabled={isSaving} 
          className="w-full flex items-center justify-center bg-blue-600 text-white font-bold py-3.5 sm:py-4 text-sm sm:text-base rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-70 gap-2"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (campaignId ? "Continue" : "Save & Continue")}
        </button>
      </div>
    </form>
  );
});

export default StepTwo;