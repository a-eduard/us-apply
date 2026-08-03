"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { City } from 'country-state-city';
import { useSession } from 'next-auth/react';

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

  const { register: registerProfile, setValue: setProfileValue, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors }, setFocus, trigger: triggerProfile, getValues: getProfileValues, watch: watchProfile } = useForm({
    resolver: zodResolver(ProfileEnrichmentSchema),
    mode: 'onChange',
    reValidateMode: 'onBlur',
    defaultValues: {
      firstName: defaultValues.firstName || '',
      lastName: defaultValues.lastName || '',
      email: defaultValues.email || '',
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
      if (status !== 'authenticated') return false;
      const isValid = await triggerProfile();
      if (isValid) {
        return new Promise(resolve => {
          handleProfileSubmit(async (data) => {
            await onProfileSubmit(data);
            resolve(true);
          })();
        });
      } else {
        onError(profileErrors);
        return false;
      }
    }
  }));

  const onProfileSubmit = async (data: any) => {
    setLoading(true);
    setAuthError('');
    try {
      const payload = {
        campaign_id: currentCampaignId ? parseInt(currentCampaignId, 10) : undefined,
        first_name: data.firstName,
        last_name: data.lastName,
        city: data.city,
        state: data.state
      };

      const res = await fetch('/api/applications/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        onNext(data);
      } else {
        let errorData;
        try {
          errorData = await res.json();
        } catch(e) {
          errorData = { error: 'Server returned ' + res.status };
        }
        setAuthError(errorData.error || 'Failed to save profile');
      }
    } catch (e) {
      setAuthError('Network error');
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

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto w-full">
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Almost there</h2>
        <p className="text-slate-500">Please confirm your contact details.</p>
      </div>

      {authError && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
          {authError}
        </div>
      )}

      <form onSubmit={handleProfileSubmit(onProfileSubmit, onError)} className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">First Name</label>
            <input 
              type="text" 
              {...registerProfile('firstName')}
              className={cn("w-full px-4 py-2.5 rounded-xl border outline-none bg-slate-50 transition-colors text-sm", profileErrors.firstName ? "border-red-500 focus:ring-2 focus:ring-red-500" : "border-slate-300 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600")}
            />
            {profileErrors.firstName && <p className="text-xs text-red-500 font-bold mt-1">{(profileErrors.firstName as any).message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Last Name</label>
            <input 
              type="text" 
              {...registerProfile('lastName')}
              className={cn("w-full px-4 py-2.5 rounded-xl border outline-none bg-slate-50 transition-colors text-sm", profileErrors.lastName ? "border-red-500 focus:ring-2 focus:ring-red-500" : "border-slate-300 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600")}
            />
            {profileErrors.lastName && <p className="text-xs text-red-500 font-bold mt-1">{(profileErrors.lastName as any).message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700">Email Address</label>
          <input 
            type="email" 
            {...registerProfile('email')}
            className={cn("w-full px-4 py-2.5 rounded-xl border outline-none bg-slate-50 transition-colors text-sm", profileErrors.email ? "border-red-500 focus:ring-2 focus:ring-red-500" : "border-slate-300 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600")}
          />
          {profileErrors.email && <p className="text-xs text-red-500 font-bold mt-1">{(profileErrors.email as any).message}</p>}
        </div>
        
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
              className={cn("w-full px-4 py-2.5 rounded-xl border outline-none bg-slate-50 transition-colors text-sm", (profileErrors.city || profileErrors.state) ? "border-red-500 focus:ring-2 focus:ring-red-500" : "border-slate-300 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600")}
            />
            {showLocDropdown && locOptions.length > 0 && (
              <ul className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-auto text-sm py-1">
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
                    className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-slate-700 transition-colors font-medium"
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

        <div className="pt-6">
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Continue to Experience'}
          </button>
        </div>
      </form>
    </div>
  );
});

export default StepOne;