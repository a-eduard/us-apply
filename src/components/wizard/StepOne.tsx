"use client";

import React, { forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Country } from 'country-state-city';
import { ProfileEnrichmentSchema } from '@/schemas/wizard';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const allCountries = Country.getAllCountries();

const StepOne = forwardRef(function StepOne({ 
  defaultValues, 
  onNext, 
  onChange,
  campaignId
}: { 
  defaultValues: any, 
  onNext: (data: any) => void,
  onChange?: (data: any) => void,
  campaignId?: string 
}, ref) {

  const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors }, setFocus, trigger: triggerProfile, getValues: getProfileValues } = useForm({
    resolver: zodResolver(ProfileEnrichmentSchema),
    mode: 'onChange',
    reValidateMode: 'onBlur',
    defaultValues: {
      firstName: defaultValues.firstName || '',
      lastName: defaultValues.lastName || '',
      email: defaultValues.email || '',
      password: defaultValues.password || '',
      city: defaultValues.city || '',
      country: defaultValues.state || defaultValues.country || '' 
    }
  });

  useImperativeHandle(ref, () => ({
    getValues: () => getProfileValues(),
    validateAndSubmit: async () => {
      const isValid = await triggerProfile();
      if (isValid) {
        return new Promise(resolve => {
          handleProfileSubmit((data) => {
            if (onChange) onChange(data);
            onNext(data);
            resolve(true);
          })();
        });
      } else {
        onError(profileErrors);
        return false;
      }
    }
  }));

  const onProfileSubmit = (data: any) => {
    if (onChange) onChange(data);
    onNext(data);
  };

  const onError = (errors: any) => {
    const firstError = Object.keys(errors)[0];
    if (firstError) {
      setFocus(firstError as any);
      const element = document.getElementsByName(firstError)[0];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const inputBaseClasses = "w-full px-4 py-3 sm:py-3.5 rounded-xl border outline-none bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all text-base sm:text-sm shadow-sm";
  const inputNormalClasses = "border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 hover:border-slate-300 dark:hover:border-slate-700";
  const inputErrorClasses = "border-rose-500 dark:border-rose-500/80 focus:ring-4 focus:ring-rose-500/10 dark:focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/50 dark:bg-rose-500/5";
  const labelClasses = "block text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors mb-1.5 sm:mb-2";

  return (
    <div className="space-y-6 sm:space-y-8 max-w-[480px] mx-auto w-full transition-colors duration-300 px-2 sm:px-0">
      
      {/* Header text */}
      <div className="text-center space-y-2 sm:space-y-3 mb-4 sm:mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">
          Create an Account
        </h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 transition-colors">
          Join the platform to submit your application.
        </p>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleProfileSubmit(onProfileSubmit, onError)} className="space-y-4 sm:space-y-5 bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm sm:shadow-md transition-colors duration-300">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label className={labelClasses}>First Name</label>
            <input 
              type="text" 
              {...registerProfile('firstName')}
              className={cn(inputBaseClasses, profileErrors.firstName ? inputErrorClasses : inputNormalClasses)}
            />
            {profileErrors.firstName && <p className="text-[10px] sm:text-xs text-rose-500 dark:text-rose-400 font-bold mt-1.5">{(profileErrors.firstName as any).message}</p>}
          </div>
          <div>
            <label className={labelClasses}>Last Name</label>
            <input 
              type="text" 
              {...registerProfile('lastName')}
              className={cn(inputBaseClasses, profileErrors.lastName ? inputErrorClasses : inputNormalClasses)}
            />
            {profileErrors.lastName && <p className="text-[10px] sm:text-xs text-rose-500 dark:text-rose-400 font-bold mt-1.5">{(profileErrors.lastName as any).message}</p>}
          </div>
        </div>

        <div>
          <label className={labelClasses}>Email Address</label>
          <input 
            type="email" 
            {...registerProfile('email')}
            className={cn(inputBaseClasses, profileErrors.email ? inputErrorClasses : inputNormalClasses)}
          />
          {profileErrors.email && <p className="text-[10px] sm:text-xs text-rose-500 dark:text-rose-400 font-bold mt-1.5">{(profileErrors.email as any).message}</p>}
        </div>

        <div>
          <label className={cn(labelClasses, "flex justify-between")}>
            <span>Password <span className="text-rose-500 dark:text-rose-400">*</span></span>
          </label>
          <input 
            type="password" 
            {...registerProfile('password')}
            placeholder="Min. 6 characters"
            className={cn(inputBaseClasses, profileErrors.password ? inputErrorClasses : inputNormalClasses)}
          />
          {profileErrors.password && <p className="text-[10px] sm:text-xs text-rose-500 dark:text-rose-400 font-bold mt-1.5">{(profileErrors.password as any).message}</p>}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label className={labelClasses}>Country <span className="text-rose-500 dark:text-rose-400">*</span></label>
            <select 
              {...registerProfile('country')}
              className={cn(inputBaseClasses, "appearance-none", profileErrors.country ? inputErrorClasses : inputNormalClasses)}
            >
              <option value="" className="dark:bg-slate-900">Select country...</option>
              {allCountries.map((c) => (
                <option key={c.isoCode} value={c.name} className="dark:bg-slate-900">{c.name}</option>
              ))}
            </select>
            {profileErrors.country && <p className="text-[10px] sm:text-xs text-rose-500 dark:text-rose-400 font-bold mt-1.5">{(profileErrors.country as any).message}</p>}
          </div>

          <div>
            <label className={labelClasses}>City <span className="text-rose-500 dark:text-rose-400">*</span></label>
            <input 
              type="text" 
              {...registerProfile('city')}
              placeholder="e.g. London"
              className={cn(inputBaseClasses, profileErrors.city ? inputErrorClasses : inputNormalClasses)}
            />
            {profileErrors.city && <p className="text-[10px] sm:text-xs text-rose-500 dark:text-rose-400 font-bold mt-1.5">{(profileErrors.city as any).message}</p>}
          </div>
        </div>

        <div className="pt-2 sm:pt-4">
          <button 
            type="submit" 
            className="w-full bg-blue-600 dark:bg-blue-500 text-white font-bold py-3.5 sm:py-4 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-lg shadow-blue-600/20 dark:shadow-blue-900/20 active:scale-[0.98] flex items-center justify-center gap-2 text-sm sm:text-base focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
});

export default StepOne;