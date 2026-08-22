"use client";

import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { StepTwoSchema } from '@/schemas/wizard';
import { cn } from '@/lib/utils';
import { Upload, Loader2, Plus, X, User } from 'lucide-react';

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
  
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customNicheValue, setCustomNicheValue] = useState("");

  const { register, handleSubmit, formState: { errors }, setFocus, setValue, watch, trigger, getValues } = useForm({
    resolver: zodResolver(StepTwoSchema),
    mode: 'onChange',
    reValidateMode: 'onBlur',
    defaultValues: {
      avatarFile: defaultValues?.avatarFile || null,
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
  const avatarFile = watch('avatarFile');
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
      let finalAvatarUrl = defaultValues?.avatarUrl || '';

      if (data.avatarFile instanceof File) {
        const fileData = new FormData();
        fileData.append("file", data.avatarFile);
        fileData.append("folder", "avatars"); 
        
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fileData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalAvatarUrl = uploadData.publicUrl;
        } else {
          throw new Error("Failed to upload profile photo");
        }
      }

      if (data.resumeFile instanceof File) {
        const fileData = new FormData();
        fileData.append("file", data.resumeFile);
        fileData.append("folder", "resumes"); 
        
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fileData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalResumeUrl = uploadData.publicUrl;
        } else {
          throw new Error("Failed to upload resume file");
        }
      }

      const userId = session?.user ? (session.user as any).id : null;

      if (userId) {
        const profileRes = await fetch(`/api/users/${userId}/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            years_of_experience: data.yearsOfExperience,
            niches: data.niches,
            linkedin_url: data.linkedinUrl,
            resume_url: finalResumeUrl || undefined,
            avatar_url: finalAvatarUrl || undefined
          })
        });
        if (!profileRes.ok) {
           const errData = await profileRes.json();
           throw new Error(errData.error || "Failed to update profile data");
        }
      }

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

      onNext({ ...data, resumeUrl: finalResumeUrl, avatarUrl: finalAvatarUrl, resumeFile: null, avatarFile: null });
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
      if (firstError === 'niches' || firstError === 'resumeFile' || firstError === 'avatarFile') {
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

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setValue('resumeFile', e.target.files[0], { shouldValidate: true });
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setValue('avatarFile', e.target.files[0], { shouldValidate: true });
    }
  };

  const handleRemoveResume = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setValue('resumeFile', null, { shouldValidate: true });
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setValue('avatarFile', null, { shouldValidate: true });
  };

  const displayNiches = Array.from(new Set([...DEFAULT_NICHES, ...niches]));

  // Reused from StepOne for consistency
  const labelClasses = "block text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors mb-1.5 sm:mb-2";
  const inputBaseClasses = "w-full px-4 py-3 sm:py-3.5 rounded-xl border outline-none bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all text-base sm:text-sm shadow-sm";
  const inputNormalClasses = "border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 hover:border-slate-300 dark:hover:border-slate-700";
  const inputErrorClasses = "border-rose-500 dark:border-rose-500/80 focus:ring-4 focus:ring-rose-500/10 dark:focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/50 dark:bg-rose-500/5";

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-5 bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 max-w-[480px] sm:max-w-2xl mx-auto mt-2 sm:mt-4 transition-colors duration-300">
      
      {saveError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm font-bold rounded-xl border border-rose-100 dark:border-rose-500/20 text-center animate-in fade-in">
          {saveError}
        </div>
      )}

      {/* Avatar Upload - Compact Horizontal Layout */}
      <div className="flex items-center gap-4 sm:gap-5" id="avatarFile">
        <div className={cn(
          "relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden group transition-all",
          errors.avatarFile 
            ? "border-rose-500 bg-rose-50 dark:bg-rose-950/30" 
            : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500"
        )}>
          {avatarFile ? (
             <img src={URL.createObjectURL(avatarFile)} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
             <User className={cn("w-6 h-6 sm:w-8 sm:h-8 transition-colors", errors.avatarFile ? "text-rose-400" : "text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400")} />
          )}
          
          <input 
            type="file" 
            accept="image/jpeg, image/png, image/webp"
            onChange={handleAvatarChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          />
        </div>

        <div className="flex flex-col items-start text-left">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Profile Photo</p>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Optional. JPG, PNG (Max 5MB)</p>
          
          {avatarFile && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="mt-1.5 text-[10px] sm:text-xs text-rose-500 dark:text-rose-400 font-medium flex items-center gap-1 hover:text-rose-700 dark:hover:text-rose-300 transition-colors bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-md"
            >
              <X className="w-3 h-3" /> Remove photo
            </button>
          )}
          {errors.avatarFile && <p className="text-[10px] sm:text-xs text-rose-500 font-bold mt-1">{(errors.avatarFile as any).message}</p>}
        </div>
      </div>

      <div className="w-full h-px bg-slate-100 dark:bg-slate-800 transition-colors"></div>

      {/* Grid Layout for Experience & LinkedIn to save vertical space */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        
        {/* Years of Experience */}
        <div className="space-y-1.5">
          <label className={labelClasses}>Years of Experience</label>
          <select 
            {...register('yearsOfExperience')}
            className={cn(inputBaseClasses, "appearance-none cursor-pointer", errors.yearsOfExperience ? inputErrorClasses : inputNormalClasses)}
          >
            <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Select your experience...</option>
            <option value="< 1 year" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Less than 1 year</option>
            <option value="1-3 years" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">1-3 years</option>
            <option value="3-5 years" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">3-5 years</option>
            <option value="5+ years" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">5+ years</option>
          </select>
          {errors.yearsOfExperience && <p className="text-[10px] sm:text-xs text-rose-500 font-medium">{(errors.yearsOfExperience as any).message}</p>}
        </div>

        {/* LinkedIn URL */}
        <div className="space-y-1.5">
          <label className={labelClasses}>
            LinkedIn URL <span className="text-rose-500">*</span>
          </label>
          <input 
            type="text" 
            {...register('linkedinUrl')}
            placeholder="https://linkedin.com/in/username"
            className={cn(inputBaseClasses, errors.linkedinUrl ? inputErrorClasses : inputNormalClasses)}
          />
          {errors.linkedinUrl && <p className="text-[10px] sm:text-xs text-rose-500 font-bold">{(errors.linkedinUrl as any).message}</p>}
        </div>

      </div>

      {/* Niches */}
      <div className="space-y-1.5" id="niches">
        <label className={labelClasses}>Niches (up to 3)</label>
        <div className="flex flex-wrap gap-2 pt-1">
          {displayNiches.map(niche => (
            <button
              key={niche}
              type="button"
              onClick={() => toggleNiche(niche)}
              className={cn(
                "px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border shadow-sm active:scale-[0.98]",
                niches.includes(niche) 
                  ? "bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 ring-2 ring-blue-600/20 dark:ring-blue-500/20" 
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-900/20"
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
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border shadow-sm bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 border-dashed hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1.5 active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" /> Other
            </button>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto mt-2 sm:mt-0 animate-in fade-in zoom-in-95 duration-200">
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
                className="px-3 py-1.5 sm:py-2 rounded-xl border border-blue-500 dark:border-blue-400 outline-none text-base sm:text-sm bg-blue-50/50 dark:bg-blue-950/30 text-slate-900 dark:text-slate-100 flex-1 sm:w-40 min-w-0 shadow-inner focus:ring-4 focus:ring-blue-500/10"
              />
              <button
                type="button"
                onClick={handleAddCustomNiche}
                className="p-1.5 sm:p-2 bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm shrink-0 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomNicheValue("");
                }}
                className="p-1.5 sm:p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0 active:scale-[0.98]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        {nicheWarning && <p className="text-[10px] sm:text-xs text-orange-500 dark:text-orange-400 font-bold mt-2 animate-in fade-in">You can select a maximum of 3 specializations</p>}
        {errors.niches && <p className="text-[10px] sm:text-xs text-rose-500 font-bold">{(errors.niches as any).message}</p>}
      </div>

      {/* Resume Upload */}
      <div className="space-y-1.5" id="resumeFile">
        <label className={labelClasses}>Resume (PDF, DOCX)</label>
        <div className={cn(
          "border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center transition-all relative group cursor-pointer", 
          errors.resumeFile 
            ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20" 
            : "bg-slate-50 dark:bg-slate-950/50 border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-100 dark:hover:bg-slate-900"
        )}>
          
          {!resumeFile && (
            <input 
              type="file" 
              accept=".pdf,.doc,.docx"
              onChange={handleResumeChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
            />
          )}

          {resumeFile ? (
            <div className="z-20 relative flex items-center gap-2 sm:gap-3 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-500/30 px-3 sm:px-4 py-2 rounded-xl shadow-sm animate-in zoom-in-95 duration-200">
              <div className="text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 truncate max-w-[150px] sm:max-w-[250px]">
                {resumeFile.name || "Resume file"}
              </div>
              <button
                type="button"
                onClick={handleRemoveResume}
                className="p-1 sm:p-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                title="Remove file"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <Upload className={cn("w-5 h-5 sm:w-6 sm:h-6 mb-2 transition-colors", errors.resumeFile ? "text-rose-400" : "text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400")} />
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-200 mb-0.5">Click or drag file</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Max 10MB</div>
            </>
          )}
        </div>
        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Optional. You can upload your resume later from your dashboard.</p>
        {errors.resumeFile && <p className="text-[10px] sm:text-xs text-rose-500 font-bold">{(errors.resumeFile as any).message}</p>}
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button 
          type="submit" 
          disabled={isSaving} 
          className="w-full flex items-center justify-center bg-blue-600 dark:bg-blue-500 text-white font-bold py-3.5 text-sm sm:text-base rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-lg shadow-blue-600/20 dark:shadow-blue-900/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed gap-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40"
        >
          {isSaving ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : (campaignId ? "Continue" : "Save & Continue")}
        </button>
      </div>
    </form>
  );
});

export default StepTwo;