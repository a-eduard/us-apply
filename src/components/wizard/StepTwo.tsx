"use client";

import React, { useState, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StepTwoSchema } from '@/schemas/wizard';
import { cn } from '@/lib/utils';
import { Upload, Loader2, Plus, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const DEFAULT_NICHES = [
  "IT / SaaS", "Real Estate", "EdTech", "Finance", 
  "Healthcare", "Marketing", "Consulting", "E-commerce"
];

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

const StepTwo = forwardRef(function StepTwo({ 
  defaultValues, 
  onNext, 
  onChange 
}: { 
  defaultValues: any, 
  onNext: (data: any) => void, 
  campaignId?: string, 
  onChange?: (data: any) => void 
}, ref) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customNicheValue, setCustomNicheValue] = useState("");

  // Crop Modal States
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

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

      // Upload avatar to S3
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

      // Upload resume to S3
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

      // Pass only the URLs and raw data up to WizardClient (Deferred Registration)
      onNext({ 
        ...data, 
        resumeUrl: finalResumeUrl, 
        avatarUrl: finalAvatarUrl, 
        resumeFile: null, 
        avatarFile: null 
      });
      return true;
      
    } catch (error: any) {
      console.error("Failed to save Step 2:", error);
      setSaveError(error.message || "An error occurred. Please try again.");
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

  // Avatar Selection Trigger for Cropping
  const onSelectAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); 
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
        setIsCropModalOpen(true);
      });
      reader.readAsDataURL(e.target.files[0]);
      e.target.value = ''; 
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  };

  const generateCroppedImage = async () => {
    if (!imgRef.current || !completedCrop) {
      setIsCropModalOpen(false);
      return;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    ctx.imageSmoothingQuality = 'high';

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Canvas is empty');
        setIsCropModalOpen(false);
        return;
      }
      const file = new File([blob], 'avatar-cropped.jpeg', { type: 'image/jpeg' });
      setValue('avatarFile', file, { shouldValidate: true });
      setIsCropModalOpen(false);
    }, 'image/jpeg', 0.95);
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

  const labelClasses = "block text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors mb-1.5 sm:mb-2";
  const inputBaseClasses = "w-full px-4 py-3 sm:py-3.5 rounded-xl border outline-none bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all text-base sm:text-sm shadow-sm";
  const inputNormalClasses = "border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 hover:border-slate-300 dark:hover:border-slate-700";
  const inputErrorClasses = "border-rose-500 dark:border-rose-500/80 focus:ring-4 focus:ring-rose-500/10 dark:focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/50 dark:bg-rose-500/5";

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-5 bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 max-w-[480px] sm:max-w-2xl mx-auto mt-2 sm:mt-4 transition-colors duration-300">
        
        {saveError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm font-bold rounded-xl border border-rose-100 dark:border-rose-500/20 text-center animate-in fade-in">
            {saveError}
          </div>
        )}

        {/* Avatar Upload */}
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
              onChange={onSelectAvatarFile}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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

        <div className="pt-2">
          <button 
            type="submit" 
            disabled={isSaving} 
            className="w-full flex items-center justify-center bg-blue-600 dark:bg-blue-500 text-white font-bold py-3.5 text-sm sm:text-base rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-lg shadow-blue-600/20 dark:shadow-blue-900/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed gap-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40"
          >
            {isSaving ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : "Save & Continue"}
          </button>
        </div>
      </form>

      {/* --- CROP MODAL --- */}
      <AnimatePresence>
        {isCropModalOpen && (
          <div className="fixed inset-0 z-[99999] bg-slate-900/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 transition-colors">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col transition-colors"
            >
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center transition-colors">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white transition-colors">Crop Profile Photo</h3>
                <button 
                  onClick={() => setIsCropModalOpen(false)} 
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95"
                >
                  <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
              
              <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center max-h-[60vh] overflow-hidden transition-colors">
                {imgSrc && (
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={1}
                    circularCrop
                    className="max-h-[50vh] rounded-xl overflow-hidden shadow-sm"
                  >
                    <img
                      ref={imgRef}
                      alt="Crop me"
                      src={imgSrc}
                      onLoad={onImageLoad}
                      className="max-h-[50vh] w-auto object-contain"
                    />
                  </ReactCrop>
                )}
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-4 font-medium text-center">
                  Drag the edges to select the perfect square for your avatar.
                </p>
              </div>
              
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 transition-colors bg-white dark:bg-slate-900">
                <button 
                  type="button" 
                  onClick={() => setIsCropModalOpen(false)}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs sm:text-sm active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={generateCroppedImage}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 font-bold text-white bg-blue-600 dark:bg-blue-500 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-xs sm:text-sm shadow-md shadow-blue-600/20 active:scale-95"
                >
                  Apply Photo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
});

export default StepTwo;