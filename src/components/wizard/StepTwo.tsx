"use client";

import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  const [isSaving, setIsSaving] = useState(false);
  
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
            await onSubmit(data);
            resolve(true);
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
      // Remove niche
      setValue('niches', niches.filter((n: string) => n !== niche), { shouldValidate: true });
    } else {
      // Add niche
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

  const onSubmit = async (data: any) => {
    setIsSaving(true);
    try {
      const draftPayload = {
        campaign_id: parseInt(campaignId, 10),
        yearsOfExperience: data.yearsOfExperience,
        niches: data.niches,
        linkedinUrl: data.linkedinUrl,
      };

      await fetch('/api/applications/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftPayload)
      });
    } catch (error) {
      console.error("Failed to save Step 2 draft:", error);
    } finally {
      setIsSaving(false);
      onNext(data);
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

  // Create a combined list of niches to display (Defaults + selected customs)
  const displayNiches = Array.from(new Set([...DEFAULT_NICHES, ...niches]));

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-8 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 max-w-2xl mx-auto mt-8">
      {/* Years of Experience */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700">Years of Experience</label>
        <select 
          {...register('yearsOfExperience')}
          className={cn(
            "w-full px-4 py-3 rounded-xl border outline-none bg-slate-50 transition-colors text-sm", 
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
      <div className="space-y-2" id="niches">
        <label className="text-sm font-bold text-slate-700">Niches (up to 3)</label>
        <div className="flex flex-wrap gap-2 pt-1">
          {displayNiches.map(niche => (
            <button
              key={niche}
              type="button"
              onClick={() => toggleNiche(niche)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-sm font-bold transition-all border shadow-sm",
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
              className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all border shadow-sm bg-white text-slate-500 border-slate-200 border-dashed hover:border-slate-400 hover:text-slate-700 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Other
            </button>
          ) : (
            <div className="flex items-center gap-2">
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
                className="px-4 py-2.5 rounded-xl border border-blue-600 outline-none text-sm bg-blue-50/50 w-40"
              />
              <button
                type="button"
                onClick={handleAddCustomNiche}
                className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomNicheValue("");
                }}
                className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        {nicheWarning && <p className="text-xs text-orange-500 font-bold mt-2 animate-in fade-in">You can select a maximum of 3 specializations</p>}
        {errors.niches && <p className="text-xs text-red-500 font-bold">{(errors.niches as any).message}</p>}
      </div>

      {/* LinkedIn URL */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700">
          LinkedIn URL <span className="text-red-500">*</span>
        </label>
        <input 
          type="text" 
          {...register('linkedinUrl')}
          placeholder="https://linkedin.com/in/username"
          className={cn(
            "w-full px-4 py-3 rounded-xl border outline-none bg-slate-50 transition-colors text-sm", 
            errors.linkedinUrl ? "border-red-500 focus:ring-2 focus:ring-red-500/20" : "border-slate-300 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          )}
        />
        {errors.linkedinUrl && <p className="text-xs text-red-500 font-bold">{(errors.linkedinUrl as any).message}</p>}
      </div>

      {/* Resume Upload */}
      <div className="space-y-2" id="resumeFile">
        <label className="text-sm font-bold text-slate-700">Resume (PDF)</label>
        <div className={cn(
          "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative", 
          errors.resumeFile ? "border-red-500 bg-red-50/50" : "border-slate-300 hover:border-blue-400"
        )}>
          <input 
            type="file" 
            accept=".pdf"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          />
          <Upload className={cn("w-6 h-6 mb-3", errors.resumeFile ? "text-red-400" : "text-slate-400")} />
          {resumeFile ? (
            <div className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">{resumeFile.name}</div>
          ) : (
            <>
              <div className="text-sm font-bold text-slate-900 mb-1">Click or drag file</div>
              <div className="text-xs text-slate-500 font-medium">PDF up to 5MB</div>
            </>
          )}
        </div>
        <p className="text-xs text-slate-500 font-medium">Optional. You can upload your resume later from your dashboard.</p>
        {errors.resumeFile && <p className="text-xs text-red-500 font-bold">{(errors.resumeFile as any).message}</p>}
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button 
          type="submit" 
          disabled={isSaving} 
          className="w-full flex items-center justify-center bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-70"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
        </button>
      </div>
    </form>
  );
});

export default StepTwo;