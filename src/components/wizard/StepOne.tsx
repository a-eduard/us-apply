"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { City } from 'country-state-city';
import { useSession, signIn } from 'next-auth/react';

import { ProfileEnrichmentSchema } from '@/schemas/wizard';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

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
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  
  const currentCampaignId = campaignId || (typeof window !== "undefined" ? sessionStorage.getItem('campaign_id') : "");
  const isGuest = status === 'unauthenticated';

  const { register: registerProfile, setValue: setProfileValue, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors }, setFocus, trigger: triggerProfile, getValues: getProfileValues, watch: watchProfile } = useForm({
    resolver: zodResolver(ProfileEnrichmentSchema),
    mode: 'onChange',
    reValidateMode: 'onBlur',
    defaultValues: {
      firstName: defaultValues.firstName || '',
      lastName: defaultValues.lastName || '',
      email: defaultValues.email || '',
      password: '',
      city: defaultValues.city || '',
      state: defaultValues.state || ''
    }
  });

  useEffect(() => {
    if (session?.user) {
      const nameParts = session.user.name?.split(' ') || [];
      const userFirstName = (session.user as any).first_name || nameParts[0] || '';
      const userLastName = (session.user as any).last_name || nameParts.slice(1).join(' ') || '';

      setProfileValue('firstName', defaultValues.firstName || userFirstName, { shouldValidate: true });
      setProfileValue('lastName', defaultValues.lastName || userLastName, { shouldValidate: true });
      setProfileValue('email', defaultValues.email || session.user.email || '', { shouldValidate: true });
    }
  }, [session, setProfileValue, defaultValues]);

  useEffect(() => {
    const subscription = watchProfile((value: any) => {
      if (onChange) onChange(value);
    });
    return () => subscription.unsubscribe();
  }, [watchProfile, onChange]);
  
  const [locSearch, setLocSearch] = useState(() => {
    if (defaultValues.city && defaultValues.state) {
      return defaultValues.city + ', ' + defaultValues.state;
    }
    return '';
  });
  
  const [locOptions, setLocOptions] = useState<any[]>([]);
  const [showLocDropdown, setShowLocDropdown] = useState(false);
  const skipSearchRef = useRef(false);
  const locRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (locRef.current && !locRef.current.contains(e.target)) {
        setShowLocDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (skipSearchRef.current) { skipSearchRef.current = false; return; }
    if (locSearch.length >= 3) {
      const timeout = setTimeout(() => {
        const allCities = City.getCitiesOfCountry('US') || [];
        const lower = locSearch.toLowerCase();
        const matches = allCities.filter(c => c.name.toLowerCase().includes(lower)).slice(0, 50);
        setLocOptions(matches);
        setShowLocDropdown(true);
      }, 300);
      return () => clearTimeout(timeout);
    } else {
      setLocOptions([]);
      setShowLocDropdown(false);
    }
  }, [locSearch]);

  useImperativeHandle(ref, () => ({
    getValues: () => getProfileValues(),
    validateAndSubmit: async () => {
      if (status === 'loading') return false;
      const isValid = await triggerProfile();
      if (isValid) {
        return new Promise(resolve => {
          handleProfileSubmit(async (data) => {
            const success = await onProfileSubmit(data);
            resolve(success);
          })();
        });
      } else {
        onError(profileErrors);
        return false;
      }
    }
  }));

  const onProfileSubmit = async (data: any): Promise<boolean> => {
    setLoading(true);
    setAuthError('');
    try {
      let currentUserId = session?.user ? (session.user as any).id : null;

      // 1. ЕСЛИ ГОСТЬ - РЕГИСТРИРУЕМ И АВТОРИЗУЕМ
      if (isGuest) {
        if (!data.password || data.password.length < 6) {
          setAuthError('Password must be at least 6 characters');
          return false;
        }

        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
            role: 'Candidate',
            city: data.city,
            state: data.state
          })
        });

        if (!regRes.ok) {
          const regData = await regRes.json();
          throw new Error(regData.error || 'Registration failed');
        }

        const regData = await regRes.json();
        currentUserId = regData.userId;

        const signRes = await signIn("credentials", {
          redirect: false,
          email: data.email,
          password: data.password
        });

        if (signRes?.error) {
          throw new Error('Account created, but auto-login failed. Please log in manually.');
        }
      } else {
        // ЕСЛИ УЖЕ АВТОРИЗОВАН - ПРОСТО ОБНОВЛЯЕМ ПРОФИЛЬ
        if (currentUserId) {
          const updateRes = await fetch(`/api/users/${currentUserId}/profile`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              first_name: data.firstName,
              last_name: data.lastName,
              city: data.city,
              state: data.state
            })
          });
          if (!updateRes.ok) throw new Error("Failed to update profile");
        }
      }

      // 3. СОХРАНЯЕМ ЧЕРНОВИК (ТОЛЬКО ЕСЛИ ЕСТЬ КАМПАНИЯ)
      if (currentCampaignId) {
        const draftPayload = {
          campaign_id: parseInt(currentCampaignId, 10),
          first_name: data.firstName,
          last_name: data.lastName,
          city: data.city,
          state: data.state
        };

        const draftRes = await fetch('/api/applications/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draftPayload)
        });
        
        if (!draftRes.ok) throw new Error('Failed to save application draft');
      }
      
      onNext(data);
      return true;
    } catch (e: any) {
      setAuthError(e.message || 'Network error occurred. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
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

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const handleSocialLogin = (provider: string) => {
    signIn(provider, { callbackUrl: window.location.href });
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-lg mx-auto w-full">
      <div className="text-center space-y-1 sm:space-y-2 mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          {isGuest ? 'Create an Account' : 'Confirm Your Details'}
        </h2>
        <p className="text-sm sm:text-base text-slate-500">
          {isGuest ? 'Join the platform to submit your application.' : 'Please confirm your contact details.'}
        </p>
      </div>

      {isGuest && (
        <div className="mb-6 sm:mb-8">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => handleSocialLogin("google")}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors text-xs sm:text-sm font-bold text-slate-700 shadow-sm"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin("linkedin")}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors text-xs sm:text-sm font-bold text-slate-700 shadow-sm"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill="#0077B5" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </button>
          </div>
          <div className="mt-5 sm:mt-6 flex items-center gap-3 sm:gap-4">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest text-center">Or register with email</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
        </div>
      )}

      {authError && (
        <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-lg border border-red-100 text-center mb-5 sm:mb-6 animate-in fade-in">
          {authError}
        </div>
      )}

      <form onSubmit={handleProfileSubmit(onProfileSubmit, onError)} className="space-y-5 sm:space-y-6 bg-white p-5 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">First Name</label>
            <input 
              type="text" 
              {...registerProfile('firstName')}
              className={cn("w-full px-4 py-3 sm:py-2.5 rounded-xl border outline-none bg-slate-50 transition-colors text-base sm:text-sm", profileErrors.firstName ? "border-red-500 focus:ring-2 focus:ring-red-500" : "border-slate-300 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600")}
            />
            {profileErrors.firstName && <p className="text-xs text-red-500 font-bold mt-1">{(profileErrors.firstName as any).message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Last Name</label>
            <input 
              type="text" 
              {...registerProfile('lastName')}
              className={cn("w-full px-4 py-3 sm:py-2.5 rounded-xl border outline-none bg-slate-50 transition-colors text-base sm:text-sm", profileErrors.lastName ? "border-red-500 focus:ring-2 focus:ring-red-500" : "border-slate-300 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600")}
            />
            {profileErrors.lastName && <p className="text-xs text-red-500 font-bold mt-1">{(profileErrors.lastName as any).message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700">Email Address</label>
          <input 
            type="email" 
            {...registerProfile('email')}
            disabled={!isGuest} // If logged in, email is locked
            className={cn("w-full px-4 py-3 sm:py-2.5 rounded-xl border outline-none bg-slate-50 transition-colors text-base sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed", profileErrors.email ? "border-red-500 focus:ring-2 focus:ring-red-500" : "border-slate-300 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600")}
          />
          {profileErrors.email && <p className="text-xs text-red-500 font-bold mt-1">{(profileErrors.email as any).message}</p>}
        </div>

        {isGuest && (
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Password <span className="text-red-500">*</span></label>
            <input 
              type="password" 
              {...registerProfile('password')}
              placeholder="Min. 6 characters"
              className={cn("w-full px-4 py-3 sm:py-2.5 rounded-xl border outline-none bg-slate-50 transition-colors text-base sm:text-sm", profileErrors.password ? "border-red-500 focus:ring-2 focus:ring-red-500" : "border-slate-300 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600")}
            />
            {profileErrors.password && <p className="text-xs text-red-500 font-bold mt-1">{(profileErrors.password as any).message}</p>}
          </div>
        )}
        
        <div className="space-y-1.5" ref={locRef}>
          <label className="text-sm font-bold text-slate-700">Location (City, State/Country) <span className="text-red-500">*</span></label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="e.g. Austin, TX or London, UK"
              value={locSearch}
              onChange={(e) => {
                const val = e.target.value;
                setLocSearch(val);
                
                let c = val;
                let s = val;
                if (val.includes(',')) {
                  const parts = val.split(',');
                  c = parts[0].trim();
                  s = parts.slice(1).join(',').trim();
                }
                
                setProfileValue('city', c, { shouldValidate: true });
                setProfileValue('state', s, { shouldValidate: true });
              }}
              className={cn("w-full px-4 py-3 sm:py-2.5 rounded-xl border outline-none bg-slate-50 transition-colors text-base sm:text-sm", (profileErrors.city || profileErrors.state) ? "border-red-500 focus:ring-2 focus:ring-red-500" : "border-slate-300 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600")}
            />
            {showLocDropdown && locOptions.length > 0 && (
              <ul className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 sm:max-h-60 overflow-auto text-sm py-1">
                {locOptions?.map((opt, i) => (
                  <li 
                    key={i}
                    onClick={() => {
                      const display = opt.name + ', ' + opt.stateCode;
                      skipSearchRef.current = true;
                      setLocSearch(display);
                      setProfileValue('city', opt.name, { shouldValidate: true });
                      setProfileValue('state', opt.stateCode, { shouldValidate: true });
                      setShowLocDropdown(false);
                    }}
                    className="px-4 py-3 sm:py-2.5 hover:bg-blue-50 cursor-pointer text-slate-700 transition-colors font-medium"
                  >
                    {opt.name}, {opt.stateCode}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {(profileErrors.city || profileErrors.state) && <p className="text-xs text-red-500 font-bold mt-1">Please specify your location</p>}
          <input type="hidden" {...registerProfile('city')} />
          <input type="hidden" {...registerProfile('state')} />
        </div>

        <div className="pt-4 sm:pt-6">
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3.5 sm:py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base">
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (isGuest ? 'Create Account & Continue' : 'Continue to Experience')}
          </button>
        </div>
      </form>
    </div>
  );
});

export default StepOne;